import React, { useState } from 'react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { Plus } from 'lucide-react';
import { Column, Task, Workspace } from '../types';
import { ColumnContainer } from './ColumnContainer';
import { TaskDetailModal } from './TaskDetailModal';
import { useSocket } from '../context/SocketContext';
import { useToast } from '../context/ToastContext';

interface KanbanBoardProps {
  boardId: string;
  columns: Column[];
  tasks: Task[];
  workspace: Workspace | null;
  isViewer: boolean;
  onMoveTask: (
    taskId: string,
    sourceColId: string,
    destColId: string,
    destIndex: number,
    version?: number
  ) => Promise<boolean>;
  onAddTask: (columnId: string, title: string) => Promise<void>;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => Promise<Task | null>;
  onDeleteTask: (taskId: string) => Promise<void>;
  onUpdateColumnTitle: (columnId: string, newTitle: string) => Promise<void>;
  onDeleteColumn: (columnId: string) => Promise<void>;
  onOpenAddColumnModal: () => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  boardId,
  columns,
  tasks,
  workspace,
  isViewer,
  onMoveTask,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onUpdateColumnTitle,
  onDeleteColumn,
  onOpenAddColumnModal,
}) => {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const { typingUsers } = useSocket();
  const { addToast } = useToast();

  const handleDragEnd = async (result: DropResult) => {
    if (isViewer) return;

    const { destination, source, draggableId } = result;
    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const task = tasks.find((t) => t._id === draggableId);
    if (!task) return;

    const success = await onMoveTask(
      draggableId,
      source.droppableId,
      destination.droppableId,
      destination.index,
      task.version
    );

    if (!success) {
      addToast(
        '⚠️ Move conflict: Task was concurrently modified by another user.',
        'warning'
      );
    }
  };

  // Group tasks by columnId
  const getTasksByColumn = (colId: string): Task[] => {
    return tasks
      .filter((t) => t.columnId === colId)
      .sort((a, b) => a.order - b.order);
  };

  return (
    <div
      style={{
        flex: 1,
        padding: '24px',
        overflowX: 'auto',
        overflowY: 'hidden',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '20px',
      }}
    >
      <DragDropContext onDragEnd={handleDragEnd}>
        {columns.map((column) => (
          <ColumnContainer
            key={column._id}
            column={column}
            tasks={getTasksByColumn(column._id)}
            isViewer={isViewer}
            typingUsers={typingUsers}
            onAddTask={onAddTask}
            onUpdateColumnTitle={onUpdateColumnTitle}
            onDeleteColumn={onDeleteColumn}
            onSelectTask={(task) => setSelectedTask(task)}
          />
        ))}
      </DragDropContext>

      {/* Add List Button at end */}
      {!isViewer && (
        <button
          onClick={onOpenAddColumnModal}
          style={{
            minWidth: '280px',
            height: '54px',
            background: 'rgba(255, 255, 255, 0.04)',
            backdropFilter: 'blur(12px)',
            border: '1px dashed var(--border-medium)',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            color: 'var(--text-muted)',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
            e.currentTarget.style.color = 'var(--text-main)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
            e.currentTarget.style.color = 'var(--text-muted)';
          }}
        >
          <Plus size={18} />
          <span>Add another list</span>
        </button>
      )}

      {/* Task Details Modal */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          workspace={workspace}
          boardId={boardId}
          isViewer={isViewer}
          onClose={() => setSelectedTask(null)}
          onUpdateTask={async (taskId, updates) => {
            const updated = await onUpdateTask(taskId, updates);
            if (updated) {
              setSelectedTask(updated);
            }
            return updated;
          }}
          onDeleteTask={async (taskId) => {
            await onDeleteTask(taskId);
            setSelectedTask(null);
          }}
        />
      )}
    </div>
  );
};
