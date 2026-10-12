import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Navbar } from '../components/Navbar';
import { FilterBar } from '../components/FilterBar';
import { KanbanBoard } from '../components/KanbanBoard';
import { WorkspaceModal } from '../components/WorkspaceModal';
import { InviteMemberModal } from '../components/InviteMemberModal';
import { WorkspaceSettingsModal } from '../components/WorkspaceSettingsModal';
import { CreateColumnModal } from '../components/CreateColumnModal';
import { CreateBoardModal } from '../components/CreateBoardModal';
import { ActivityDrawer } from '../components/ActivityDrawer';
import { Workspace, Board, Column, Task, UserRole } from '../types';
import { workspaceApi, boardApi, columnApi, taskApi } from '../services/api';
import { useSocket } from '../context/SocketContext';
import { useToast } from '../context/ToastContext';

export const DashboardPage: React.FC = () => {
  const { socket, joinBoard, leaveBoard } = useSocket();
  const { addToast } = useToast();

  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);

  const [boards, setBoards] = useState<Board[]>([]);
  const [currentBoard, setCurrentBoard] = useState<Board | null>(null);

  const [columns, setColumns] = useState<Column[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [selectedAssignee, setSelectedAssignee] = useState('all');

  // Modals state
  const [isCreateWorkspaceOpen, setIsCreateWorkspaceOpen] = useState(false);
  const [isWorkspaceSettingsOpen, setIsWorkspaceSettingsOpen] = useState(false);
  const [isInviteMemberOpen, setIsInviteMemberOpen] = useState(false);
  const [isCreateColumnOpen, setIsCreateColumnOpen] = useState(false);
  const [isCreateBoardOpen, setIsCreateBoardOpen] = useState(false);
  const [isActivityDrawerOpen, setIsActivityDrawerOpen] = useState(false);

  const lastSyncedAtRef = useRef<string>(new Date().toISOString());

  // 1. Initial Load: Fetch Workspaces (with Offline Showcase Fallback)
  useEffect(() => {
    const loadWorkspaces = async () => {
      try {
        const res = await workspaceApi.getAll();
        if (res.data.success && res.data.workspaces.length > 0) {
          setWorkspaces(res.data.workspaces);
          setCurrentWorkspace(res.data.workspaces[0]);
          return;
        }
      } catch (err) {
        console.warn('API offline: using interactive showcase demo board');
      }

      // Offline / Live Showcase Fallback Mode
      const demoUsers = [
        { id: 'u1', name: 'Alex Chen', email: 'alex@syncboard.dev', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150' },
        { id: 'u2', name: 'Sarah Connor', email: 'sarah@syncboard.dev', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150' },
        { id: 'u3', name: 'Jordan Smith', email: 'jordan@syncboard.dev', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150' },
        { id: 'u4', name: 'Elena Rostova', email: 'elena@syncboard.dev', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150' },
      ];

      const demoWorkspace: Workspace = {
        _id: 'ws-demo',
        name: 'Acme Cloud Engineering',
        description: 'High-performance collaborative engineering workspace (Showcase Mode)',
        owner: demoUsers[0],
        members: [
          { user: demoUsers[0], role: 'owner', joinedAt: new Date().toISOString() },
          { user: demoUsers[1], role: 'admin', joinedAt: new Date().toISOString() },
          { user: demoUsers[2], role: 'member', joinedAt: new Date().toISOString() },
          { user: demoUsers[3], role: 'viewer', joinedAt: new Date().toISOString() },
        ],
        currentUserRole: 'owner',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const demoBoard: Board = {
        _id: 'b-demo',
        title: 'Sprint 42 - Core Platform',
        description: 'Interactive real-time collaborative Kanban board',
        workspace: 'ws-demo',
        background: 'gradient-sunset',
        isStarred: true,
        createdBy: demoUsers[0],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const demoColumns: Column[] = [
        { _id: 'c1', title: 'Backlog', boardId: 'b-demo', order: 0, color: '#64748b', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { _id: 'c2', title: 'To Do', boardId: 'b-demo', order: 1, color: '#f59e0b', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { _id: 'c3', title: 'In Progress', boardId: 'b-demo', order: 2, color: '#3b82f6', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { _id: 'c4', title: 'Review', boardId: 'b-demo', order: 3, color: '#8b5cf6', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { _id: 'c5', title: 'Done', boardId: 'b-demo', order: 4, color: '#10b981', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      ];

      const demoTasks: Task[] = [
        {
          _id: 't1',
          title: 'Implement WebSocket delta sync for network drops',
          description: 'Reconcile tasks without page reload on reconnect.',
          boardId: 'b-demo',
          columnId: 'c3',
          order: 0,
          priority: 'urgent',
          dueDate: new Date(Date.now() + 86400000 * 2).toISOString(),
          labels: ['realtime', 'socketio'],
          assignees: [demoUsers[0], demoUsers[2]],
          checklist: [
            { id: '1', text: 'Store lastSyncedAt timestamp in client state', completed: true },
            { id: '2', text: 'Listen for socket reconnect lifecycle event', completed: true },
            { id: '3', text: 'Merge server delta tasks into React Kanban store', completed: false },
          ],
          version: 1,
          createdBy: demoUsers[0],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          _id: 't2',
          title: 'Design Glassmorphism Kanban Column and Card UI',
          description: 'Sleek CSS tokens and modern drag ghost shadows.',
          boardId: 'b-demo',
          columnId: 'c5',
          order: 0,
          priority: 'high',
          dueDate: new Date(Date.now() + 86400000 * 4).toISOString(),
          labels: ['design', 'ui/ux'],
          assignees: [demoUsers[1]],
          checklist: [
            { id: '1', text: 'Configure CSS root design tokens', completed: true },
            { id: '2', text: 'Add fluid micro-interactions on task hover', completed: true },
          ],
          version: 2,
          createdBy: demoUsers[1],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          _id: 't3',
          title: 'Optimistic Concurrency Control (OCC) Version Conflict Handling',
          description: 'Zero lost updates by checking integer version on task mutations.',
          boardId: 'b-demo',
          columnId: 'c4',
          order: 0,
          priority: 'urgent',
          dueDate: new Date(Date.now() + 86400000).toISOString(),
          labels: ['backend', 'concurrency'],
          assignees: [demoUsers[0]],
          checklist: [
            { id: '1', text: 'Atomic findOneAndUpdate with version match', completed: true },
            { id: '2', text: 'Client toast alert with reconciliation', completed: true },
          ],
          version: 3,
          createdBy: demoUsers[0],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          _id: 't4',
          title: 'Role-Based Access Control (RBAC) Enforcement',
          description: 'Ensure Viewer accounts cannot move or mutate tasks.',
          boardId: 'b-demo',
          columnId: 'c2',
          order: 0,
          priority: 'medium',
          dueDate: new Date(Date.now() + 86400000 * 5).toISOString(),
          labels: ['security', 'rbac'],
          assignees: [demoUsers[1], demoUsers[0]],
          checklist: [
            { id: '1', text: 'Define hierarchy: Owner > Admin > Member > Viewer', completed: true },
            { id: '2', text: 'Disable drag handles for Viewers in frontend UI', completed: true },
          ],
          version: 1,
          createdBy: demoUsers[1],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      setWorkspaces([demoWorkspace]);
      setCurrentWorkspace(demoWorkspace);
      setBoards([demoBoard]);
      setCurrentBoard(demoBoard);
      setColumns(demoColumns);
      setTasks(demoTasks);
      setIsLoading(false);
    };
    loadWorkspaces();
  }, []);

  // 2. Fetch Boards when Current Workspace changes
  useEffect(() => {
    if (!currentWorkspace) return;

    const loadBoards = async () => {
      try {
        const res = await boardApi.getByWorkspace(currentWorkspace._id);
        if (res.data.success) {
          setBoards(res.data.boards);
          if (res.data.boards.length > 0) {
            // Pick starred board or first board
            const defaultBoard = res.data.boards.find((b) => b.isStarred) || res.data.boards[0];
            setCurrentBoard(defaultBoard);
          } else {
            setCurrentBoard(null);
            setColumns([]);
            setTasks([]);
          }
        }
      } catch (err) {
        console.error('Failed to load boards:', err);
      }
    };
    loadBoards();
  }, [currentWorkspace]);

  // 3. Load Board details (Columns + Tasks) & join Socket room
  useEffect(() => {
    if (!currentBoard) return;

    setIsLoading(true);
    const loadBoardData = async () => {
      try {
        const res = await boardApi.getById(currentBoard._id);
        if (res.data.success) {
          setColumns(res.data.columns);
          setTasks(res.data.tasks);
          lastSyncedAtRef.current = new Date().toISOString();

          // Join Socket room
          joinBoard(currentBoard._id);
        }
      } catch (err) {
        console.error('Failed to load board details:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadBoardData();

    return () => {
      leaveBoard(currentBoard._id);
    };
  }, [currentBoard?._id]);

  // 4. Real-time Socket Event Handlers & Delta Sync
  useEffect(() => {
    if (!socket || !currentBoard) return;

    // Task Events
    const handleTaskCreated = (newTask: Task) => {
      setTasks((prev) => {
        if (prev.some((t) => t._id === newTask._id)) return prev;
        return [...prev, newTask];
      });
    };

    const handleTaskUpdated = (updatedTask: Task) => {
      setTasks((prev) =>
        prev.map((t) => (t._id === updatedTask._id ? updatedTask : t))
      );
    };

    const handleTaskMoved = ({
      affectedTasks,
    }: any) => {
      if (!affectedTasks || !Array.isArray(affectedTasks)) return;
      setTasks((prev) => {
        const affectedMap = new Map<string, Task>(affectedTasks.map((t: Task) => [t._id, t]));
        return prev.map((t) => affectedMap.get(t._id) || t);
      });
    };

    const handleTaskDeleted = ({ taskId }: { taskId: string }) => {
      setTasks((prev) => prev.filter((t) => t._id !== taskId));
    };

    // Column Events
    const handleColumnCreated = (newCol: Column) => {
      setColumns((prev) => {
        if (prev.some((c) => c._id === newCol._id)) return prev;
        return [...prev, newCol].sort((a, b) => a.order - b.order);
      });
    };

    const handleColumnUpdated = (updatedCol: Column) => {
      setColumns((prev) =>
        prev.map((c) => (c._id === updatedCol._id ? updatedCol : c))
      );
    };

    const handleColumnsReordered = (reordered: Column[]) => {
      setColumns(reordered);
    };

    const handleColumnDeleted = ({ columnId }: { columnId: string }) => {
      setColumns((prev) => prev.filter((c) => c._id !== columnId));
      setTasks((prev) => prev.filter((t) => t.columnId !== columnId));
    };

    // Board Events
    const handleBoardUpdated = (updatedBoard: Board) => {
      if (updatedBoard._id === currentBoard._id) {
        setCurrentBoard(updatedBoard);
      }
      setBoards((prev) =>
        prev.map((b) => (b._id === updatedBoard._id ? updatedBoard : b))
      );
    };

    // Reconnection Delta Sync
    const handleReconnect = async () => {
      try {
        const res = await boardApi.sync(currentBoard._id, lastSyncedAtRef.current);
        if (res.data.success) {
          lastSyncedAtRef.current = res.data.syncedAt;

          // Merge delta tasks
          if (res.data.tasks.length > 0) {
            const taskMap = new Map(res.data.tasks.map((t) => [t._id, t]));
            setTasks((prev) =>
              prev.map((t) => taskMap.get(t._id) || t)
            );
            addToast(`Synced ${res.data.tasks.length} updates after reconnect`, 'info');
          }
        }
      } catch (err) {
        console.error('Failed delta sync on reconnect:', err);
      }
    };

    socket.on('task:created', handleTaskCreated);
    socket.on('task:updated', handleTaskUpdated);
    socket.on('task:moved', handleTaskMoved);
    socket.on('task:deleted', handleTaskDeleted);
    socket.on('column:created', handleColumnCreated);
    socket.on('column:updated', handleColumnUpdated);
    socket.on('columns:reordered', handleColumnsReordered);
    socket.on('column:deleted', handleColumnDeleted);
    socket.on('board:updated', handleBoardUpdated);
    socket.on('connect', handleReconnect);

    return () => {
      socket.off('task:created', handleTaskCreated);
      socket.off('task:updated', handleTaskUpdated);
      socket.off('task:moved', handleTaskMoved);
      socket.off('task:deleted', handleTaskDeleted);
      socket.off('column:created', handleColumnCreated);
      socket.off('column:updated', handleColumnUpdated);
      socket.off('columns:reordered', handleColumnsReordered);
      socket.off('column:deleted', handleColumnDeleted);
      socket.off('board:updated', handleBoardUpdated);
      socket.off('connect', handleReconnect);
    };
  }, [socket, currentBoard?._id]);

  // Current user role in this workspace
  const currentUserRole: UserRole = currentWorkspace?.currentUserRole || 'member';
  const isViewer = currentUserRole === 'viewer';

  // Task Move handler with Optimistic UI & Concurrency Conflict check
  const handleMoveTask = async (
    taskId: string,
    sourceColId: string,
    destColId: string,
    destIndex: number,
    version?: number
  ): Promise<boolean> => {
    const prevTasks = [...tasks];

    // Optimistic local update
    const movingTask = tasks.find((t) => t._id === taskId);
    if (!movingTask) return false;

    const isSameColumn = sourceColId === destColId;

    if (isSameColumn) {
      const colTasks = tasks
        .filter((t) => t.columnId === sourceColId)
        .sort((a, b) => a.order - b.order);

      const oldIndex = colTasks.findIndex((t) => t._id === taskId);
      if (oldIndex !== -1) {
        colTasks.splice(oldIndex, 1);
        colTasks.splice(destIndex, 0, movingTask);
        colTasks.forEach((t, i) => (t.order = i));

        setTasks((prev) => {
          const colTaskMap = new Map(colTasks.map((t) => [t._id, t]));
          return prev.map((t) => colTaskMap.get(t._id) || t);
        });
      }
    } else {
      // Cross column
      movingTask.columnId = destColId;
      setTasks((prev) =>
        prev.map((t) => (t._id === taskId ? { ...t, columnId: destColId } : t))
      );
    }

    try {
      const res = await taskApi.move(taskId, {
        destinationColumnId: destColId,
        destinationIndex: destIndex,
        sourceColumnId: sourceColId,
        version,
      });

      if (res.data.success) {
        // Update affected tasks with confirmed server positions
        const affectedMap = new Map(res.data.affectedTasks.map((t) => [t._id, t]));
        setTasks((prev) => prev.map((t) => affectedMap.get(t._id) || t));
        return true;
      }
      return false;
    } catch (err: any) {
      // Rollback on conflict (409) or error
      setTasks(prevTasks);
      return false;
    }
  };

  const handleAddTask = async (columnId: string, title: string) => {
    try {
      const res = await taskApi.create(columnId, { title });
      if (res.data.success) {
        setTasks((prev) => [...prev, res.data.task]);
        addToast('Task created', 'success');
      }
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Failed to create task', 'error');
    }
  };

  const handleUpdateTask = async (
    taskId: string,
    updates: Partial<Task>
  ): Promise<Task | null> => {
    try {
      const res = await taskApi.update(taskId, updates);
      if (res.data.success) {
        setTasks((prev) =>
          prev.map((t) => (t._id === taskId ? res.data.task : t))
        );
        addToast('Task updated', 'success');
        return res.data.task;
      }
      return null;
    } catch (err: any) {
      if (err.response?.status === 409) {
        addToast('⚠️ Version conflict detected! Reloading latest data...', 'warning');
        // reload task
        if (err.response?.data?.latestTask) {
          const fresh = err.response.data.latestTask;
          setTasks((prev) => prev.map((t) => (t._id === taskId ? fresh : t)));
        }
      } else {
        addToast(err.response?.data?.message || 'Failed to update task', 'error');
      }
      return null;
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      const res = await taskApi.delete(taskId);
      if (res.data.success) {
        setTasks((prev) => prev.filter((t) => t._id !== taskId));
        addToast('Task deleted', 'info');
      }
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Failed to delete task', 'error');
    }
  };

  const handleUpdateColumnTitle = async (columnId: string, newTitle: string) => {
    try {
      const res = await columnApi.update(columnId, { title: newTitle });
      if (res.data.success) {
        setColumns((prev) =>
          prev.map((c) => (c._id === columnId ? res.data.column : c))
        );
      }
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Failed to update list title', 'error');
    }
  };

  const handleDeleteColumn = async (columnId: string) => {
    try {
      const res = await columnApi.delete(columnId);
      if (res.data.success) {
        setColumns((prev) => prev.filter((c) => c._id !== columnId));
        setTasks((prev) => prev.filter((t) => t.columnId !== columnId));
        addToast('List deleted', 'info');
      }
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Failed to delete list', 'error');
    }
  };

  const handleToggleStar = async () => {
    if (!currentBoard) return;
    try {
      const newStarred = !currentBoard.isStarred;
      const res = await boardApi.update(currentBoard._id, { isStarred: newStarred });
      if (res.data.success) {
        setCurrentBoard({ ...currentBoard, isStarred: newStarred });
        setBoards((prev) =>
          prev.map((b) => (b._id === currentBoard._id ? { ...b, isStarred: newStarred } : b))
        );
      }
    } catch (err) {
      console.error('Failed to toggle star:', err);
    }
  };

  const handleChangeBackground = async (bg: string) => {
    if (!currentBoard) return;
    try {
      const res = await boardApi.update(currentBoard._id, { background: bg });
      if (res.data.success) {
        setCurrentBoard({ ...currentBoard, background: bg });
      }
    } catch (err) {
      console.error('Failed to change background:', err);
    }
  };

  // Filtered Tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = t.title.toLowerCase().includes(q);
        const matchesDesc = t.description?.toLowerCase().includes(q);
        const matchesLabel = t.labels?.some((l) => l.toLowerCase().includes(q));
        if (!matchesTitle && !matchesDesc && !matchesLabel) return false;
      }

      // Priority Filter
      if (selectedPriority !== 'all' && t.priority !== selectedPriority) {
        return false;
      }

      // Assignee Filter
      if (selectedAssignee !== 'all') {
        const hasAssignee = t.assignees?.some(
          (a) => a.id === selectedAssignee || (a as any)._id === selectedAssignee
        );
        if (!hasAssignee) return false;
      }

      return true;
    });
  }, [tasks, searchQuery, selectedPriority, selectedAssignee]);

  const boardBackgroundClass = currentBoard?.background ? `bg-${currentBoard.background}` : 'bg-gradient-sunset';

  return (
    <div
      className={boardBackgroundClass}
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        transition: 'background 0.3s ease',
      }}
    >
      {/* Top Navbar */}
      <Navbar
        workspaces={workspaces}
        currentWorkspace={currentWorkspace}
        boards={boards}
        currentBoard={currentBoard}
        onSelectWorkspace={(ws) => setCurrentWorkspace(ws)}
        onSelectBoard={(b) => setCurrentBoard(b)}
        onOpenCreateWorkspace={() => setIsCreateWorkspaceOpen(true)}
        onOpenWorkspaceSettings={() => setIsWorkspaceSettingsOpen(true)}
        onToggleActivityDrawer={() => setIsActivityDrawerOpen(!isActivityDrawerOpen)}
      />

      {/* Filter and Tool Bar */}
      <FilterBar
        currentBoard={currentBoard}
        currentWorkspace={currentWorkspace}
        currentUserRole={currentUserRole}
        searchQuery={searchQuery}
        selectedPriority={selectedPriority}
        selectedAssignee={selectedAssignee}
        onSearchChange={setSearchQuery}
        onPriorityChange={setSelectedPriority}
        onAssigneeChange={setSelectedAssignee}
        onClearFilters={() => {
          setSearchQuery('');
          setSelectedPriority('all');
          setSelectedAssignee('all');
        }}
        onToggleStar={handleToggleStar}
        onChangeBackground={handleChangeBackground}
        onOpenInviteModal={() => setIsInviteMemberOpen(true)}
        onOpenAddColumnModal={() => setIsCreateColumnOpen(true)}
      />

      {/* Main Kanban Canvas */}
      {isLoading ? (
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)',
            fontSize: '1rem',
          }}
        >
          Loading workspace & Kanban board...
        </div>
      ) : currentBoard ? (
        <KanbanBoard
          boardId={currentBoard._id}
          columns={columns}
          tasks={filteredTasks}
          workspace={currentWorkspace}
          isViewer={isViewer}
          onMoveTask={handleMoveTask}
          onAddTask={handleAddTask}
          onUpdateTask={handleUpdateTask}
          onDeleteTask={handleDeleteTask}
          onUpdateColumnTitle={handleUpdateColumnTitle}
          onDeleteColumn={handleDeleteColumn}
          onOpenAddColumnModal={() => setIsCreateColumnOpen(true)}
        />
      ) : (
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            color: 'var(--text-muted)',
          }}
        >
          <p>No boards found in this workspace.</p>
          {!isViewer && (
            <button className="btn btn-primary" onClick={() => setIsCreateBoardOpen(true)}>
              Create First Board
            </button>
          )}
        </div>
      )}

      {/* Modals */}
      {isCreateWorkspaceOpen && (
        <WorkspaceModal
          onClose={() => setIsCreateWorkspaceOpen(false)}
          onWorkspaceCreated={(newWs) => {
            setWorkspaces((prev) => [newWs, ...prev]);
            setCurrentWorkspace(newWs);
          }}
        />
      )}

      {isWorkspaceSettingsOpen && currentWorkspace && (
        <WorkspaceSettingsModal
          workspace={currentWorkspace}
          currentUserRole={currentUserRole}
          onClose={() => setIsWorkspaceSettingsOpen(false)}
          onWorkspaceUpdated={(updatedWs) => {
            setWorkspaces((prev) =>
              prev.map((w) => (w._id === updatedWs._id ? updatedWs : w))
            );
            setCurrentWorkspace(updatedWs);
          }}
          onWorkspaceDeleted={(deletedWsId) => {
            const remaining = workspaces.filter((w) => w._id !== deletedWsId);
            setWorkspaces(remaining);
            setCurrentWorkspace(remaining[0] || null);
          }}
        />
      )}

      {isInviteMemberOpen && currentWorkspace && (
        <InviteMemberModal
          workspaceId={currentWorkspace._id}
          onClose={() => setIsInviteMemberOpen(false)}
          onMemberInvited={async () => {
            // refresh workspace members
            const res = await workspaceApi.getById(currentWorkspace._id);
            if (res.data.success) {
              setCurrentWorkspace(res.data.workspace);
            }
          }}
        />
      )}

      {isCreateColumnOpen && currentBoard && (
        <CreateColumnModal
          boardId={currentBoard._id}
          onClose={() => setIsCreateColumnOpen(false)}
          onColumnCreated={(col) => setColumns((prev) => [...prev, col])}
        />
      )}

      {isCreateBoardOpen && currentWorkspace && (
        <CreateBoardModal
          workspaceId={currentWorkspace._id}
          onClose={() => setIsCreateBoardOpen(false)}
          onBoardCreated={(board) => {
            setBoards((prev) => [board, ...prev]);
            setCurrentBoard(board);
          }}
        />
      )}

      {currentBoard && (
        <ActivityDrawer
          boardId={currentBoard._id}
          isOpen={isActivityDrawerOpen}
          onClose={() => setIsActivityDrawerOpen(false)}
        />
      )}
    </div>
  );
};
