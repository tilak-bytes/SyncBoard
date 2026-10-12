import axios from 'axios';
import {
  User,
  Workspace,
  Board,
  Column,
  Task,
  Comment,
  ActivityLog,
  UserRole,
  TaskPriority,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('syncboard_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle 401 unauthenticated
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // If unauthorized, remove stale token and redirect to login if not already on login page
      localStorage.removeItem('syncboard_token');
      localStorage.removeItem('syncboard_user');
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        // can dispatch custom event or let AuthContext handle state
        window.dispatchEvent(new Event('auth:unauthorized'));
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  register: (data: { name: string; email: string; password: string }) =>
    api.post<{ success: boolean; token: string; user: User }>('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post<{ success: boolean; token: string; user: User }>('/auth/login', data),
  getMe: () => api.get<{ success: boolean; user: User }>('/auth/me'),
  updateProfile: (data: { name?: string; avatar?: string }) =>
    api.put<{ success: boolean; user: User }>('/auth/profile', data),
};

// Workspace API
export const workspaceApi = {
  getAll: () => api.get<{ success: boolean; workspaces: Workspace[] }>('/workspaces'),
  getById: (id: string) => api.get<{ success: boolean; workspace: Workspace }>(`/workspaces/${id}`),
  create: (data: { name: string; description?: string }) =>
    api.post<{ success: boolean; workspace: Workspace }>('/workspaces', data),
  update: (id: string, data: { name?: string; description?: string }) =>
    api.put<{ success: boolean; workspace: Workspace }>(`/workspaces/${id}`, data),
  delete: (id: string) => api.delete<{ success: boolean }>(`/workspaces/${id}`),
  addMember: (id: string, data: { email: string; role: UserRole }) =>
    api.post<{ success: boolean; message?: string; workspace: Workspace }>(
      `/workspaces/${id}/members`,
      data
    ),
  updateMemberRole: (id: string, userId: string, role: UserRole) =>
    api.put<{ success: boolean; message?: string }>(`/workspaces/${id}/members/${userId}`, { role }),
  removeMember: (id: string, userId: string) =>
    api.delete<{ success: boolean; message?: string }>(`/workspaces/${id}/members/${userId}`),
};

// Board API
export const boardApi = {
  getByWorkspace: (workspaceId: string) =>
    api.get<{ success: boolean; boards: Board[] }>(`/workspaces/${workspaceId}/boards`),
  getById: (id: string) =>
    api.get<{ success: boolean; board: Board; columns: Column[]; tasks: Task[] }>(`/boards/${id}`),
  create: (workspaceId: string, data: { title: string; description?: string; background?: string }) =>
    api.post<{ success: boolean; board: Board; columns: Column[] }>(
      `/workspaces/${workspaceId}/boards`,
      data
    ),
  update: (
    id: string,
    data: { title?: string; description?: string; background?: string; isStarred?: boolean }
  ) => api.put<{ success: boolean; board: Board }>(`/boards/${id}`, data),
  delete: (id: string) => api.delete<{ success: boolean }>(`/boards/${id}`),
  sync: (id: string, since: string) =>
    api.get<{
      success: boolean;
      syncedAt: string;
      tasks: Task[];
      columns: Column[];
      comments: Comment[];
    }>(`/boards/${id}/sync?since=${encodeURIComponent(since)}`),
};

// Column API
export const columnApi = {
  create: (boardId: string, data: { title: string; color?: string }) =>
    api.post<{ success: boolean; column: Column }>(`/boards/${boardId}/columns`, data),
  update: (id: string, data: { title?: string; color?: string }) =>
    api.put<{ success: boolean; column: Column }>(`/columns/${id}`, data),
  reorder: (boardId: string, columns: Array<{ id: string; order: number }>) =>
    api.put<{ success: boolean; columns: Column[] }>(`/boards/${boardId}/columns/reorder`, {
      columns,
    }),
  delete: (id: string) => api.delete<{ success: boolean }>(`/columns/${id}`),
};

// Task API
export const taskApi = {
  create: (
    columnId: string,
    data: {
      title: string;
      description?: string;
      priority?: TaskPriority;
      dueDate?: string | null;
      labels?: string[];
      assignees?: string[];
      checklist?: Array<{ id: string; text: string; completed: boolean }>;
    }
  ) => api.post<{ success: boolean; task: Task }>(`/columns/${columnId}/tasks`, data),
  getById: (id: string) =>
    api.get<{ success: boolean; task: Task; comments: Comment[]; activities: ActivityLog[] }>(
      `/tasks/${id}`
    ),
  update: (
    id: string,
    data: {
      title?: string;
      description?: string;
      priority?: TaskPriority;
      dueDate?: string | null;
      labels?: string[];
      assignees?: any[];
      checklist?: Array<{ id: string; text: string; completed: boolean }>;
      version?: number;
    }
  ) => api.put<{ success: boolean; task: Task }>(`/tasks/${id}`, data),
  move: (
    id: string,
    data: {
      destinationColumnId: string;
      destinationIndex: number;
      sourceColumnId?: string;
      version?: number;
    }
  ) =>
    api.put<{ success: boolean; task: Task; affectedTasks: Task[] }>(`/tasks/${id}/move`, data),
  delete: (id: string) => api.delete<{ success: boolean; taskId: string }>(`/tasks/${id}`),
};

// Comment API
export const commentApi = {
  getByTask: (taskId: string) =>
    api.get<{ success: boolean; comments: Comment[] }>(`/tasks/${taskId}/comments`),
  create: (taskId: string, content: string) =>
    api.post<{ success: boolean; comment: Comment }>(`/tasks/${taskId}/comments`, { content }),
  delete: (id: string) => api.delete<{ success: boolean }>(`/comments/${id}`),
};

// Activity API
export const activityApi = {
  getBoardActivity: (boardId: string) =>
    api.get<{ success: boolean; activities: ActivityLog[] }>(`/boards/${boardId}/activity`),
  getWorkspaceActivity: (workspaceId: string) =>
    api.get<{ success: boolean; activities: ActivityLog[] }>(
      `/workspaces/${workspaceId}/activity`
    ),
};
