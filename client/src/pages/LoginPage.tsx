import React, { useState } from 'react';
import { Kanban, Lock, Mail, ArrowRight, Crown, Shield, User, Eye } from 'lucide-react';
import { useAuth, DEMO_ACCOUNTS } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

interface LoginPageProps {
  onNavigateRegister: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigateRegister }) => {
  const { login, quickLogin, isLoading } = useAuth();
  const { addToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    setIsSubmitting(true);
    try {
      await login(email.trim(), password);
      addToast('Welcome back to SyncBoard!', 'success');
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Invalid email or password', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(circle at 50% 20%, #1e1b4b 0%, #0f172a 50%, #090d16 100%)',
        padding: '24px',
      }}
    >
      <div style={{ width: '100%', maxWidth: '440px' }}>
        {/* App Branding */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: 'var(--radius-lg)',
              background: 'linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
              boxShadow: '0 0 25px rgba(99, 102, 241, 0.6)',
            }}
          >
            <Kanban size={32} color="#ffffff" />
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '8px' }}>SyncBoard</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Real-time collaborative task management & Kanban
          </p>
        </div>

        {/* Form Panel */}
        <div
          className="glass-panel"
          style={{ padding: '32px', marginBottom: '24px', background: 'rgba(15, 22, 38, 0.8)' }}
        >
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
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail
                  size={16}
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-subtle)',
                  }}
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@syncboard.dev"
                  required
                  className="input-control"
                  style={{ paddingLeft: '36px' }}
                />
              </div>
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
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock
                  size={16}
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-subtle)',
                  }}
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="input-control"
                  style={{ paddingLeft: '36px' }}
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', height: '42px', fontSize: '0.95rem' }}
              disabled={isSubmitting || isLoading}
            >
              <span>{isSubmitting ? 'Signing In...' : 'Sign In'}</span>
              <ArrowRight size={16} />
            </button>
          </form>

          <div
            style={{
              textAlign: 'center',
              marginTop: '20px',
              fontSize: '0.875rem',
              color: 'var(--text-muted)',
            }}
          >
            Don't have an account?{' '}
            <button
              onClick={onNavigateRegister}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--primary)',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Create Account
            </button>
          </div>
        </div>

        {/* 1-Click Interactive Demo Testing Accounts */}
        <div
          className="glass-panel"
          style={{ padding: '20px', background: 'rgba(15, 22, 38, 0.6)' }}
        >
          <div
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              color: 'var(--text-subtle)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '12px',
              textAlign: 'center',
            }}
          >
            ⚡ Instant 1-Click Demo Login
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {[
              {
                role: 'owner' as const,
                title: 'Alex (Owner)',
                desc: 'Full workspace controls',
                icon: <Crown size={14} color="#fbbf24" />,
              },
              {
                role: 'admin' as const,
                title: 'Sarah (Admin)',
                desc: 'Manage boards & team',
                icon: <Shield size={14} color="#c084fc" />,
              },
              {
                role: 'member' as const,
                title: 'Jordan (Member)',
                desc: 'Create, edit & drag tasks',
                icon: <User size={14} color="#60a5fa" />,
              },
              {
                role: 'viewer' as const,
                title: 'Elena (Viewer)',
                desc: 'Read-only access test',
                icon: <Eye size={14} color="#2dd4bf" />,
              },
            ].map((p) => (
              <button
                key={p.role}
                onClick={async () => {
                  try {
                    await quickLogin(p.role);
                    addToast(`Signed in as ${p.title}`, 'success');
                  } catch {
                    addToast('Login failed', 'error');
                  }
                }}
                className="btn btn-secondary btn-sm"
                style={{
                  padding: '8px 10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  gap: '8px',
                  fontSize: '0.78rem',
                }}
              >
                {p.icon}
                <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
                  <div style={{ fontWeight: 600 }}>{p.title}</div>
                  <div style={{ fontSize: '0.675rem', color: 'var(--text-subtle)' }}>
                    {p.desc}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
