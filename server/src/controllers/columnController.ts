import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { Column } from '../models/Column';
import { Board } from '../models/Board';
import { Task } from '../models/Task';
import { AuthRequest } from '../types';
import { getSocketIO } from '../socket/socketServer';
import { logActivity } from '../utils/auditLogger';

export const createColumnSchema = z.object({
  title: z.string().min(1, 'Column title is required').max(50),
  color: z.string().optional(),
});

export const updateColumnSchema = z.object({
  title: z.string().min(1).max(50).optional(),
  color: z.string().optional(),
});

export const reorderColumnsSchema = z.object({
  columns: z.array(
    z.object({
      id: z.string(),
      order: z.number(),
    })
  ),
});

export const createColumn = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const boardId = req.params.boardId;
    const { title, color } = req.body;

    const highestColumn = await Column.findOne({ boardId }).sort({ order: -1 });
    const order = highestColumn ? highestColumn.order + 1 : 0;

    const column = await Column.create({
      title,
      boardId,
      order,
      color: color || '#6366f1',
    });

    const board = await Board.findById(boardId);
    if (board) {
      await logActivity({
        workspaceId: board.workspace,
        boardId: board._id,
        actorId: req.user!.id,
        action: 'column:created',
        details: { columnTitle: title },
      });
    }

    const io = getSocketIO();
    if (io) {
      io.to(`board:${boardId}`).emit('column:created', column);
    }

    res.status(201).json({ success: true, message: 'Column created', column });
  } catch (error) {
    next(error);
  }
};

export const updateColumn = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const columnId = req.params.id;
    const { title, color } = req.body;

    const column = await Column.findById(columnId);
    if (!column) {
      res.status(404).json({ success: false, message: 'Column not found' });
      return;
    }

    if (title) column.title = title;
    if (color) column.color = color;
    await column.save();

    const io = getSocketIO();
    if (io) {
      io.to(`board:${column.boardId.toString()}`).emit('column:updated', column);
    }

    res.status(200).json({ success: true, message: 'Column updated', column });
  } catch (error) {
    next(error);
  }
};

export const reorderColumns = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const boardId = req.params.boardId;
    const { columns } = req.body as { columns: Array<{ id: string; order: number }> };

    const bulkOps = columns.map((col) => ({
      updateOne: {
        filter: { _id: col.id, boardId },
        update: { $set: { order: col.order } },
      },
    }));

    if (bulkOps.length > 0) {
      await Column.bulkWrite(bulkOps);
    }

    const updated = await Column.find({ boardId }).sort({ order: 1 });

    const io = getSocketIO();
    if (io) {
      io.to(`board:${boardId}`).emit('columns:reordered', updated);
    }

    res.status(200).json({ success: true, message: 'Columns reordered', columns: updated });
  } catch (error) {
    next(error);
  }
};

export const deleteColumn = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const columnId = req.params.id;
    const column = await Column.findById(columnId);
    if (!column) {
      res.status(404).json({ success: false, message: 'Column not found' });
      return;
    }

    const boardId = column.boardId.toString();

    // Delete tasks in this column
    await Task.deleteMany({ columnId });
    await Column.findByIdAndDelete(columnId);

    const io = getSocketIO();
    if (io) {
      io.to(`board:${boardId}`).emit('column:deleted', { columnId });
    }

    res.status(200).json({ success: true, message: 'Column and its tasks deleted' });
  } catch (error) {
    next(error);
  }
};
