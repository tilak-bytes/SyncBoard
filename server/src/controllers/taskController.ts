import { Response, NextFunction } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import { Task } from '../models/Task';
import { Board } from '../models/Board';
import { Column } from '../models/Column';
import { Comment } from '../models/Comment';
import { ActivityLog } from '../models/ActivityLog';
import { AuthRequest } from '../types';
import { getSocketIO } from '../socket/socketServer';
import { logActivity } from '../utils/auditLogger';

export const createTaskSchema = z.object({
  title: z.string().min(1, 'Task title is required').max(200),
  description: z.string().optional().default(''),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  dueDate: z.string().nullable().optional(),
  labels: z.array(z.string()).default([]),
  assignees: z.array(z.string()).default([]),
  checklist: z
    .array(
      z.object({
        id: z.string(),
        text: z.string(),
        completed: z.boolean(),
      })
    )
    .default([]),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  dueDate: z.string().nullable().optional(),
  labels: z.array(z.string()).optional(),
  assignees: z.array(z.string()).optional(),
  checklist: z
    .array(
      z.object({
        id: z.string(),
        text: z.string(),
        completed: z.boolean(),
      })
    )
    .optional(),
  version: z.number().optional(), // For optimistic locking
});

export const moveTaskSchema = z.object({
  destinationColumnId: z.string(),
  destinationIndex: z.number().min(0),
  sourceColumnId: z.string().optional(),
  version: z.number().optional(),
});

export const createTask = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const columnId = req.params.columnId;
    const column = await Column.findById(columnId);
    if (!column) {
      res.status(404).json({ success: false, message: 'Column not found' });
      return;
    }

    const board = await Board.findById(column.boardId);
    if (!board) {
      res.status(404).json({ success: false, message: 'Board not found' });
      return;
    }

    const { title, description, priority, dueDate, labels, assignees, checklist } = req.body;
    const userId = new mongoose.Types.ObjectId(req.user!.id);

    // Get highest order in this column
    const highestTask = await Task.findOne({ columnId }).sort({ order: -1 });
    const order = highestTask ? highestTask.order + 1 : 0;

    const task = await Task.create({
      title,
      description: description || '',
      boardId: column.boardId,
      columnId,
      order,
      priority: priority || 'medium',
      dueDate: dueDate ? new Date(dueDate) : null,
      labels: labels || [],
      assignees: (assignees || []).map((id: string) => new mongoose.Types.ObjectId(id)),
      checklist: checklist || [],
      version: 1,
      createdBy: userId,
    });

    await logActivity({
      workspaceId: board.workspace,
      boardId: board._id,
      actorId: userId,
      action: 'task:created',
      details: {
        taskId: task._id,
        taskTitle: title,
        columnTitle: column.title,
        priority: task.priority,
      },
    });

    const populated = await Task.findById(task._id)
      .populate('assignees', 'name email avatar')
      .populate('createdBy', 'name email avatar');

    const io = getSocketIO();
    if (io) {
      io.to(`board:${column.boardId.toString()}`).emit('task:created', populated);
    }

    res.status(201).json({ success: true, message: 'Task created successfully', task: populated });
  } catch (error) {
    next(error);
  }
};

export const getTask = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignees', 'name email avatar')
      .populate('createdBy', 'name email avatar');

    if (!task) {
      res.status(404).json({ success: false, message: 'Task not found' });
      return;
    }

    const comments = await Comment.find({ taskId: task._id })
      .populate('user', 'name email avatar')
      .sort({ createdAt: 1 });

    const activities = await ActivityLog.find({
      'details.taskId': task._id.toString(),
    })
      .populate('actor', 'name email avatar')
      .sort({ createdAt: -1 })
      .limit(20);

    res.status(200).json({
      success: true,
      task,
      comments,
      activities,
    });
  } catch (error) {
    next(error);
  }
};

// Update task with Optimistic Concurrency Control (OCC)
export const updateTask = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const taskId = req.params.id;
    const { title, description, priority, dueDate, labels, assignees, checklist, version } = req.body;

    const existingTask = await Task.findById(taskId);
    if (!existingTask) {
      res.status(404).json({ success: false, message: 'Task not found' });
      return;
    }

    // OCC Check: If client sent a version and it doesn't match current DB version, reject with 409 Conflict
    if (version !== undefined && existingTask.version !== version) {
      const latestTask = await Task.findById(taskId)
        .populate('assignees', 'name email avatar')
        .populate('createdBy', 'name email avatar');

      res.status(409).json({
        success: false,
        conflict: true,
        message: 'Concurrency Conflict: This task was modified by another collaborator.',
        currentVersion: existingTask.version,
        latestTask,
      });
      return;
    }

    const updates: any = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (priority !== undefined) updates.priority = priority;
    if (dueDate !== undefined) updates.dueDate = dueDate ? new Date(dueDate) : null;
    if (labels !== undefined) updates.labels = labels;
    if (assignees !== undefined) {
      updates.assignees = assignees.map((id: string) => new mongoose.Types.ObjectId(id));
    }
    if (checklist !== undefined) updates.checklist = checklist;

    // Atomically increment version
    const updatedTask = await Task.findOneAndUpdate(
      {
        _id: taskId,
        ...(version !== undefined ? { version } : {}),
      },
      {
        $set: updates,
        $inc: { version: 1 },
      },
      { new: true }
    )
      .populate('assignees', 'name email avatar')
      .populate('createdBy', 'name email avatar');

    if (!updatedTask) {
      // Race condition occurred between check and update
      const freshTask = await Task.findById(taskId)
        .populate('assignees', 'name email avatar')
        .populate('createdBy', 'name email avatar');

      res.status(409).json({
        success: false,
        conflict: true,
        message: 'Concurrency Conflict: Concurrent edit detected.',
        latestTask: freshTask,
      });
      return;
    }

    const board = await Board.findById(updatedTask.boardId);
    if (board) {
      await logActivity({
        workspaceId: board.workspace,
        boardId: board._id,
        actorId: req.user!.id,
        action: 'task:updated',
        details: {
          taskId: updatedTask._id,
          taskTitle: updatedTask.title,
          changes: Object.keys(updates),
          newVersion: updatedTask.version,
        },
      });
    }

    const io = getSocketIO();
    if (io) {
      io.to(`board:${updatedTask.boardId.toString()}`).emit('task:updated', updatedTask);
    }

    res.status(200).json({ success: true, message: 'Task updated successfully', task: updatedTask });
  } catch (error) {
    next(error);
  }
};

// Drag-and-drop Move & Reorder handler
export const moveTask = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const taskId = req.params.id;
    const { destinationColumnId, destinationIndex, sourceColumnId, version } = req.body;

    const task = await Task.findById(taskId);
    if (!task) {
      res.status(404).json({ success: false, message: 'Task not found' });
      return;
    }

    // OCC Check for concurrent moves/edits
    if (version !== undefined && task.version !== version) {
      const freshTask = await Task.findById(taskId)
        .populate('assignees', 'name email avatar')
        .populate('createdBy', 'name email avatar');

      res.status(409).json({
        success: false,
        conflict: true,
        message: 'Concurrency Conflict: Task position or details were changed by another user.',
        latestTask: freshTask,
      });
      return;
    }

    const fromColId = task.columnId.toString();
    const toColId = destinationColumnId;
    const boardId = task.boardId.toString();

    const isCrossColumn = fromColId !== toColId;

    if (isCrossColumn) {
      // 1. Shift tasks down in destination column at or after destinationIndex
      await Task.updateMany(
        { columnId: toColId, order: { $gte: destinationIndex } },
        { $inc: { order: 1 } }
      );

      // 2. Shift tasks up in source column after current order
      await Task.updateMany(
        { columnId: fromColId, order: { $gt: task.order } },
        { $inc: { order: -1 } }
      );

      // 3. Update moving task
      task.columnId = new mongoose.Types.ObjectId(toColId);
      task.order = destinationIndex;
      task.version += 1;
      await task.save();
    } else {
      // Reordering within the same column
      const oldIndex = task.order;
      const newIndex = destinationIndex;

      if (oldIndex < newIndex) {
        // Moved down: shift intervening tasks UP (-1)
        await Task.updateMany(
          { columnId: fromColId, order: { $gt: oldIndex, $lte: newIndex }, _id: { $ne: task._id } },
          { $inc: { order: -1 } }
        );
      } else if (oldIndex > newIndex) {
        // Moved up: shift intervening tasks DOWN (+1)
        await Task.updateMany(
          { columnId: fromColId, order: { $gte: newIndex, $lt: oldIndex }, _id: { $ne: task._id } },
          { $inc: { order: 1 } }
        );
      }

      task.order = newIndex;
      task.version += 1;
      await task.save();
    }

    const populatedTask = await Task.findById(task._id)
      .populate('assignees', 'name email avatar')
      .populate('createdBy', 'name email avatar');

    const sourceColumn = await Column.findById(fromColId);
    const destColumn = await Column.findById(toColId);
    const board = await Board.findById(boardId);

    if (board && isCrossColumn) {
      await logActivity({
        workspaceId: board.workspace,
        boardId: board._id,
        actorId: req.user!.id,
        action: 'task:moved',
        details: {
          taskId: task._id,
          taskTitle: task.title,
          fromColumn: sourceColumn?.title || 'Unknown',
          toColumn: destColumn?.title || 'Unknown',
        },
      });
    }

    // Fetch all tasks in affected columns to broadcast synchronized ordering
    const affectedTasks = await Task.find({
      columnId: { $in: [fromColId, toColId] },
    })
      .populate('assignees', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .sort({ order: 1 });

    const io = getSocketIO();
    if (io) {
      io.to(`board:${boardId}`).emit('task:moved', {
        taskId: task._id.toString(),
        sourceColumnId: fromColId,
        destinationColumnId: toColId,
        destinationIndex,
        task: populatedTask,
        affectedTasks,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Task moved successfully',
      task: populatedTask,
      affectedTasks,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteTask = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const taskId = req.params.id;
    const task = await Task.findById(taskId);
    if (!task) {
      res.status(404).json({ success: false, message: 'Task not found' });
      return;
    }

    const boardId = task.boardId.toString();
    const columnId = task.columnId.toString();
    const taskTitle = task.title;

    // Shift orders in column
    await Task.updateMany(
      { columnId, order: { $gt: task.order } },
      { $inc: { order: -1 } }
    );

    await Comment.deleteMany({ taskId });
    await Task.findByIdAndDelete(taskId);

    const board = await Board.findById(boardId);
    if (board) {
      await logActivity({
        workspaceId: board.workspace,
        boardId: board._id,
        actorId: req.user!.id,
        action: 'task:deleted',
        details: { taskId, taskTitle },
      });
    }

    const io = getSocketIO();
    if (io) {
      io.to(`board:${boardId}`).emit('task:deleted', { taskId, columnId });
    }

    res.status(200).json({ success: true, message: 'Task deleted successfully', taskId });
  } catch (error) {
    next(error);
  }
};
