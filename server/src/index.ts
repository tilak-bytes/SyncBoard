import http from 'http';
import { createApp } from './app';
import { connectDB } from './config/db';
import { ENV } from './config/env';
import { initSocketServer } from './socket/socketServer';

const startServer = async () => {
  await connectDB();

  const app = createApp();
  const httpServer = http.createServer(app);

  // Attach Socket.IO
  initSocketServer(httpServer, ENV.CLIENT_ORIGIN);

  httpServer.listen(ENV.PORT, () => {
    console.log(`🚀 [SyncBoard Server] Listening on port ${ENV.PORT} (${ENV.NODE_ENV})`);
    console.log(`🔌 [Socket.IO] Ready for real-time collaboration`);
  });
};

startServer().catch((err) => {
  console.error('Fatal Server Error:', err);
  process.exit(1);
});
