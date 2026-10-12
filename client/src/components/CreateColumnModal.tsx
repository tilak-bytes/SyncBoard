import React, { useState } from 'react';
import { X, Columns } from 'lucide-react';
import { columnApi } from '../services/api';
import { Column } from '../types';
import { useToast } from '../context/ToastContext';

interface CreateColumnModalProps {
  boardId: string;
  onClose: () => void;
  onColumnCreated: (column: Column) => void;
}

export const CreateColumnModal: React.FC<CreateColumnModalProps> = ({
  boardId,
  onClose,
  onColumnCreated,
}) => {
  const [title, setTitle] = useState('');
  const [color, setColor] = useState('#6366f1');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addToast } = useToast();

  const colors = [
    '#6366f1', // Indigo
    '#3b82f6', // Blue
    '#06b6d4', // Cyan
    '#10b981', // Emerald
    '#f59e0b', // Amber
    '#8b5cf6', // Purple
    '#ec4899', // Pink
    '#ef4444', // Red
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await columnApi.create(boardId, {
        title: title.trim(),
        color,
      });

      if (res.data.success) {
        addToast(`List "${title}" added!`, 'success');
        onColumnCreated(res.data.column);
        onClose();
      }
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Failed to create list', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '440px', padding: '24px' }}
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
            <Columns size={20} color="var(--primary)" />
            <h3 style={{ fontSize: '1.2rem' }}>Add New List</h3>
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
              List Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. In Testing / QA"
              required
              autoFocus
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
              Theme Accent Color
            </label>
            <div style={{ display: 'flex', gap: '10px' }}>
              {colors.map((c) => (
                <div
                  key={c}
                  onClick={() => setColor(c)}
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: c,
                    cursor: 'pointer',
                    border: color === c ? '3px solid #ffffff' : '2px solid transparent',
                    boxShadow: color === c ? '0 0 10px rgba(255, 255, 255, 0.4)' : 'none',
                    transition: 'transform 0.15s ease',
                    transform: color === c ? 'scale(1.15)' : 'none',
                  }}
                />
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create List'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
