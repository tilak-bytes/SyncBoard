import React, { useState } from 'react';
import { Kanban, Lock, Mail, User, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

interface RegisterPageProps {
  onNavigateLogin: () => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onNavigateLogin }) => {
  const { register, isLoading } = useAuth();
  const { addToast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) return;

    if (password.length < 6) {
      addToast('Password must be at least 6 characters', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      await register(name.trim(), email.trim(), password);
      addToast('Account created successfully! Welcome to SyncBoard.', 'success');
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Registration failed', 'error');
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
          <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '8px' }}>Create Account</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Get started with real-time collaborative Kanban
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
                Full Name
              </label>
              <div style={{ position: 'relative' }}>
                <User
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
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Maya Lin"
                  required
                  autoFocus
                  className="input-control"
                  style={{ paddingLeft: '36px' }}
                />
              </div>
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
                  placeholder="maya@example.com"
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
                Password (min 6 characters)
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
              <span>{isSubmitting ? 'Creating Account...' : 'Get Started'}</span>
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
            Already have an account?{' '}
            <button
              onClick={onNavigateLogin}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--primary)',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
