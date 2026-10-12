import { Response, NextFunction } from 'express';
import { ActivityLog } from '../models/ActivityLog';
import { AuthRequest } from '../types';

export const getBoardActivity = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const boardId = req.params.boardId;
    const activities = await ActivityLog.find({ boardId })
      .populate('actor', 'name email avatar')
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({ success: true, activities });
  } catch (error) {
    next(error);
  }
};

export const getWorkspaceActivity = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const workspaceId = req.params.workspaceId;
    const activities = await ActivityLog.find({ workspaceId })
      .populate('actor', 'name email avatar')
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({ success: true, activities });
  } catch (error) {
    next(error);
  }
};
