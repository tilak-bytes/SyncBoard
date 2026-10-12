import React, { useState } from 'react';
import { X, UserPlus, Shield, User, Eye } from 'lucide-react';
import { workspaceApi } from '../services/api';
import { UserRole } from '../types';
import { useToast } from '../context/ToastContext';

interface InviteMemberModalProps {
  workspaceId: string;
  onClose: () => void;
  onMemberInvited: () => void;
}

export const InviteMemberModal: React.FC<InviteMemberModalProps> = ({
  workspaceId,
  onClose,
  onMemberInvited,
}) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('member');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await workspaceApi.addMember(workspaceId, {
        email: email.trim(),
        role,
      });

      if (res.data.success) {
        addToast(res.data.message || 'Member added to workspace!', 'success');
        onMemberInvited();
        onClose();
      }
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Failed to add member', 'error');
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
            <UserPlus size={20} color="var(--primary)" />
            <h3 style={{ fontSize: '1.2rem' }}>Invite Team Member</h3>
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
              Email Address *
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. teammate@company.com"
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
              Role Permission *
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                {
                  id: 'admin',
                  name: 'Admin',
                  desc: 'Can manage boards, invite members, and edit workspace settings',
                  icon: <Shield size={16} color="#c084fc" />,
                },
                {
                  id: 'member',
                  name: 'Member',
                  desc: 'Can create, edit, move tasks, and post comments',
                  icon: <User size={16} color="#60a5fa" />,
                },
                {
                  id: 'viewer',
                  name: 'Viewer',
                  desc: 'Read-only access. Cannot create, edit, or drag tasks',
                  icon: <Eye size={16} color="#2dd4bf" />,
                },
              ].map((r) => (
                <div
                  key={r.id}
                  onClick={() => setRole(r.id as UserRole)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-md)',
                    background: role === r.id ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                    border: role === r.id ? '1px solid var(--primary)' : '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                  }}
                >
                  {r.icon}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{r.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>{r.desc}</div>
                  </div>
                  <input
                    type="radio"
                    name="role"
                    checked={role === r.id}
                    onChange={() => setRole(r.id as UserRole)}
                  />
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Inviting...' : 'Send Invite'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
