import { Response, NextFunction } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import { Comment } from '../models/Comment';
import { Task } from '../models/Task';
import { Board } from '../models/Board';
import { AuthRequest } from '../types';
import { getSocketIO } from '../socket/socketServer';
import { logActivity } from '../utils/auditLogger';

export const createCommentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty').max(1000),
});

export const getComments = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const taskId = req.params.taskId;
    const comments = await Comment.find({ taskId })
      .populate('user', 'name email avatar')
      .sort({ createdAt: 1 });

    res.status(200).json({ success: true, comments });
  } catch (error) {
    next(error);
  }
};

export const createComment = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const taskId = req.params.taskId;
    const { content } = req.body;
    const userId = new mongoose.Types.ObjectId(req.user!.id);

    const task = await Task.findById(taskId);
    if (!task) {
      res.status(404).json({ success: false, message: 'Task not found' });
      return;
    }

    const comment = await Comment.create({
      taskId,
      boardId: task.boardId,
      user: userId,
      content,
    });

    const populated = await Comment.findById(comment._id).populate('user', 'name email avatar');

    const board = await Board.findById(task.boardId);
    if (board) {
      await logActivity({
        workspaceId: board.workspace,
        boardId: board._id,
        actorId: userId,
        action: 'comment:added',
        details: { taskId: task._id, taskTitle: task.title, commentId: comment._id },
      });
    }

    const io = getSocketIO();
    if (io) {
      io.to(`board:${task.boardId.toString()}`).emit('comment:created', {
        taskId,
        comment: populated,
      });
    }

    res.status(201).json({ success: true, message: 'Comment added', comment: populated });
  } catch (error) {
    next(error);
  }
};

export const deleteComment = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const commentId = req.params.id;
    const comment = await Comment.findById(commentId);
    if (!comment) {
      res.status(404).json({ success: false, message: 'Comment not found' });
      return;
    }

    // Check if user is author
    if (comment.user.toString() !== req.user!.id) {
      res.status(403).json({ success: false, message: 'You can only delete your own comments' });
      return;
    }

    const boardId = comment.boardId.toString();
    const taskId = comment.taskId.toString();
    await Comment.findByIdAndDelete(commentId);

    const io = getSocketIO();
    if (io) {
      io.to(`board:${boardId}`).emit('comment:deleted', { taskId, commentId });
    }

    res.status(200).json({ success: true, message: 'Comment deleted', commentId });
  } catch (error) {
    next(error);
  }
};
