import React, { useState } from 'react';
import { X, Briefcase } from 'lucide-react';
import { workspaceApi } from '../services/api';
import { Workspace } from '../types';
import { useToast } from '../context/ToastContext';

interface WorkspaceModalProps {
  onClose: () => void;
  onWorkspaceCreated: (workspace: Workspace) => void;
}

export const WorkspaceModal: React.FC<WorkspaceModalProps> = ({
  onClose,
  onWorkspaceCreated,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await workspaceApi.create({
        name: name.trim(),
        description: description.trim(),
      });
      if (res.data.success) {
        addToast(`Workspace "${name}" created!`, 'success');
        onWorkspaceCreated(res.data.workspace);
        onClose();
      }
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Failed to create workspace', 'error');
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
            <Briefcase size={20} color="var(--primary)" />
            <h3 style={{ fontSize: '1.2rem' }}>Create Workspace</h3>
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
              Workspace Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Acme Engineering"
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
                marginBottom: '6px',
              }}
            >
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does your team build together?..."
              rows={3}
              className="input-control"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Workspace'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
