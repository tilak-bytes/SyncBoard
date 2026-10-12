import { Response, NextFunction } from 'express';
import { AuthRequest, UserRole } from '../types';
import { Workspace } from '../models/Workspace';
import { Board } from '../models/Board';

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  viewer: 1,
  member: 2,
  admin: 3,
  owner: 4,
};

export const hasPermission = (userRole: UserRole, requiredRole: UserRole): boolean => {
  return (ROLE_HIERARCHY[userRole] || 0) >= (ROLE_HIERARCHY[requiredRole] || 0);
};

export const requireWorkspaceRole = (minRole: UserRole) => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const workspaceId =
        req.params.workspaceId || req.params.id || req.body.workspaceId || req.query.workspaceId;

      if (!workspaceId) {
        res.status(400).json({ success: false, message: 'Workspace ID is required' });
        return;
      }

      const workspace = await Workspace.findById(workspaceId);
      if (!workspace) {
        res.status(404).json({ success: false, message: 'Workspace not found' });
        return;
      }

      // Determine user's role in this workspace
      let userRole: UserRole | null = null;
      if (workspace.owner.toString() === req.user.id) {
        userRole = 'owner';
      } else {
        const member = workspace.members.find((m) => m.user.toString() === req.user!.id);
        if (member) {
          userRole = member.role;
        }
      }

      if (!userRole) {
        res.status(403).json({
          success: false,
          message: 'Access denied: You are not a member of this workspace',
        });
        return;
      }

      if (!hasPermission(userRole, minRole)) {
        res.status(403).json({
          success: false,
          message: `Access denied: Requires '${minRole}' role or higher. Your role: '${userRole}'`,
        });
        return;
      }

      req.workspaceRole = userRole;
      req.workspaceId = workspace._id.toString();
      next();
    } catch (error: any) {
      next(error);
    }
  };
};

export const requireBoardRole = (minRole: UserRole) => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const boardId =
        req.params.boardId || req.params.id || req.body.boardId || req.query.boardId;

      if (!boardId) {
        res.status(400).json({ success: false, message: 'Board ID is required' });
        return;
      }

      const board = await Board.findById(boardId);
      if (!board) {
        res.status(404).json({ success: false, message: 'Board not found' });
        return;
      }

      const workspace = await Workspace.findById(board.workspace);
      if (!workspace) {
        res.status(404).json({ success: false, message: 'Parent workspace not found' });
        return;
      }

      let userRole: UserRole | null = null;
      if (workspace.owner.toString() === req.user.id) {
        userRole = 'owner';
      } else {
        const member = workspace.members.find((m) => m.user.toString() === req.user!.id);
        if (member) {
          userRole = member.role;
        }
      }

      if (!userRole) {
        res.status(403).json({
          success: false,
          message: 'Access denied: You are not a member of this board workspace',
        });
        return;
      }

      if (!hasPermission(userRole, minRole)) {
        res.status(403).json({
          success: false,
          message: `Access denied: Requires '${minRole}' role or higher. Your role: '${userRole}'`,
        });
        return;
      }

      req.workspaceRole = userRole;
      req.workspaceId = workspace._id.toString();
      req.boardId = board._id.toString();
      next();
    } catch (error: any) {
      next(error);
    }
  };
};
