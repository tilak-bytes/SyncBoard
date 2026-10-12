import React, { useState } from 'react';
import { Droppable } from '@hello-pangea/dnd';
import { Plus, MoreHorizontal, Trash2, Check, X } from 'lucide-react';
import { Column, Task } from '../types';
import { TaskCard } from './TaskCard';

interface ColumnContainerProps {
  column: Column;
  tasks: Task[];
  isViewer: boolean;
  typingUsers: Record<string, string>;
  onAddTask: (columnId: string, title: string) => Promise<void>;
  onUpdateColumnTitle: (columnId: string, newTitle: string) => Promise<void>;
  onDeleteColumn: (columnId: string) => Promise<void>;
  onSelectTask: (task: Task) => void;
}

export const ColumnContainer: React.FC<ColumnContainerProps> = ({
  column,
  tasks,
  isViewer,
  typingUsers,
  onAddTask,
  onUpdateColumnTitle,
  onDeleteColumn,
  onSelectTask,
}) => {
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [columnTitle, setColumnTitle] = useState(column.title);
  const [showMenu, setShowMenu] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onAddTask(column._id, newTaskTitle.trim());
      setNewTaskTitle('');
      setIsAddingTask(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveTitle = async () => {
    if (columnTitle.trim() && columnTitle.trim() !== column.title) {
      await onUpdateColumnTitle(column._id, columnTitle.trim());
    }
    setIsEditingTitle(false);
  };

  return (
    <div
      style={{
        width: '320px',
        minWidth: '320px',
        maxHeight: 'calc(100vh - 160px)',
        display: 'flex',
        flexDirection: 'column',
        background: 'rgba(15, 22, 38, 0.75)',
        backdropFilter: 'blur(16px)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: '14px',
        boxShadow: 'var(--shadow-md)',
      }}
    >
      {/* Column Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '12px',
          paddingBottom: '8px',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
          <div
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: column.color || 'var(--primary)',
            }}
          />

          {isEditingTitle ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1 }}>
              <input
                type="text"
                value={columnTitle}
                onChange={(e) => setColumnTitle(e.target.value)}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveTitle();
                  if (e.key === 'Escape') setIsEditingTitle(false);
                }}
                className="input-control"
                style={{ padding: '2px 6px', height: '28px', fontSize: '0.85rem' }}
              />
              <button
                onClick={handleSaveTitle}
                className="btn btn-primary btn-sm"
                style={{ padding: '4px 6px' }}
              >
                <Check size={12} />
              </button>
            </div>
          ) : (
            <h3
              onDoubleClick={() => !isViewer && setIsEditingTitle(true)}
              style={{
                fontSize: '0.95rem',
                fontWeight: 700,
                color: 'var(--text-main)',
                cursor: isViewer ? 'default' : 'pointer',
              }}
              title={isViewer ? '' : 'Double click to edit title'}
            >
              {column.title}
            </h3>
          )}

          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '2px 7px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(255, 255, 255, 0.08)',
              color: 'var(--text-muted)',
            }}
          >
            {tasks.length}
          </span>
        </div>

        {/* Column Action Dropdown */}
        {!isViewer && (
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="btn btn-ghost btn-sm"
              style={{ padding: '4px' }}
            >
              <MoreHorizontal size={16} />
            </button>

            {showMenu && (
              <div
                className="glass-panel"
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '4px',
                  width: '140px',
                  padding: '4px',
                  zIndex: 20,
                  background: 'var(--bg-surface-elevated)',
                }}
              >
                <button
                  onClick={() => {
                    setShowMenu(false);
                    setIsEditingTitle(true);
                  }}
                  className="btn btn-ghost btn-sm"
                  style={{ width: '100%', justifyContent: 'flex-start' }}
                >
                  Rename List
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    if (window.confirm(`Delete list "${column.title}" and its ${tasks.length} tasks?`)) {
                      onDeleteColumn(column._id);
                    }
                  }}
                  className="btn btn-ghost btn-sm"
                  style={{ width: '100%', justifyContent: 'flex-start', color: '#ef4444' }}
                >
                  <Trash2 size={13} />
                  <span>Delete List</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Droppable Task Container */}
      <Droppable droppableId={column._id} type="TASK">
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            style={{
              flex: 1,
              overflowY: 'auto',
              minHeight: '80px',
              borderRadius: 'var(--radius-md)',
              background: snapshot.isDraggingOver ? 'rgba(99, 102, 241, 0.08)' : 'transparent',
              padding: '2px',
              transition: 'background-color 0.2s ease',
            }}
          >
            {tasks.map((task, index) => (
              <TaskCard
                key={task._id}
                task={task}
                index={index}
                isViewer={isViewer}
                typingUser={typingUsers[task._id]}
                onClick={() => onSelectTask(task)}
              />
            ))}
            {provided.placeholder}

            {tasks.length === 0 && !snapshot.isDraggingOver && (
              <div
                style={{
                  textAlign: 'center',
                  padding: '24px 0',
                  color: 'var(--text-subtle)',
                  fontSize: '0.8rem',
                  border: '1px dashed var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                No tasks in this list
              </div>
            )}
          </div>
        )}
      </Droppable>

      {/* Add Task Button or Input Form */}
      {!isViewer && (
        <div style={{ marginTop: '10px' }}>
          {isAddingTask ? (
            <form onSubmit={handleCreateTask}>
              <textarea
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="What needs to be done?..."
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleCreateTask(e);
                  }
                  if (e.key === 'Escape') setIsAddingTask(false);
                }}
                className="input-control"
                rows={2}
                style={{ marginBottom: '8px', fontSize: '0.875rem' }}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button type="submit" className="btn btn-primary btn-sm" disabled={isSubmitting}>
                  Add Card
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setIsAddingTask(false)}
                >
                  <X size={14} />
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setIsAddingTask(true)}
              className="btn btn-ghost btn-sm"
              style={{
                width: '100%',
                justifyContent: 'flex-start',
                color: 'var(--text-muted)',
                gap: '6px',
              }}
            >
              <Plus size={15} />
              <span>Add a card</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
