import React, { useState } from 'react';
import { X, Kanban, Palette } from 'lucide-react';
import { boardApi } from '../services/api';
import { Board } from '../types';
import { useToast } from '../context/ToastContext';

interface CreateBoardModalProps {
  workspaceId: string;
  onClose: () => void;
  onBoardCreated: (board: Board) => void;
}

export const CreateBoardModal: React.FC<CreateBoardModalProps> = ({
  workspaceId,
  onClose,
  onBoardCreated,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [background, setBackground] = useState('gradient-sunset');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addToast } = useToast();

  const themes = [
    { id: 'gradient-sunset', name: 'Sunset Obsidian', color: 'linear-gradient(135deg, #1e1b4b, #0f172a)' },
    { id: 'gradient-ocean', name: 'Emerald Ocean', color: 'linear-gradient(135deg, #064e3b, #0f172a)' },
    { id: 'gradient-aurora', name: 'Aurora Violet', color: 'linear-gradient(135deg, #4c1d95, #0f172a)' },
    { id: 'gradient-midnight', name: 'Midnight Slate', color: 'linear-gradient(135deg, #1e293b, #090d16)' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await boardApi.create(workspaceId, {
        title: title.trim(),
        description: description.trim(),
        background,
      });

      if (res.data.success) {
        addToast(`Board "${title}" created!`, 'success');
        onBoardCreated(res.data.board);
        onClose();
      }
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Failed to create board', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '480px', padding: '24px' }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Kanban size={20} color="var(--primary)" />
            <h3 style={{ fontSize: '1.2rem' }}>Create Kanban Board</h3>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: 'var(--text-muted)',
                marginBottom: '6px',
              }}
            >
              Board Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Q4 Platform Roadmap"
              required
              autoFocus
              className="input-control"
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: 'var(--text-muted)',
                marginBottom: '6px',
              }}
            >
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What are the goals of this board?..."
              rows={2}
              className="input-control"
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: 'var(--text-muted)',
                marginBottom: '8px',
              }}
            >
              Board Canvas Theme
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {themes.map((t) => (
                <div
                  key={t.id}
                  onClick={() => setBackground(t.id)}
                  style={{
                    height: '52px',
                    borderRadius: 'var(--radius-md)',
                    background: t.color,
                    border: background === t.id ? '2px solid var(--primary)' : '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: background === t.id ? '0 0 12px var(--primary-glow)' : 'none',
                  }}
                >
                  {t.name}
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Board'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
