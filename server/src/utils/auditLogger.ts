import mongoose from 'mongoose';
import { ActivityLog } from '../models/ActivityLog';
import { getSocketIO } from '../socket/socketServer';

interface LogActionParams {
  workspaceId: string | mongoose.Types.ObjectId;
  boardId?: string | mongoose.Types.ObjectId;
  actorId: string | mongoose.Types.ObjectId;
  action: string;
  details?: Record<string, any>;
}

export const logActivity = async (params: LogActionParams): Promise<void> => {
  try {
    const activity = await ActivityLog.create({
      workspaceId: params.workspaceId,
      boardId: params.boardId,
      actor: params.actorId,
      action: params.action,
      details: params.details || {},
    });

    const populated = await ActivityLog.findById(activity._id).populate(
      'actor',
      'name email avatar'
    );

    const io = getSocketIO();
    if (io && populated) {
      if (params.boardId) {
        io.to(`board:${params.boardId.toString()}`).emit('activity:new', populated);
      }
      io.to(`workspace:${params.workspaceId.toString()}`).emit('activity:new', populated);
    }
  } catch (error) {
    console.error('[AuditLogger] Error recording activity:', error);
  }
};
