import React, { useState } from 'react';
import {
  Kanban,
  ChevronDown,
  Plus,
  Settings,
  LogOut,
  Wifi,
  WifiOff,
  History,
  Shield,
  Crown,
  User as UserIcon,
  Eye,
} from 'lucide-react';
import { useAuth, DEMO_ACCOUNTS } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Workspace, Board, UserRole } from '../types';

interface NavbarProps {
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  boards: Board[];
  currentBoard: Board | null;
  onSelectWorkspace: (workspace: Workspace) => void;
  onSelectBoard: (board: Board) => void;
  onOpenCreateWorkspace: () => void;
  onOpenWorkspaceSettings: () => void;
  onToggleActivityDrawer: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  workspaces,
  currentWorkspace,
  boards,
  currentBoard,
  onSelectWorkspace,
  onSelectBoard,
  onOpenCreateWorkspace,
  onOpenWorkspaceSettings,
  onToggleActivityDrawer,
}) => {
  const { user, logout, quickLogin } = useAuth();
  const { isConnected, activeUsers } = useSocket();
  const [workspaceDropdown, setWorkspaceDropdown] = useState(false);
  const [boardDropdown, setBoardDropdown] = useState(false);
  const [userDropdown, setUserDropdown] = useState(false);

  const getRoleIcon = (role?: UserRole) => {
    switch (role) {
      case 'owner':
        return <Crown size={12} color="#fbbf24" />;
      case 'admin':
        return <Shield size={12} color="#c084fc" />;
      case 'viewer':
        return <Eye size={12} color="#2dd4bf" />;
      default:
        return <UserIcon size={12} color="#60a5fa" />;
    }
  };

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 24px',
        background: 'rgba(15, 22, 38, 0.85)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border-subtle)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      {/* Brand & Selectors */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 15px rgba(99, 102, 241, 0.5)',
            }}
          >
            <Kanban size={20} color="#ffffff" />
          </div>
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 800,
              fontSize: '1.25rem',
              letterSpacing: '-0.03em',
              background: 'linear-gradient(135deg, #ffffff 0%, #cbd5e1 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            SyncBoard
          </span>
        </div>

        {/* Workspace Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => {
              setWorkspaceDropdown(!workspaceDropdown);
              setBoardDropdown(false);
            }}
            style={{ gap: '6px' }}
          >
            <span style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {currentWorkspace ? currentWorkspace.name : 'Select Workspace'}
            </span>
            <ChevronDown size={14} />
          </button>

          {workspaceDropdown && (
            <div
              className="glass-panel"
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                marginTop: '8px',
                width: '260px',
                padding: '6px',
                zIndex: 100,
                background: 'var(--bg-surface-elevated)',
              }}
            >
              <div
                style={{
                  padding: '8px 10px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: 'var(--text-subtle)',
                  textTransform: 'uppercase',
                }}
              >
                Your Workspaces
              </div>
              {workspaces.map((ws) => (
                <div
                  key={ws._id}
                  onClick={() => {
                    onSelectWorkspace(ws);
                    setWorkspaceDropdown(false);
                  }}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: currentWorkspace?._id === ws._id ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                    color: currentWorkspace?._id === ws._id ? 'var(--primary)' : 'var(--text-main)',
                    fontSize: '0.875rem',
                  }}
                >
                  <span style={{ fontWeight: 600 }}>{ws.name}</span>
                  <span className={`badge badge-${ws.currentUserRole || 'member'}`}>
                    {ws.currentUserRole || 'member'}
                  </span>
                </div>
              ))}
              <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '6px 0' }} />
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  setWorkspaceDropdown(false);
                  onOpenCreateWorkspace();
                }}
                style={{ width: '100%', justifyContent: 'flex-start', gap: '8px' }}
              >
                <Plus size={14} />
                <span>Create New Workspace</span>
              </button>
            </div>
          )}
        </div>

        {/* Board Dropdown */}
        {boards.length > 0 && (
          <div style={{ position: 'relative' }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setBoardDropdown(!boardDropdown);
                setWorkspaceDropdown(false);
              }}
              style={{ gap: '6px' }}
            >
              <span style={{ maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {currentBoard ? currentBoard.title : 'Select Board'}
              </span>
              <ChevronDown size={14} />
            </button>

            {boardDropdown && (
              <div
                className="glass-panel"
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  marginTop: '8px',
                  width: '260px',
                  padding: '6px',
                  zIndex: 100,
                  background: 'var(--bg-surface-elevated)',
                }}
              >
                <div
                  style={{
                    padding: '8px 10px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: 'var(--text-subtle)',
                    textTransform: 'uppercase',
                  }}
                >
                  Boards in Workspace
                </div>
                {boards.map((b) => (
                  <div
                    key={b._id}
                    onClick={() => {
                      onSelectBoard(b);
                      setBoardDropdown(false);
                    }}
                    style={{
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: currentBoard?._id === b._id ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                      color: currentBoard?._id === b._id ? 'var(--primary)' : 'var(--text-main)',
                      fontSize: '0.875rem',
                    }}
                  >
                    <span>{b.title}</span>
                    {b.isStarred && <span>⭐</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Center: Demo Persona Quick-Switch Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: 'rgba(255, 255, 255, 0.04)',
          padding: '4px 8px',
          borderRadius: 'var(--radius-full)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <span
          style={{
            fontSize: '0.725rem',
            color: 'var(--text-subtle)',
            marginRight: '4px',
            fontWeight: 600,
          }}
        >
          Demo Persona:
        </span>
        {(['owner', 'admin', 'member', 'viewer'] as const).map((r) => {
          const acc = DEMO_ACCOUNTS[r];
          const isCurrent = user?.email.toLowerCase() === acc.email.toLowerCase();
          return (
            <button
              key={r}
              onClick={() => quickLogin(r)}
              style={{
                background: isCurrent ? 'var(--primary)' : 'transparent',
                color: isCurrent ? '#ffffff' : 'var(--text-muted)',
                border: 'none',
                borderRadius: 'var(--radius-full)',
                padding: '3px 10px',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                transition: 'all 0.15s ease',
              }}
              title={`Switch to ${acc.name} (${acc.role})`}
            >
              {getRoleIcon(r)}
              <span>{acc.name.split(' ')[0]}</span>
            </button>
          );
        })}
      </div>

      {/* Right: Presence, Status, Activity, User */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Real-time Socket Indicator */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.75rem',
            fontWeight: 600,
            padding: '4px 10px',
            borderRadius: 'var(--radius-full)',
            background: isConnected ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
            color: isConnected ? '#10b981' : '#ef4444',
            border: `1px solid ${isConnected ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)'}`,
          }}
          title={isConnected ? 'Real-time WebSocket connected' : 'Reconnecting to real-time server...'}
        >
          {isConnected ? <Wifi size={13} /> : <WifiOff size={13} />}
          <span>{isConnected ? 'Live Sync' : 'Reconnecting'}</span>
        </div>

        {/* Live Active Collaborator Presence Stack */}
        {activeUsers.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.725rem', color: 'var(--text-subtle)' }}>Active:</span>
            <div className="avatar-group">
              {activeUsers.map((u) => (
                <img
                  key={u.socketId}
                  src={u.avatar}
                  alt={u.name}
                  className="avatar avatar-sm"
                  style={{
                    border: '2px solid #10b981',
                    boxShadow: '0 0 6px rgba(16, 185, 129, 0.4)',
                  }}
                  title={`${u.name} (Active right now)`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Activity Drawer Toggle */}
        <button
          className="btn btn-ghost btn-sm"
          onClick={onToggleActivityDrawer}
          title="Board Activity History"
          style={{ padding: '6px' }}
        >
          <History size={18} />
        </button>

        {/* Workspace Settings (if admin/owner) */}
        {currentWorkspace && (currentWorkspace.currentUserRole === 'owner' || currentWorkspace.currentUserRole === 'admin') && (
          <button
            className="btn btn-ghost btn-sm"
            onClick={onOpenWorkspaceSettings}
            title="Workspace Settings & Members"
            style={{ padding: '6px' }}
          >
            <Settings size={18} />
          </button>
        )}

        {/* User Profile */}
        <div style={{ position: 'relative' }}>
          <div
            onClick={() => setUserDropdown(!userDropdown)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              padding: '3px',
              borderRadius: 'var(--radius-full)',
            }}
          >
            <img
              src={user?.avatar || 'https://api.dicebear.com/7.x/initials/svg?seed=User'}
              alt={user?.name || 'User'}
              className="avatar"
            />
          </div>

          {userDropdown && (
            <div
              className="glass-panel"
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '8px',
                width: '220px',
                padding: '8px',
                zIndex: 100,
                background: 'var(--bg-surface-elevated)',
              }}
            >
              <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--border-subtle)' }}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{user?.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user?.email}</div>
                {currentWorkspace?.currentUserRole && (
                  <div style={{ marginTop: '6px' }}>
                    <span className={`badge badge-${currentWorkspace.currentUserRole}`}>
                      {currentWorkspace.currentUserRole}
                    </span>
                  </div>
                )}
              </div>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  setUserDropdown(false);
                  logout();
                }}
                style={{ width: '100%', justifyContent: 'flex-start', color: '#ef4444', marginTop: '6px' }}
              >
                <LogOut size={14} />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
