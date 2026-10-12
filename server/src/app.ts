import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { ENV } from './config/env';
import authRoutes from './routes/authRoutes';
import workspaceRoutes from './routes/workspaceRoutes';
import boardRoutes from './routes/boardRoutes';
import columnRoutes from './routes/columnRoutes';
import taskRoutes from './routes/taskRoutes';
import commentRoutes from './routes/commentRoutes';
import activityRoutes from './routes/activityRoutes';
import { errorHandler } from './middleware/errorHandler';

export const createApp = (): Application => {
  const app = express();

  // CORS configuration
  app.use(
    cors({
      origin: [ENV.CLIENT_ORIGIN, 'http://localhost:5173', 'http://127.0.0.1:5173'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  if (ENV.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
  }

  // Healthcheck
  app.get('/api/health', (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'healthy',
      service: 'SyncBoard API',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  // REST API Endpoints
  app.use('/api/auth', authRoutes);
  app.use('/api/workspaces', workspaceRoutes);
  app.use('/api', boardRoutes);
  app.use('/api', columnRoutes);
  app.use('/api', taskRoutes);
  app.use('/api', commentRoutes);
  app.use('/api', activityRoutes);

  // 404 Route
  app.use('*', (req: Request, res: Response) => {
    res.status(404).json({ success: false, message: `Route not found: ${req.originalUrl}` });
  });

  // Centralized Error Handling Middleware
  app.use(errorHandler);

  return app;
};
