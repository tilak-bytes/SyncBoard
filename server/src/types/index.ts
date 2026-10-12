import { Request } from 'express';
import { Types } from 'mongoose';

export type UserRole = 'owner' | 'admin' | 'member' | 'viewer';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface IUserPayload {
  id: string;
  email: string;
  name: string;
}

export interface AuthRequest extends Request {
  user?: IUserPayload;
  workspaceRole?: UserRole;
  workspaceId?: string;
  boardId?: string;
}

export interface IChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface IActiveUser {
  userId: string;
  name: string;
  email: string;
  avatar: string;
  socketId: string;
}
