import { Response, NextFunction } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import { Board } from '../models/Board';
import { Workspace } from '../models/Workspace';
import { Column } from '../models/Column';
import { Task } from '../models/Task';
import { Comment } from '../models/Comment';
import { ActivityLog } from '../models/ActivityLog';
import { AuthRequest } from '../types';
import { getSocketIO } from '../socket/socketServer';
import { logActivity } from '../utils/auditLogger';

export const createBoardSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters').max(100),
  description: z.string().max(500).optional(),
  background: z.string().default('gradient-sunset'),
});

export const updateBoardSchema = z.object({
  title: z.string().min(2).max(100).optional(),
  description: z.string().max(500).optional(),
  background: z.string().optional(),
  isStarred: z.boolean().optional(),
});

export const getBoardsByWorkspace = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const workspaceId = req.params.workspaceId;
    const boards = await Board.find({ workspace: workspaceId })
      .populate('createdBy', 'name email avatar')
      .sort({ isStarred: -1, updatedAt: -1 });

    const boardIds = boards.map((b) => b._id);
    const taskCounts = await Task.aggregate([
      { $match: { boardId: { $in: boardIds } } },
      { $group: { _id: '$boardId', count: { $sum: 1 } } },
    ]);

    const taskCountMap = new Map<string, number>();
    taskCounts.forEach((tc) => taskCountMap.set(tc._id.toString(), tc.count));

    const result = boards.map((b) => ({
      ...b.toObject(),
      taskCount: taskCountMap.get(b._id.toString()) || 0,
    }));

    res.status(200).json({ success: true, boards: result });
  } catch (error) {
    next(error);
  }
};

export const createBoard = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const workspaceId = req.params.workspaceId;
    const { title, description, background } = req.body;
    const userId = new mongoose.Types.ObjectId(req.user!.id);

    const board = await Board.create({
      title,
      description: description || '',
      workspace: workspaceId,
      background: background || 'gradient-sunset',
      createdBy: userId,
    });

    // Create default starter columns
    const defaultCols = [
      { title: 'To Do', color: '#f59e0b', order: 0 },
      { title: 'In Progress', color: '#3b82f6', order: 1 },
      { title: 'Review', color: '#8b5cf6', order: 2 },
      { title: 'Done', color: '#10b981', order: 3 },
    ];

    const createdColumns = await Promise.all(
      defaultCols.map((c) =>
        Column.create({
          title: c.title,
          color: c.color,
          order: c.order,
          boardId: board._id,
        })
      )
    );

    await logActivity({
      workspaceId,
      boardId: board._id,
      actorId: userId,
      action: 'board:created',
      details: { boardTitle: title },
    });

    const populated = await Board.findById(board._id).populate('createdBy', 'name email avatar');

    const io = getSocketIO();
    if (io) {
      io.to(`workspace:${workspaceId}`).emit('board:created', populated);
    }

    res.status(201).json({
      success: true,
      message: 'Board created successfully',
      board: populated,
      columns: createdColumns,
    });
  } catch (error) {
    next(error);
  }
};

export const getBoard = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const boardId = req.params.id;
    const board = await Board.findById(boardId)
      .populate('createdBy', 'name email avatar')
      .populate({
        path: 'workspace',
        populate: [
          { path: 'owner', select: 'name email avatar' },
          { path: 'members.user', select: 'name email avatar' },
        ],
      });

    if (!board) {
      res.status(404).json({ success: false, message: 'Board not found' });
      return;
    }

    const columns = await Column.find({ boardId }).sort({ order: 1 });
    const tasks = await Task.find({ boardId })
      .populate('assignees', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .sort({ order: 1 });

    res.status(200).json({
      success: true,
      board: {
        ...board.toObject(),
        currentUserRole: req.workspaceRole,
      },
      columns,
      tasks,
    });
  } catch (error) {
    next(error);
  }
};

export const updateBoard = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const boardId = req.params.id;
    const { title, description, background, isStarred } = req.body;

    const updates: any = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (background !== undefined) updates.background = background;
    if (isStarred !== undefined) updates.isStarred = isStarred;

    const board = await Board.findByIdAndUpdate(boardId, { $set: updates }, { new: true })
      .populate('createdBy', 'name email avatar');

    if (!board) {
      res.status(404).json({ success: false, message: 'Board not found' });
      return;
    }

    const io = getSocketIO();
    if (io) {
      io.to(`board:${boardId}`).emit('board:updated', board);
      io.to(`workspace:${board.workspace.toString()}`).emit('board:updated', board);
    }

    res.status(200).json({ success: true, message: 'Board updated successfully', board });
  } catch (error) {
    next(error);
  }
};

export const deleteBoard = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const boardId = req.params.id;
    const board = await Board.findById(boardId);
    if (!board) {
      res.status(404).json({ success: false, message: 'Board not found' });
      return;
    }

    await Task.deleteMany({ boardId });
    await Column.deleteMany({ boardId });
    await Comment.deleteMany({ boardId });
    await ActivityLog.deleteMany({ boardId });
    await Board.findByIdAndDelete(boardId);

    const io = getSocketIO();
    if (io) {
      io.to(`workspace:${board.workspace.toString()}`).emit('board:deleted', { boardId });
    }

    res.status(200).json({ success: true, message: 'Board and all associated cards deleted' });
  } catch (error) {
    next(error);
  }
};

// Delta Sync on Reconnect
export const syncBoard = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const boardId = req.params.id;
    const since = req.query.since ? new Date(req.query.since as string) : new Date(0);

    const updatedTasks = await Task.find({
      boardId,
      updatedAt: { $gt: since },
    })
      .populate('assignees', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .sort({ order: 1 });

    const updatedColumns = await Column.find({
      boardId,
      updatedAt: { $gt: since },
    }).sort({ order: 1 });

    const newComments = await Comment.find({
      boardId,
      createdAt: { $gt: since },
    })
      .populate('user', 'name email avatar')
      .sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      syncedAt: new Date().toISOString(),
      tasks: updatedTasks,
      columns: updatedColumns,
      comments: newComments,
    });
  } catch (error) {
    next(error);
  }
};
