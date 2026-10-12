import mongoose from 'mongoose';
import { ENV } from '../config/env';
import { User } from '../models/User';
import { Workspace } from '../models/Workspace';
import { Board } from '../models/Board';
import { Column } from '../models/Column';
import { Task } from '../models/Task';
import { Comment } from '../models/Comment';
import { ActivityLog } from '../models/ActivityLog';

const seedDatabase = async () => {
  try {
    console.log('[Seed] Connecting to MongoDB at', ENV.MONGODB_URI);
    await mongoose.connect(ENV.MONGODB_URI);

    console.log('[Seed] Clearing existing collections...');
    await Promise.all([
      User.deleteMany({}),
      Workspace.deleteMany({}),
      Board.deleteMany({}),
      Column.deleteMany({}),
      Task.deleteMany({}),
      Comment.deleteMany({}),
      ActivityLog.deleteMany({}),
    ]);

    console.log('[Seed] Creating demo team users...');
    const defaultPassword = 'Password123!';

    const alex = await User.create({
      name: 'Alex Chen',
      email: 'alex@syncboard.dev',
      password: defaultPassword,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    });

    const sarah = await User.create({
      name: 'Sarah Connor',
      email: 'sarah@syncboard.dev',
      password: defaultPassword,
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    });

    const jordan = await User.create({
      name: 'Jordan Smith',
      email: 'jordan@syncboard.dev',
      password: defaultPassword,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    });

    const elena = await User.create({
      name: 'Elena Rostova',
      email: 'elena@syncboard.dev',
      password: defaultPassword,
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    });

    console.log('[Seed] Creating workspaces...');
    const workspace = await Workspace.create({
      name: 'Acme Cloud Engineering',
      description: 'High-performance collaborative engineering workspace for mission-critical microservices.',
      owner: alex._id,
      members: [
        { user: alex._id, role: 'owner', joinedAt: new Date() },
        { user: sarah._id, role: 'admin', joinedAt: new Date() },
        { user: jordan._id, role: 'member', joinedAt: new Date() },
        { user: elena._id, role: 'viewer', joinedAt: new Date() },
      ],
    });

    console.log('[Seed] Creating board: Sprint 42 - Core Platform...');
    const board = await Board.create({
      title: 'Sprint 42 - Core Platform',
      description: 'Real-time collaborative release cycle focusing on optimistic concurrency and WebSocket streaming.',
      workspace: workspace._id,
      background: 'gradient-sunset',
      isStarred: true,
      createdBy: alex._id,
    });

    console.log('[Seed] Creating columns...');
    const colBacklog = await Column.create({
      title: 'Backlog',
      boardId: board._id,
      order: 0,
      color: '#64748b',
    });

    const colTodo = await Column.create({
      title: 'To Do',
      boardId: board._id,
      order: 1,
      color: '#f59e0b',
    });

    const colInProgress = await Column.create({
      title: 'In Progress',
      boardId: board._id,
      order: 2,
      color: '#3b82f6',
    });

    const colReview = await Column.create({
      title: 'Review',
      boardId: board._id,
      order: 3,
      color: '#8b5cf6',
    });

    const colDone = await Column.create({
      title: 'Done',
      boardId: board._id,
      order: 4,
      color: '#10b981',
    });

    console.log('[Seed] Creating tasks...');
    const task1 = await Task.create({
      title: 'Implement WebSocket delta sync for network drops',
      description: 'When connection is dropped and restored, query `/api/boards/:id/sync?since=timestamp` to reconcile cards without page reload.',
      boardId: board._id,
      columnId: colInProgress._id,
      order: 0,
      priority: 'urgent',
      dueDate: new Date(Date.now() + 86400000 * 2),
      labels: ['realtime', 'socketio', 'high-priority'],
      assignees: [alex._id, jordan._id],
      checklist: [
        { id: '1', text: 'Store lastSyncedAt timestamp in client state', completed: true },
        { id: '2', text: 'Listen for socket `reconnect` lifecycle event', completed: true },
        { id: '3', text: 'Merge server delta tasks into React Kanban store', completed: false },
      ],
      version: 1,
      createdBy: alex._id,
    });

    const task2 = await Task.create({
      title: 'Design Glassmorphism Kanban Column and Card UI',
      description: 'Create sleek CSS custom properties, backdrop filters, luminous hover effects, and modern drag-ghost shadows.',
      boardId: board._id,
      columnId: colDone._id,
      order: 0,
      priority: 'high',
      dueDate: new Date(Date.now() + 86400000 * 4),
      labels: ['design', 'ui/ux', 'frontend'],
      assignees: [sarah._id],
      checklist: [
        { id: '1', text: 'Configure CSS root design tokens', completed: true },
        { id: '2', text: 'Add fluid micro-interactions on task hover', completed: true },
        { id: '3', text: 'Support seamless Dark / Light modes', completed: true },
      ],
      version: 1,
      createdBy: sarah._id,
    });

    const task3 = await Task.create({
      title: 'Optimistic Concurrency Control (OCC) Version Conflict Handling',
      description: 'Guarantee zero lost updates by checking integer version on Task mutation. Return 409 Conflict with fresh entity if stale.',
      boardId: board._id,
      columnId: colReview._id,
      order: 0,
      priority: 'urgent',
      dueDate: new Date(Date.now() + 86400000 * 1),
      labels: ['backend', 'concurrency', 'mongodb'],
      assignees: [alex._id],
      checklist: [
        { id: '1', text: 'Add version field to Mongoose schema with index', completed: true },
        { id: '2', text: 'Atomic findOneAndUpdate with version match', completed: true },
        { id: '3', text: 'Client toast alert with automatic state reconciliation', completed: true },
      ],
      version: 1,
      createdBy: alex._id,
    });

    const task4 = await Task.create({
      title: 'Role-Based Access Control (RBAC) Enforcement',
      description: 'Ensure Viewer accounts cannot move or mutate tasks, while Admin/Owner accounts manage workspace members.',
      boardId: board._id,
      columnId: colTodo._id,
      order: 0,
      priority: 'medium',
      dueDate: new Date(Date.now() + 86400000 * 5),
      labels: ['security', 'auth', 'rbac'],
      assignees: [sarah._id, alex._id],
      checklist: [
        { id: '1', text: 'Define hierarchy: Owner (4) > Admin (3) > Member (2) > Viewer (1)', completed: true },
        { id: '2', text: 'Apply middleware to task mutation routes', completed: true },
        { id: '3', text: 'Disable drag handles for Viewers in frontend UI', completed: false },
      ],
      version: 1,
      createdBy: sarah._id,
    });

    const task5 = await Task.create({
      title: 'Compound Indexing Strategy for Drag-and-Drop Queries',
      description: 'Add compound indexes on `{ boardId: 1, columnId: 1, order: 1 }` to make card reordering sub-millisecond.',
      boardId: board._id,
      columnId: colBacklog._id,
      order: 0,
      priority: 'low',
      dueDate: new Date(Date.now() + 86400000 * 7),
      labels: ['database', 'performance'],
      assignees: [jordan._id],
      checklist: [
        { id: '1', text: 'Inspect explain() plan for reorder queries', completed: false },
        { id: '2', text: 'Verify compound index utilization', completed: false },
      ],
      version: 1,
      createdBy: jordan._id,
    });

    console.log('[Seed] Adding realistic comments...');
    await Comment.create({
      taskId: task1._id,
      boardId: board._id,
      user: alex._id,
      content: 'I verified the Socket.IO heartbeat ping is working nicely. Reconnection handler is almost done!',
    });

    await Comment.create({
      taskId: task1._id,
      boardId: board._id,
      user: sarah._id,
      content: 'Awesome! Tested from mobile hotspot disconnect, recovered state smoothly.',
    });

    await Comment.create({
      taskId: task3._id,
      boardId: board._id,
      user: jordan._id,
      content: 'The 409 conflict detection prevented an accidental overwrite during pair testing today.',
    });

    console.log('[Seed] Adding activity audit logs...');
    await ActivityLog.create({
      workspaceId: workspace._id,
      boardId: board._id,
      actor: alex._id,
      action: 'board:created',
      details: { boardTitle: 'Sprint 42 - Core Platform' },
      createdAt: new Date(Date.now() - 3600000 * 4),
    });

    await ActivityLog.create({
      workspaceId: workspace._id,
      boardId: board._id,
      actor: alex._id,
      action: 'task:created',
      details: { taskTitle: task1.title, columnTitle: 'In Progress', priority: 'urgent' },
      createdAt: new Date(Date.now() - 3600000 * 3),
    });

    await ActivityLog.create({
      workspaceId: workspace._id,
      boardId: board._id,
      actor: sarah._id,
      action: 'task:moved',
      details: { taskTitle: task2.title, fromColumn: 'Review', toColumn: 'Done' },
      createdAt: new Date(Date.now() - 3600000 * 2),
    });

    await ActivityLog.create({
      workspaceId: workspace._id,
      boardId: board._id,
      actor: jordan._id,
      action: 'comment:added',
      details: { taskTitle: task3.title },
      createdAt: new Date(Date.now() - 1800000),
    });

    console.log('✅ [Seed] Database successfully populated with rich demo data!');
    console.log('--- DEMO CREDENTIALS ---');
    console.log('👑 Owner:   alex@syncboard.dev    / Password123!');
    console.log('🛡️ Admin:   sarah@syncboard.dev   / Password123!');
    console.log('💻 Member:  jordan@syncboard.dev  / Password123!');
    console.log('👁️ Viewer:  elena@syncboard.dev   / Password123!');
    console.log('------------------------');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ [Seed] Error populating database:', error);
    process.exit(1);
  }
};

seedDatabase();
