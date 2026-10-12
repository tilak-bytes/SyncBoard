import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { verifyToken } from '../utils/jwt';
import { IActiveUser } from '../types';

let io: SocketIOServer | null = null;

// Track active users per board: boardId -> Map<socketId, IActiveUser>
const boardPresence = new Map<string, Map<string, IActiveUser>>();

export const initSocketServer = (httpServer: HTTPServer, clientOrigin: string): SocketIOServer => {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: clientOrigin,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  io.use((socket: Socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        return next(new Error('Authentication error: Missing token'));
      }

      const decoded = verifyToken(token);
      socket.data.user = decoded;
      next();
    } catch (err) {
      next(new Error('Authentication error: Invalid or expired token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = socket.data.user;

    // Join a Board Room
    socket.on('join:board', ({ boardId, avatar }: { boardId: string; avatar?: string }) => {
      if (!boardId) return;

      socket.join(`board:${boardId}`);

      if (!boardPresence.has(boardId)) {
        boardPresence.set(boardId, new Map());
      }

      const boardUsers = boardPresence.get(boardId)!;
      const activeUser: IActiveUser = {
        userId: user.id,
        name: user.name,
        email: user.email,
        avatar: avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name)}`,
        socketId: socket.id,
      };

      boardUsers.set(socket.id, activeUser);

      // Emit updated presence to everyone in this board room
      const uniqueUsers = Array.from(
        new Map(Array.from(boardUsers.values()).map((u) => [u.userId, u])).values()
      );
      io?.to(`board:${boardId}`).emit('presence:update', uniqueUsers);
    });

    // Leave a Board Room
    socket.on('leave:board', ({ boardId }: { boardId: string }) => {
      if (!boardId) return;

      socket.leave(`board:${boardId}`);
      const boardUsers = boardPresence.get(boardId);
      if (boardUsers) {
        boardUsers.delete(socket.id);
        if (boardUsers.size === 0) {
          boardPresence.delete(boardId);
        } else {
          const uniqueUsers = Array.from(
            new Map(Array.from(boardUsers.values()).map((u) => [u.userId, u])).values()
          );
          io?.to(`board:${boardId}`).emit('presence:update', uniqueUsers);
        }
      }
    });

    // Join a Workspace Room
    socket.on('join:workspace', ({ workspaceId }: { workspaceId: string }) => {
      if (!workspaceId) return;
      socket.join(`workspace:${workspaceId}`);
    });

    // Live Task Typing / Editing Indicators
    socket.on('task:typing', ({ boardId, taskId }: { boardId: string; taskId: string }) => {
      socket.to(`board:${boardId}`).emit('task:typing', {
        taskId,
        userId: user.id,
        userName: user.name,
      });
    });

    socket.on('task:stopped-typing', ({ boardId, taskId }: { boardId: string; taskId: string }) => {
      socket.to(`board:${boardId}`).emit('task:stopped-typing', {
        taskId,
        userId: user.id,
      });
    });

    // Disconnect cleanup
    socket.on('disconnect', () => {
      boardPresence.forEach((boardUsers, boardId) => {
        if (boardUsers.has(socket.id)) {
          boardUsers.delete(socket.id);
          if (boardUsers.size === 0) {
            boardPresence.delete(boardId);
          } else {
            const uniqueUsers = Array.from(
              new Map(Array.from(boardUsers.values()).map((u) => [u.userId, u])).values()
            );
            io?.to(`board:${boardId}`).emit('presence:update', uniqueUsers);
          }
        }
      });
    });
  });

  return io;
};

export const getSocketIO = (): SocketIOServer | null => {
  return io;
};
