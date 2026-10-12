import React from 'react';
import {
  Search,
  Filter,
  UserPlus,
  Star,
  Plus,
  X,
  Palette,
} from 'lucide-react';
import { Board, Workspace, User, TaskPriority, UserRole } from '../types';

interface FilterBarProps {
  currentBoard: Board | null;
  currentWorkspace: Workspace | null;
  currentUserRole?: UserRole;
  searchQuery: string;
  selectedPriority: string;
  selectedAssignee: string;
  onSearchChange: (query: string) => void;
  onPriorityChange: (priority: string) => void;
  onAssigneeChange: (assignee: string) => void;
  onClearFilters: () => void;
  onToggleStar: () => void;
  onChangeBackground: (bg: string) => void;
  onOpenInviteModal: () => void;
  onOpenAddColumnModal: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  currentBoard,
  currentWorkspace,
  currentUserRole,
  searchQuery,
  selectedPriority,
  selectedAssignee,
  onSearchChange,
  onPriorityChange,
  onAssigneeChange,
  onClearFilters,
  onToggleStar,
  onChangeBackground,
  onOpenInviteModal,
  onOpenAddColumnModal,
}) => {
  const isViewer = currentUserRole === 'viewer';
  const hasActiveFilters = searchQuery !== '' || selectedPriority !== 'all' || selectedAssignee !== 'all';

  // Get unique members from workspace
  const members: User[] = currentWorkspace?.members.map((m) => m.user) || [];

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 24px',
        background: 'rgba(15, 22, 38, 0.65)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border-subtle)',
        gap: '16px',
        flexWrap: 'wrap',
      }}
    >
      {/* Board Title & Star */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 800 }}>
          {currentBoard ? currentBoard.title : 'Sprint Kanban'}
        </h1>
        {currentBoard && (
          <button
            onClick={onToggleStar}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: currentBoard.isStarred ? '#fbbf24' : 'var(--text-subtle)',
              display: 'flex',
              alignItems: 'center',
            }}
            title={currentBoard.isStarred ? 'Unstar Board' : 'Star Board'}
          >
            <Star size={18} fill={currentBoard.isStarred ? '#fbbf24' : 'none'} />
          </button>
        )}
        {currentUserRole && (
          <span className={`badge badge-${currentUserRole}`}>
            {currentUserRole === 'viewer' ? '👁️ Viewer (Read Only)' : currentUserRole}
          </span>
        )}
      </div>

      {/* Filter and Search Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, maxWidth: '650px' }}>
        {/* Search Input */}
        <div style={{ position: 'relative', flex: 1 }}>
          <Search
            size={16}
            style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)' }}
          />
          <input
            type="text"
            placeholder="Search tasks, descriptions, labels..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="input-control"
            style={{ paddingLeft: '32px', paddingRight: '28px', height: '36px', fontSize: '0.825rem' }}
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-subtle)',
                cursor: 'pointer',
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Priority Filter */}
        <div style={{ position: 'relative' }}>
          <select
            value={selectedPriority}
            onChange={(e) => onPriorityChange(e.target.value)}
            className="input-control"
            style={{ height: '36px', fontSize: '0.825rem', paddingRight: '24px', cursor: 'pointer' }}
          >
            <option value="all">All Priorities</option>
            <option value="urgent">🔴 Urgent</option>
            <option value="high">🟠 High</option>
            <option value="medium">🔵 Medium</option>
            <option value="low">🟢 Low</option>
          </select>
        </div>

        {/* Assignee Filter */}
        <div style={{ position: 'relative' }}>
          <select
            value={selectedAssignee}
            onChange={(e) => onAssigneeChange(e.target.value)}
            className="input-control"
            style={{ height: '36px', fontSize: '0.825rem', paddingRight: '24px', cursor: 'pointer' }}
          >
            <option value="all">All Assignees</option>
            {members.map((m, mIdx) => (
              <option key={`${m.id || (m as any)._id}-${mIdx}`} value={m.id || (m as any)._id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        {hasActiveFilters && (
          <button
            className="btn btn-ghost btn-sm"
            onClick={onClearFilters}
            style={{ fontSize: '0.75rem', gap: '4px' }}
          >
            <X size={12} />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Background Preset Picker */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Palette size={15} color="var(--text-subtle)" style={{ marginRight: '4px' }} />
          {[
            { id: 'gradient-sunset', color: '#1e1b4b', title: 'Sunset Obsidian' },
            { id: 'gradient-ocean', color: '#064e3b', title: 'Emerald Ocean' },
            { id: 'gradient-aurora', color: '#4c1d95', title: 'Aurora Violet' },
            { id: 'gradient-midnight', color: '#1e293b', title: 'Midnight Slate' },
          ].map((theme) => (
            <button
              key={theme.id}
              onClick={() => onChangeBackground(theme.id)}
              style={{
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                background: theme.color,
                border: currentBoard?.background === theme.id ? '2px solid #6366f1' : '1px solid rgba(255, 255, 255, 0.2)',
                cursor: 'pointer',
              }}
              title={theme.title}
            />
          ))}
        </div>

        {/* Invite Member (Admin/Owner only) */}
        {!isViewer && (
          <button className="btn btn-secondary btn-sm" onClick={onOpenInviteModal}>
            <UserPlus size={14} />
            <span>Invite</span>
          </button>
        )}

        {/* Add Column (Member+ only) */}
        {!isViewer && (
          <button className="btn btn-primary btn-sm" onClick={onOpenAddColumnModal}>
            <Plus size={14} />
            <span>New Column</span>
          </button>
        )}
      </div>
    </div>
  );
};
