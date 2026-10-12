import request from 'supertest';
import mongoose from 'mongoose';
import { createApp } from '../app';
import { ENV } from '../config/env';
import { User } from '../models/User';
import { Workspace } from '../models/Workspace';
import { Board } from '../models/Board';
import { Column } from '../models/Column';
import { Task } from '../models/Task';

const app = createApp();

describe('SyncBoard Backend API Test Suite', () => {
  beforeAll(async () => {
    // Connect to test database
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(ENV.MONGODB_URI);
    }
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('1. Authentication APIs', () => {
    const testEmail = `testuser_${Date.now()}@syncboard.dev`;

    it('should register a new user successfully and return JWT token', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test Tester',
          email: testEmail,
          password: 'Password123!',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe(testEmail.toLowerCase());
    });

    it('should reject registration with duplicate email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test Duplicate',
          email: testEmail,
          password: 'Password123!',
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it('should login with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testEmail,
          password: 'Password123!',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
    });

    it('should reject login with wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testEmail,
          password: 'WrongPassword!',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('2. RBAC & Concurrency Control', () => {
    let ownerToken: string;
    let viewerToken: string;
    let workspaceId: string;
    let boardId: string;
    let columnId: string;
    let taskId: string;

    beforeAll(async () => {
      // Login owner (Alex Chen)
      const ownerRes = await request(app).post('/api/auth/login').send({
        email: 'alex@syncboard.dev',
        password: 'Password123!',
      });
      ownerToken = ownerRes.body.token;

      // Login viewer (Elena Rostova)
      const viewerRes = await request(app).post('/api/auth/login').send({
        email: 'elena@syncboard.dev',
        password: 'Password123!',
      });
      viewerToken = viewerRes.body.token;

      // Get workspace
      const ws = await Workspace.findOne({ name: 'Acme Cloud Engineering' });
      workspaceId = ws!._id.toString();

      // Get board
      const b = await Board.findOne({ workspace: workspaceId });
      boardId = b!._id.toString();

      // Get column
      const col = await Column.findOne({ boardId });
      columnId = col!._id.toString();
    });

    it('should allow Owner to create a new task', async () => {
      const res = await request(app)
        .post(`/api/columns/${columnId}/tasks`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          title: 'Automated Test Task',
          description: 'Testing task creation and concurrency',
          priority: 'high',
          labels: ['test'],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.task.version).toBe(1);
      taskId = res.body.task._id;
    });

    it('should detect Concurrency Conflict (OCC) when editing with stale version', async () => {
      // 1. Fetch task current version
      const currentTask = await Task.findById(taskId);
      const v = currentTask!.version;

      // 2. Perform first update with correct version
      const update1 = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          title: 'Updated by User A',
          version: v,
        });

      expect(update1.status).toBe(200);
      expect(update1.body.task.version).toBe(v + 1);

      // 3. User B attempts update with old version (v) -> should return 409 Conflict
      const update2 = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          title: 'Conflicting update by User B',
          version: v, // Stale version!
        });

      expect(update2.status).toBe(409);
      expect(update2.body.conflict).toBe(true);
    });

    it('should allow Delta Sync recovery on reconnect', async () => {
      const syncRes = await request(app)
        .get(`/api/boards/${boardId}/sync?since=${new Date(0).toISOString()}`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(syncRes.status).toBe(200);
      expect(syncRes.body.success).toBe(true);
      expect(syncRes.body.tasks.length).toBeGreaterThan(0);
    });
  });
});
