import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { Calendar, CheckSquare, MessageSquare, AlertCircle } from 'lucide-react';
import { Task } from '../types';

interface TaskCardProps {
  task: Task;
  index: number;
  isViewer: boolean;
  typingUser?: string;
  onClick: () => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  index,
  isViewer,
  typingUser,
  onClick,
}) => {
  const completedChecklistCount = task.checklist.filter((item) => item.completed).length;
  const totalChecklistCount = task.checklist.length;

  const isOverdue = task.dueDate ? new Date(task.dueDate) < new Date() : false;

  const formatDueDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <Draggable draggableId={task._id} index={index} isDragDisabled={isViewer}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={onClick}
          style={{
            background: snapshot.isDragging ? 'var(--bg-surface-elevated)' : 'var(--bg-card)',
            border: snapshot.isDragging
              ? '1px solid var(--primary)'
              : '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 14px',
            marginBottom: '10px',
            cursor: isViewer ? 'pointer' : 'grab',
            boxShadow: snapshot.isDragging ? 'var(--shadow-lg)' : 'var(--shadow-sm)',
            transform: snapshot.isDragging ? 'scale(1.02)' : 'none',
            transition: 'border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease',
            backdropFilter: 'blur(8px)',
            ...provided.draggableProps.style,
          }}
          className="task-card"
        >
          {/* Live Typing Banner */}
          {typingUser && (
            <div
              style={{
                fontSize: '0.7rem',
                color: 'var(--primary)',
                background: 'rgba(99, 102, 241, 0.15)',
                padding: '2px 6px',
                borderRadius: 'var(--radius-sm)',
                marginBottom: '8px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontWeight: 600,
              }}
            >
              <span className="typing-dot" />
              <span>{typingUser} is editing...</span>
            </div>
          )}

          {/* Top Badges: Priority + Concurrency Version */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '8px',
            }}
          >
            <span className={`badge badge-${task.priority}`}>
              {task.priority === 'urgent' && '🔥 '}
              {task.priority}
            </span>

            {/* OCC Version Tag */}
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.675rem',
                color: 'var(--text-subtle)',
                background: 'rgba(255, 255, 255, 0.05)',
                padding: '2px 6px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
              }}
              title={`Optimistic Concurrency Version ${task.version} (Prevents lost updates)`}
            >
              v{task.version}
            </span>
          </div>

          {/* Task Title */}
          <h4
            style={{
              fontSize: '0.9rem',
              fontWeight: 600,
              color: 'var(--text-main)',
              lineHeight: 1.4,
              marginBottom: task.labels.length > 0 ? '8px' : '10px',
            }}
          >
            {task.title}
          </h4>

          {/* Labels Tags */}
          {task.labels.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '10px' }}>
              {task.labels.map((label, idx) => (
                <span
                  key={idx}
                  style={{
                    fontSize: '0.675rem',
                    padding: '1px 6px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(99, 102, 241, 0.15)',
                    color: '#a5b4fc',
                    border: '1px solid rgba(99, 102, 241, 0.25)',
                  }}
                >
                  #{label}
                </span>
              ))}
            </div>
          )}

          {/* Card Footer: Due Date, Checklist, Assignees */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: '6px',
              borderTop: '1px solid rgba(255, 255, 255, 0.05)',
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {/* Due Date */}
              {task.dueDate && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    color: isOverdue ? '#ef4444' : 'var(--text-muted)',
                    fontWeight: isOverdue ? 600 : 400,
                  }}
                  title={isOverdue ? 'Overdue!' : 'Due Date'}
                >
                  <Calendar size={13} color={isOverdue ? '#ef4444' : undefined} />
                  <span>{formatDueDate(task.dueDate)}</span>
                </div>
              )}

              {/* Checklist Progress */}
              {totalChecklistCount > 0 && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    color:
                      completedChecklistCount === totalChecklistCount
                        ? '#10b981'
                        : 'var(--text-muted)',
                  }}
                >
                  <CheckSquare size={13} />
                  <span>
                    {completedChecklistCount}/{totalChecklistCount}
                  </span>
                </div>
              )}
            </div>

            {/* Assignee Avatars Stack */}
            {task.assignees && task.assignees.length > 0 && (
              <div className="avatar-group">
                {task.assignees.map((assignee, aIdx) => (
                  <img
                    key={`${assignee.id || (assignee as any)._id}-${aIdx}`}
                    src={assignee.avatar}
                    alt={assignee.name}
                    className="avatar avatar-sm"
                    title={assignee.name}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
};
