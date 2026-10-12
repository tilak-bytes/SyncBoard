import React, { useState } from 'react';
import { X, Settings, Trash2, Shield, Crown, User, Eye } from 'lucide-react';
import { Workspace, UserRole } from '../types';
import { workspaceApi } from '../services/api';
import { useToast } from '../context/ToastContext';

interface WorkspaceSettingsModalProps {
  workspace: Workspace;
  currentUserRole?: UserRole;
  onClose: () => void;
  onWorkspaceUpdated: (updated: Workspace) => void;
  onWorkspaceDeleted: (workspaceId: string) => void;
}

export const WorkspaceSettingsModal: React.FC<WorkspaceSettingsModalProps> = ({
  workspace,
  currentUserRole,
  onClose,
  onWorkspaceUpdated,
  onWorkspaceDeleted,
}) => {
  const [name, setName] = useState(workspace.name);
  const [description, setDescription] = useState(workspace.description || '');
  const [members, setMembers] = useState(workspace.members);
  const [isSaving, setIsSaving] = useState(false);
  const { addToast } = useToast();

  const isOwner = currentUserRole === 'owner';
  const isAdmin = currentUserRole === 'admin' || isOwner;

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || isSaving) return;

    setIsSaving(true);
    try {
      const res = await workspaceApi.update(workspace._id, {
        name: name.trim(),
        description: description.trim(),
      });
      if (res.data.success) {
        addToast('Workspace settings updated', 'success');
        onWorkspaceUpdated(res.data.workspace);
      }
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Failed to update settings', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      await workspaceApi.updateMemberRole(workspace._id, userId, newRole);
      setMembers((prev) =>
        prev.map((m) => (m.user.id === userId || (m.user as any)._id === userId ? { ...m, role: newRole } : m))
      );
      addToast('Member role updated', 'success');
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Failed to update role', 'error');
    }
  };

  const handleRemoveMember = async (userId: string, memberName: string) => {
    if (!window.confirm(`Remove ${memberName} from this workspace?`)) return;

    try {
      await workspaceApi.removeMember(workspace._id, userId);
      setMembers((prev) =>
        prev.filter((m) => m.user.id !== userId && (m.user as any)._id !== userId)
      );
      addToast(`${memberName} removed from workspace`, 'info');
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Failed to remove member', 'error');
    }
  };

  const handleDeleteWorkspace = async () => {
    if (
      !window.confirm(
        `Are you absolutely sure you want to delete workspace "${workspace.name}" and ALL its boards? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      await workspaceApi.delete(workspace._id);
      addToast('Workspace deleted', 'info');
      onWorkspaceDeleted(workspace._id);
      onClose();
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Failed to delete workspace', 'error');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '640px', padding: '24px' }}
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
            <Settings size={20} color="var(--primary)" />
            <h3 style={{ fontSize: '1.25rem' }}>Workspace Settings</h3>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* General Info */}
        <form onSubmit={handleSaveSettings} style={{ marginBottom: '28px' }}>
          <div style={{ marginBottom: '14px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: 'var(--text-muted)',
                marginBottom: '6px',
              }}
            >
              Workspace Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!isAdmin}
              className="input-control"
            />
          </div>

          <div style={{ marginBottom: '14px' }}>
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
              disabled={!isAdmin}
              rows={2}
              className="input-control"
            />
          </div>

          {isAdmin && (
            <button type="submit" className="btn btn-primary btn-sm" disabled={isSaving}>
              Save Workspace Info
            </button>
          )}
        </form>

        {/* Members Management */}
        <div style={{ marginBottom: '28px' }}>
          <h4
            style={{
              fontSize: '0.9rem',
              fontWeight: 700,
              color: 'var(--text-muted)',
              marginBottom: '12px',
              textTransform: 'uppercase',
            }}
          >
            Members ({members.length})
          </h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {members.map((m) => {
              const uId = m.user.id || (m.user as any)._id;
              const isWorkspaceOwner = m.role === 'owner';
              return (
                <div
                  key={uId}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <img src={m.user.avatar} alt={m.user.name} className="avatar avatar-sm" />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{m.user.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>
                        {m.user.email}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {isWorkspaceOwner ? (
                      <span className="badge badge-owner">
                        <Crown size={12} /> Owner
                      </span>
                    ) : isAdmin ? (
                      <select
                        value={m.role}
                        onChange={(e) => handleRoleChange(uId, e.target.value as UserRole)}
                        className="input-control"
                        style={{ height: '30px', fontSize: '0.75rem', padding: '2px 8px' }}
                      >
                        <option value="admin">Admin</option>
                        <option value="member">Member</option>
                        <option value="viewer">Viewer</option>
                      </select>
                    ) : (
                      <span className={`badge badge-${m.role}`}>{m.role}</span>
                    )}

                    {!isWorkspaceOwner && isAdmin && (
                      <button
                        onClick={() => handleRemoveMember(uId, m.user.name)}
                        className="btn btn-ghost btn-sm"
                        style={{ padding: '4px', color: '#ef4444' }}
                        title="Remove Member"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Danger Zone: Delete Workspace */}
        {isOwner && (
          <div
            style={{
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ fontWeight: 700, color: '#ef4444', fontSize: '0.9rem' }}>
                Delete Workspace
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>
                Permanently delete this workspace and all associated boards & tasks.
              </div>
            </div>
            <button className="btn btn-danger btn-sm" onClick={handleDeleteWorkspace}>
              Delete Workspace
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
