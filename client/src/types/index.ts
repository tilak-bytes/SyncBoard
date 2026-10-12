export type UserRole = 'owner' | 'admin' | 'member' | 'viewer';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
}

export interface WorkspaceMember {
  user: User;
  role: UserRole;
  joinedAt: string;
}

export interface Workspace {
  _id: string;
  name: string;
  description?: string;
  owner: User;
  members: WorkspaceMember[];
  boardCount?: number;
  currentUserRole?: UserRole;
  boards?: Board[];
  createdAt: string;
  updatedAt: string;
}

export interface Board {
  _id: string;
  title: string;
  description?: string;
  workspace: string | Workspace;
  background: string;
  isStarred: boolean;
  createdBy: User;
  taskCount?: number;
  currentUserRole?: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface Column {
  _id: string;
  title: string;
  boardId: string;
  order: number;
  color?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface Task {
  _id: string;
  title: string;
  description: string;
  boardId: string;
  columnId: string;
  order: number;
  priority: TaskPriority;
  dueDate: string | null;
  labels: string[];
  assignees: User[];
  checklist: ChecklistItem[];
  version: number;
  createdBy: User;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  _id: string;
  taskId: string;
  boardId: string;
  user: User;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityLog {
  _id: string;
  workspaceId: string;
  boardId?: string;
  actor: User;
  action: string;
  details: Record<string, any>;
  createdAt: string;
}

export interface ActiveUser {
  userId: string;
  name: string;
  email: string;
  avatar: string;
  socketId: string;
}
