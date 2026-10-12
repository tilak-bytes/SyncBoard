import React, { useState, useEffect } from 'react';
import {
  X,
  Trash2,
  Calendar,
  Tag,
  Users,
  CheckSquare,
  MessageSquare,
  Clock,
  Send,
  AlertTriangle,
  RefreshCw,
  Plus,
} from 'lucide-react';
import { Task, Comment, ActivityLog, Workspace, TaskPriority, User } from '../types';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { commentApi, taskApi } from '../services/api';
import { useToast } from '../context/ToastContext';

interface TaskDetailModalProps {
  task: Task;
  workspace: Workspace | null;
  boardId: string;
  isViewer: boolean;
  onClose: () => void;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => Promise<Task | null>;
  onDeleteTask: (taskId: string) => Promise<void>;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  task,
  workspace,
  boardId,
  isViewer,
  onClose,
  onUpdateTask,
  onDeleteTask,
}) => {
  const { user } = useAuth();
  const { sendTyping, sendStopTyping } = useSocket();
  const { addToast } = useToast();

  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [priority, setPriority] = useState<TaskPriority>(task.priority);
  const [dueDate, setDueDate] = useState(
    task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ''
  );
  const [labels, setLabels] = useState<string[]>(task.labels);
  const [newLabel, setNewLabel] = useState('');
  const [checklist, setChecklist] = useState(task.checklist);
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [assigneeIds, setAssigneeIds] = useState<string[]>(
    task.assignees.map((a) => a.id || (a as any)._id)
  );

  const [comments, setComments] = useState<Comment[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [newComment, setNewComment] = useState('');
  const [activeTab, setActiveTab] = useState<'comments' | 'activity'>('comments');
  const [conflictError, setConflictError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Load comments & activity
  useEffect(() => {
    const loadDetails = async () => {
      try {
        const res = await taskApi.getById(task._id);
        if (res.data.success) {
          setComments(res.data.comments);
          setActivities(res.data.activities);
        }
      } catch (err) {
        console.error('Failed to load task details:', err);
      }
    };
    loadDetails();
  }, [task._id]);

  // Handle auto-save changes with optimistic concurrency version check
  const handleSaveField = async (fieldUpdates: Partial<Task>) => {
    if (isViewer) return;
    setIsSaving(true);
    setConflictError(null);

    try {
      // Pass task.version to verify optimistic locking
      const result = await onUpdateTask(task._id, {
        ...fieldUpdates,
        version: task.version,
      });

      if (!result) {
        setConflictError(
          'Concurrency Conflict: Card was updated by another team member. Reloading latest version.'
        );
      }
    } catch (err: any) {
      if (err.response?.status === 409) {
        setConflictError(
          '⚠️ Concurrency Conflict: Card was modified concurrently by another user.'
        );
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleTitleBlur = () => {
    if (title.trim() && title.trim() !== task.title) {
      handleSaveField({ title: title.trim() });
    }
  };

  const handleDescriptionBlur = () => {
    if (description !== task.description) {
      sendStopTyping(boardId, task._id);
      handleSaveField({ description });
    }
  };

  const handleAddLabel = () => {
    if (!newLabel.trim()) return;
    const clean = newLabel.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
    if (!labels.includes(clean)) {
      const updated = [...labels, clean];
      setLabels(updated);
      handleSaveField({ labels: updated });
    }
    setNewLabel('');
  };

  const handleRemoveLabel = (labelToRemove: string) => {
    const updated = labels.filter((l) => l !== labelToRemove);
    setLabels(updated);
    handleSaveField({ labels: updated });
  };

  const handleToggleChecklist = (itemId: string) => {
    const updated = checklist.map((item) =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );
    setChecklist(updated);
    handleSaveField({ checklist: updated });
  };

  const handleAddChecklistItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChecklistItem.trim()) return;
    const newItem = {
      id: Math.random().toString(36).substring(2, 9),
      text: newChecklistItem.trim(),
      completed: false,
    };
    const updated = [...checklist, newItem];
    setChecklist(updated);
    setNewChecklistItem('');
    handleSaveField({ checklist: updated });
  };

  const handleDeleteChecklistItem = (itemId: string) => {
    const updated = checklist.filter((item) => item.id !== itemId);
    setChecklist(updated);
    handleSaveField({ checklist: updated });
  };

  const handleToggleAssignee = (memberId: string) => {
    const updated = assigneeIds.includes(memberId)
      ? assigneeIds.filter((id) => id !== memberId)
      : [...assigneeIds, memberId];
    setAssigneeIds(updated);
    handleSaveField({ assignees: updated as any });
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isViewer) return;

    try {
      const res = await commentApi.create(task._id, newComment.trim());
      if (res.data.success) {
        setComments((prev) => [...prev, res.data.comment]);
        setNewComment('');
        addToast('Comment posted', 'success');
      }
    } catch {
      addToast('Failed to post comment', 'error');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await commentApi.delete(commentId);
      setComments((prev) => prev.filter((c) => c._id !== commentId));
      addToast('Comment deleted', 'info');
    } catch {
      addToast('Failed to delete comment', 'error');
    }
  };

  const completedCount = checklist.filter((i) => i.completed).length;
  const progressPercent = checklist.length > 0 ? Math.round((completedCount / checklist.length) * 100) : 0;
  const workspaceMembers: User[] = workspace?.members.map((m) => m.user) || [];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '840px', padding: '24px' }}
      >
        {/* Concurrency Conflict Banner */}
        {conflictError && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 16px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              color: '#ef4444',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <AlertTriangle size={20} />
              <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{conflictError}</span>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="btn btn-secondary btn-sm"
              style={{ gap: '6px' }}
            >
              <RefreshCw size={14} />
              <span>Reload Latest</span>
            </button>
          </div>
        )}

        {/* Modal Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '16px',
            marginBottom: '20px',
          }}
        >
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span className={`badge badge-${priority}`}>{priority}</span>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.75rem',
                  color: 'var(--text-subtle)',
                }}
              >
                Version {task.version}
              </span>
              {isSaving && (
                <span style={{ fontSize: '0.75rem', color: 'var(--primary)' }}>Saving...</span>
              )}
            </div>
            {isViewer ? (
              <h2 style={{ fontSize: '1.4rem' }}>{title}</h2>
            ) : (
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleTitleBlur}
                className="input-control"
                style={{
                  fontSize: '1.3rem',
                  fontWeight: 700,
                  background: 'transparent',
                  border: '1px solid transparent',
                  padding: '4px 8px',
                }}
                onFocus={(e) => (e.target.style.border = '1px solid var(--border-medium)')}
              />
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {!isViewer && (
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  if (window.confirm('Are you sure you want to delete this task?')) {
                    onDeleteTask(task._id);
                    onClose();
                  }
                }}
                style={{ color: '#ef4444' }}
                title="Delete Task"
              >
                <Trash2 size={16} />
              </button>
            )}
            <button className="btn btn-ghost btn-sm" onClick={onClose}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body: Left Content + Right Metadata Sidebar */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: '24px' }}>
          {/* Left Column: Description, Checklist, Tabs */}
          <div>
            {/* Description */}
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ fontSize: '0.9rem', marginBottom: '8px', color: 'var(--text-muted)' }}>
                Description
              </h4>
              {isViewer ? (
                <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', whiteSpace: 'pre-wrap' }}>
                  {description || 'No description provided.'}
                </p>
              ) : (
                <textarea
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    sendTyping(boardId, task._id);
                  }}
                  onBlur={handleDescriptionBlur}
                  placeholder="Add detailed task notes, acceptance criteria..."
                  rows={4}
                  className="input-control"
                  style={{ fontSize: '0.875rem', lineHeight: 1.5 }}
                />
              )}
            </div>

            {/* Checklist */}
            <div style={{ marginBottom: '24px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckSquare size={16} color="var(--primary)" />
                  <h4 style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Checklist</h4>
                </div>
                {checklist.length > 0 && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>
                    {progressPercent}%
                  </span>
                )}
              </div>

              {/* Progress Bar */}
              {checklist.length > 0 && (
                <div
                  style={{
                    height: '6px',
                    borderRadius: 'var(--radius-full)',
                    background: 'rgba(255, 255, 255, 0.08)',
                    marginBottom: '12px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${progressPercent}%`,
                      background: 'linear-gradient(90deg, #6366f1 0%, #10b981 100%)',
                      transition: 'width 0.3s ease',
                    }}
                  />
                </div>
              )}

              {/* Items List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {checklist.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '6px 8px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(255, 255, 255, 0.03)',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={item.completed}
                      onChange={() => handleToggleChecklist(item.id)}
                      disabled={isViewer}
                      style={{ cursor: isViewer ? 'default' : 'pointer' }}
                    />
                    <span
                      style={{
                        flex: 1,
                        fontSize: '0.875rem',
                        textDecoration: item.completed ? 'line-through' : 'none',
                        color: item.completed ? 'var(--text-subtle)' : 'var(--text-main)',
                      }}
                    >
                      {item.text}
                    </span>
                    {!isViewer && (
                      <button
                        onClick={() => handleDeleteChecklistItem(item.id)}
                        className="btn btn-ghost btn-sm"
                        style={{ padding: '2px', color: 'var(--text-subtle)' }}
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Add Checklist Item */}
              {!isViewer && (
                <form
                  onSubmit={handleAddChecklistItem}
                  style={{ display: 'flex', gap: '8px', marginTop: '10px' }}
                >
                  <input
                    type="text"
                    value={newChecklistItem}
                    onChange={(e) => setNewChecklistItem(e.target.value)}
                    placeholder="Add an item..."
                    className="input-control"
                    style={{ height: '32px', fontSize: '0.825rem' }}
                  />
                  <button type="submit" className="btn btn-secondary btn-sm" style={{ height: '32px' }}>
                    <Plus size={14} />
                    <span>Add</span>
                  </button>
                </form>
              )}
            </div>

            {/* Comments & Activity Tabs */}
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  borderBottom: '1px solid var(--border-subtle)',
                  paddingBottom: '8px',
                  marginBottom: '16px',
                }}
              >
                <button
                  onClick={() => setActiveTab('comments')}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '0.875rem',
                    color: activeTab === 'comments' ? 'var(--primary)' : 'var(--text-subtle)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <MessageSquare size={15} />
                  <span>Comments ({comments.length})</span>
                </button>
                <button
                  onClick={() => setActiveTab('activity')}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '0.875rem',
                    color: activeTab === 'activity' ? 'var(--primary)' : 'var(--text-subtle)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Clock size={15} />
                  <span>Activity History</span>
                </button>
              </div>

              {activeTab === 'comments' ? (
                <div>
                  {/* New Comment Input */}
                  {!isViewer && (
                    <form onSubmit={handleAddComment} style={{ marginBottom: '16px' }}>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                        <img
                          src={user?.avatar}
                          alt={user?.name}
                          className="avatar avatar-sm"
                          style={{ marginTop: '4px' }}
                        />
                        <div style={{ flex: 1 }}>
                          <textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Write a comment..."
                            rows={2}
                            className="input-control"
                            style={{ fontSize: '0.85rem', marginBottom: '6px' }}
                          />
                          <button
                            type="submit"
                            className="btn btn-primary btn-sm"
                            disabled={!newComment.trim()}
                          >
                            <Send size={13} />
                            <span>Comment</span>
                          </button>
                        </div>
                      </div>
                    </form>
                  )}

                  {/* Comments Feed */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {comments.map((c) => (
                      <div
                        key={c._id}
                        style={{
                          display: 'flex',
                          gap: '10px',
                          background: 'rgba(255, 255, 255, 0.02)',
                          padding: '10px',
                          borderRadius: 'var(--radius-md)',
                        }}
                      >
                        <img src={c.user?.avatar} alt={c.user?.name} className="avatar avatar-sm" />
                        <div style={{ flex: 1 }}>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              marginBottom: '4px',
                            }}
                          >
                            <span style={{ fontWeight: 600, fontSize: '0.825rem' }}>
                              {c.user?.name}
                            </span>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-subtle)' }}>
                              {new Date(c.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>{c.content}</p>
                        </div>
                        {user?.id === (c.user?.id || (c.user as any)?._id) && (
                          <button
                            onClick={() => handleDeleteComment(c._id)}
                            className="btn btn-ghost btn-sm"
                            style={{ padding: '2px', color: 'var(--text-subtle)' }}
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    ))}
                    {comments.length === 0 && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-subtle)', textAlign: 'center' }}>
                        No comments yet. Start the conversation!
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* Activity Feed */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {activities.map((a) => (
                    <div
                      key={a._id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '0.8rem',
                        color: 'var(--text-muted)',
                      }}
                    >
                      <img src={a.actor?.avatar} alt={a.actor?.name} className="avatar avatar-sm" />
                      <span>
                        <strong style={{ color: 'var(--text-main)' }}>{a.actor?.name}</strong>{' '}
                        {a.action.replace('task:', ' ')}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', marginLeft: 'auto' }}>
                        {new Date(a.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                  {activities.length === 0 && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-subtle)', textAlign: 'center' }}>
                      No activity recorded for this card yet.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar: Attributes */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Priority */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: 'var(--text-subtle)',
                  textTransform: 'uppercase',
                  marginBottom: '6px',
                }}
              >
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => {
                  const val = e.target.value as TaskPriority;
                  setPriority(val);
                  handleSaveField({ priority: val });
                }}
                disabled={isViewer}
                className="input-control"
                style={{ height: '36px', fontSize: '0.85rem' }}
              >
                <option value="urgent">🔥 Urgent</option>
                <option value="high">🟠 High</option>
                <option value="medium">🔵 Medium</option>
                <option value="low">🟢 Low</option>
              </select>
            </div>

            {/* Due Date */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: 'var(--text-subtle)',
                  textTransform: 'uppercase',
                  marginBottom: '6px',
                }}
              >
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => {
                  setDueDate(e.target.value);
                  handleSaveField({ dueDate: e.target.value ? (new Date(e.target.value).toISOString() as any) : null });
                }}
                disabled={isViewer}
                className="input-control"
                style={{ height: '36px', fontSize: '0.85rem' }}
              />
            </div>

            {/* Assignees */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: 'var(--text-subtle)',
                  textTransform: 'uppercase',
                  marginBottom: '6px',
                }}
              >
                Assignees
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {workspaceMembers.map((m) => {
                  const mId = m.id || (m as any)._id;
                  const isAssigned = assigneeIds.includes(mId);
                  return (
                    <div
                      key={mId}
                      onClick={() => !isViewer && handleToggleAssignee(mId)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '6px 8px',
                        borderRadius: 'var(--radius-sm)',
                        background: isAssigned ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                        border: isAssigned ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid transparent',
                        cursor: isViewer ? 'default' : 'pointer',
                        fontSize: '0.825rem',
                      }}
                    >
                      <img src={m.avatar} alt={m.name} className="avatar avatar-sm" />
                      <span style={{ flex: 1 }}>{m.name}</span>
                      {isAssigned && <span style={{ color: 'var(--primary)', fontWeight: 700 }}>✓</span>}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Labels Tags */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: 'var(--text-subtle)',
                  textTransform: 'uppercase',
                  marginBottom: '6px',
                }}
              >
                Tags & Labels
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '8px' }}>
                {labels.map((l) => (
                  <span
                    key={l}
                    style={{
                      fontSize: '0.725rem',
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(99, 102, 241, 0.15)',
                      color: '#a5b4fc',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    #{l}
                    {!isViewer && (
                      <X
                        size={10}
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleRemoveLabel(l)}
                      />
                    )}
                  </span>
                ))}
              </div>
              {!isViewer && (
                <div style={{ display: 'flex', gap: '4px' }}>
                  <input
                    type="text"
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddLabel();
                      }
                    }}
                    placeholder="New tag..."
                    className="input-control"
                    style={{ height: '30px', fontSize: '0.75rem' }}
                  />
                  <button
                    onClick={handleAddLabel}
                    className="btn btn-secondary btn-sm"
                    style={{ height: '30px', padding: '0 8px' }}
                  >
                    +
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
