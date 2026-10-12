import React, { useState, useEffect } from 'react';
import { X, History, Activity } from 'lucide-react';
import { activityApi } from '../services/api';
import { ActivityLog } from '../types';
import { useSocket } from '../context/SocketContext';

interface ActivityDrawerProps {
  boardId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ActivityDrawer: React.FC<ActivityDrawerProps> = ({
  boardId,
  isOpen,
  onClose,
}) => {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { socket } = useSocket();

  useEffect(() => {
    if (!isOpen || !boardId) return;

    const fetchActivity = async () => {
      setIsLoading(true);
      try {
        const res = await activityApi.getBoardActivity(boardId);
        if (res.data.success) {
          setActivities(res.data.activities);
        }
      } catch (err) {
        console.error('Failed to load board activity:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchActivity();
  }, [boardId, isOpen]);

  // Real-time activity listening
  useEffect(() => {
    if (!socket) return;

    const handleNewActivity = (activity: ActivityLog) => {
      setActivities((prev) => [activity, ...prev]);
    };

    socket.on('activity:new', handleNewActivity);
    return () => {
      socket.off('activity:new', handleNewActivity);
    };
  }, [socket]);

  if (!isOpen) return null;

  const renderActionDescription = (act: ActivityLog) => {
    const details = act.details || {};
    switch (act.action) {
      case 'task:created':
        return `created task "${details.taskTitle || 'Untitled'}"`;
      case 'task:moved':
        return `moved task "${details.taskTitle}" from ${details.fromColumn} to ${details.toColumn}`;
      case 'task:updated':
        return `updated task "${details.taskTitle}"`;
      case 'task:deleted':
        return `deleted task "${details.taskTitle}"`;
      case 'comment:added':
        return `commented on task "${details.taskTitle}"`;
      case 'column:created':
        return `created list "${details.columnTitle}"`;
      case 'board:created':
        return `created board "${details.boardTitle}"`;
      case 'member:invited':
        return `invited ${details.memberName} as ${details.role}`;
      default:
        return act.action;
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        justifyContent: 'flex-end',
        background: 'rgba(3, 7, 18, 0.5)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '380px',
          height: '100%',
          background: 'var(--bg-surface)',
          borderLeft: '1px solid var(--border-medium)',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          flexDirection: 'column',
          animation: 'fadeIn 0.2s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={18} color="var(--primary)" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Board Activity Audit</h3>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Audit Log Stream */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
          {isLoading ? (
            <div style={{ textAlign: 'center', color: 'var(--text-subtle)', padding: '20px' }}>
              Loading audit logs...
            </div>
          ) : activities.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-subtle)', padding: '20px' }}>
              No activities logged yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {activities.map((act) => (
                <div
                  key={act._id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    fontSize: '0.825rem',
                  }}
                >
                  <img
                    src={act.actor?.avatar || 'https://api.dicebear.com/7.x/initials/svg?seed=User'}
                    alt={act.actor?.name}
                    className="avatar avatar-sm"
                    style={{ marginTop: '2px' }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ color: 'var(--text-main)', lineHeight: 1.4 }}>
                      <strong>{act.actor?.name || 'Someone'}</strong> {renderActionDescription(act)}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', marginTop: '2px' }}>
                      {new Date(act.createdAt).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
