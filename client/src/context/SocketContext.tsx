import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { ActiveUser } from '../types';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  activeUsers: ActiveUser[];
  typingUsers: Record<string, string>; // taskId -> userName
  joinBoard: (boardId: string) => void;
  leaveBoard: (boardId: string) => void;
  sendTyping: (boardId: string, taskId: string) => void;
  sendStopTyping: (boardId: string, taskId: string) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
  const [typingUsers, setTypingUsers] = useState<Record<string, string>>({});
  const currentBoardRef = useRef<string | null>(null);

  useEffect(() => {
    if (!token) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    const newSocket = io({
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      // Re-join board room if reconnected
      if (currentBoardRef.current) {
        newSocket.emit('join:board', {
          boardId: currentBoardRef.current,
          avatar: user?.avatar,
        });
      }
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    newSocket.on('presence:update', (users: ActiveUser[]) => {
      setActiveUsers(users);
    });

    newSocket.on('task:typing', ({ taskId, userName }: { taskId: string; userName: string }) => {
      setTypingUsers((prev) => ({ ...prev, [taskId]: userName }));
    });

    newSocket.on('task:stopped-typing', ({ taskId }: { taskId: string }) => {
      setTypingUsers((prev) => {
        const copy = { ...prev };
        delete copy[taskId];
        return copy;
      });
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [token]);

  const joinBoard = (boardId: string) => {
    currentBoardRef.current = boardId;
    if (socket && socket.connected) {
      socket.emit('join:board', { boardId, avatar: user?.avatar });
    }
  };

  const leaveBoard = (boardId: string) => {
    if (currentBoardRef.current === boardId) {
      currentBoardRef.current = null;
    }
    if (socket && socket.connected) {
      socket.emit('leave:board', { boardId });
    }
    setActiveUsers([]);
  };

  const sendTyping = (boardId: string, taskId: string) => {
    if (socket && socket.connected) {
      socket.emit('task:typing', { boardId, taskId });
    }
  };

  const sendStopTyping = (boardId: string, taskId: string) => {
    if (socket && socket.connected) {
      socket.emit('task:stopped-typing', { boardId, taskId });
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        activeUsers,
        typingUsers,
        joinBoard,
        leaveBoard,
        sendTyping,
        sendStopTyping,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
