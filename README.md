# 🚀 SyncBoard — Real-Time Collaborative Kanban Platform

[![CI Pipeline](https://github.com/tilak-bytes/SyncBoard/actions/workflows/ci.yml/badge.svg)](https://github.com/tilak-bytes/SyncBoard/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7+-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-22+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19+-61dafb.svg)](https://react.dev/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.8+-black.svg)](https://socket.io/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248.svg)](https://www.mongodb.com/)

> **SyncBoard** is an enterprise-grade, real-time collaborative task management platform engineered with a clean modular-monolith architecture. It features JWT authentication, multi-tenant workspaces, drag-and-drop Kanban boards, **Optimistic Concurrency Control (OCC)**, live user presence tracking via Socket.IO, role-based access control (RBAC), and reconnection delta recovery.

---

## 📑 Table of Contents
1. [High-Level Architecture](#-high-level-architecture)
2. [Concurrency & Conflict Strategy (OCC)](#-concurrency--conflict-strategy-occ)
3. [Key Features](#-key-features)
4. [SDE Interview Preparation & Architecture Q&A](#-sde-interview-preparation--architecture-qa)
5. [Database Schema & Indexing Strategy](#-database-schema--indexing-strategy)
6. [REST API Documentation](#-rest-api-documentation)
7. [WebSocket Event Specification](#-websocket-event-specification)
8. [Demo Persona Credentials](#-demo-persona-credentials)
9. [Local Development Setup](#-local-development-setup)
10. [Docker & Deployment Guide](#-docker--deployment-guide)

---

## 🏛️ High-Level Architecture

SyncBoard is designed as a **Modular Monolith** to maximize developer productivity, minimize operational complexity, and avoid unnecessary distributed microservice latency.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        React 19 + Vite Frontend                        │
│                                                                        │
│   ┌────────────────────┐  ┌───────────────────┐  ┌──────────────────┐  │
│   │   AuthContext      │  │   SocketContext   │  │   ToastContext   │  │
│   │   - JWT Session    │  │   - Live Presence │  │   - OCC Alerts   │  │
│   │   - Demo Personas  │  │   - Delta Sync    │  │   - Notifications│  │
│   └────────────────────┘  └───────────────────┘  └──────────────────┘  │
│                                                                        │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │   Kanban Board Canvas (@hello-pangea/dnd)                      │   │
│   │   - Optimistic DnD Updates  - Column Reordering                │   │
│   │   - Version Tags (v1, v2)   - Real-Time Typing Indicators      │   │
│   └────────────────────────────────────────────────────────────────┘   │
└───────────────────▲────────────────────────────────▲───────────────────┘
                    │ REST HTTP (JWT)                │ WebSocket (Socket.IO)
                    │                                │
┌───────────────────▼────────────────────────────────▼───────────────────┐
│                      Express.js + TypeScript Server                    │
│                                                                        │
│   ┌──────────────────────────┐      ┌──────────────────────────────┐   │
│   │  Security & RBAC Guard   │      │  Real-Time Event Hub         │   │
│   │  - JWT Verification      │      │  - Board Rooms (board:<id>)  │   │
│   │  - Owner > Admin >       │      │  - Active User Presence      │   │
│   │    Member > Viewer       │      │  - Event Broadcasting        │   │
│   └──────────────────────────┘      └──────────────────────────────┘   │
│                                                                        │
│   ┌──────────────────────────┐      ┌──────────────────────────────┐   │
│   │  OCC Concurrency Engine  │      │  Delta Sync Recovery         │   │
│   │  - Atomic Version Check  │      │  - /api/boards/:id/sync      │   │
│   │  - 409 Conflict Handling │      │  - Missed event reconciliation│   │
│   └──────────────────────────┘      └──────────────────────────────┘   │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │ Mongoose ODM
                                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│                            MongoDB Database                            │
│                                                                        │
│   Collections: Users, Workspaces, Boards, Columns, Tasks, Comments,     │
│                ActivityLogs                                            │
│   Compound Indexes:                                                    │
│     - { boardId: 1, columnId: 1, order: 1 } (DnD performance)         │
│     - { boardId: 1, updatedAt: -1 }         (Delta sync speed)         │
│     - { 'members.user': 1 }                 (Workspace authorization)  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## ⚡ Concurrency & Conflict Strategy (OCC)

### Why Optimistic Concurrency Control?
In collaborative task management, users frequently make independent modifications (moving cards, editing descriptions, checking items). Locking the task in the database (**Pessimistic Locking**) would prevent teammates from viewing or moving related cards, causing severe bottlenecks and deadlocks when network drops occur.

### OCC Implementation
Every `Task` document maintains a strictly increasing integer `version` property initialized to `1`.

```typescript
// Atomic update with version validation
const updatedTask = await Task.findOneAndUpdate(
  {
    _id: taskId,
    version: expectedVersion, // Verifies task was not modified since client last loaded it
  },
  {
    $set: updates,
    $inc: { version: 1 }, // Atomically bump version
  },
  { new: true }
);

if (!updatedTask) {
  // Version mismatch detected! Return 409 Conflict with the fresh state
  const latestTask = await Task.findById(taskId);
  return res.status(409).json({
    conflict: true,
    message: 'Concurrency Conflict: Task was updated by another collaborator.',
    latestTask,
  });
}
```

### Client Conflict Resolution
1. When user receives `409 Conflict`, the UI preserves user input and displays a non-destructive conflict alert.
2. The user can reload the latest server snapshot or inspect diffs without data loss.

---

## 🎯 Key Features

- **Multi-Tenant Workspaces**: Create independent workspaces, invite teammates via email, and isolate project data.
- **Role-Based Access Control (RBAC)**:
  - 👑 **Owner**: Full workspace management, member role updates, workspace deletion.
  - 🛡️ **Admin**: Manage boards, invite new members, configure columns.
  - 💻 **Member**: Create, edit, drag tasks, check items, write comments.
  - 👁️ **Viewer**: Read-only observation. Mutation buttons and drag handles are disabled.
- **Fluid Drag-and-Drop**: Built using `@hello-pangea/dnd` for smooth 60fps card moves across columns with optimistic local preview.
- **Real-Time Collaboration**:
  - Live collaborator presence avatar stack with active green indicators.
  - Real-time typing indicators (`"Jordan is editing..."`).
  - Broadcast of card moves, edits, checklists, and comments without manual refresh.
- **Delta Sync on Reconnection**: When reconnecting from a network drop or sleep, the client fetches changes via `/api/boards/:id/sync?since=timestamp` to recover state without full page reload.
- **Interactive Checklists**: Multi-item sub-tasks with real-time percentage progress bar.
- **Audit Activity Trail**: Real-time logging of card creation, movements, priority updates, and comments.

---

## 🎓 SDE Interview Preparation & Architecture Q&A

### Q1: Why did you choose a Modular Monolith over Microservices for SyncBoard?
> **Answer**: A modular monolith provides the optimal balance of engineering speed, transactional consistency, and latency for this workload. With microservices, maintaining consistency between Workspaces, Tasks, and Comments would require distributed transactions (Two-Phase Commit or Saga pattern with Kafka), introducing unnecessary network latency and failure modes. Our modular monolith organizes clean domain boundaries (`auth`, `workspace`, `board`, `task`, `activity`) that can be factored into microservices in the future if independent scaling becomes necessary.

### Q2: How do you handle WebSocket connection drops and out-of-order packets?
> **Answer**: WebSockets are inherently stateful and prone to temporary disconnects (e.g., laptop sleep, cellular handoff). We address this with a two-phase recovery mechanism:
> 1. Socket.IO heartbeat ping/pong (25s interval, 60s timeout) detects dropped connections and initiates automatic exponential backoff reconnection.
> 2. The client records `lastSyncedAt`. Upon the `reconnect` lifecycle event, it issues a delta query: `GET /api/boards/:id/sync?since=lastSyncedAt`. The server uses compound index `{ boardId: 1, updatedAt: -1 }` to return only records mutated during the downtime.

### Q3: What is your database indexing strategy for drag-and-drop operations?
> **Answer**: Card movement requires querying tasks by column and sorting by rank:
> - **Compound Index `{ boardId: 1, columnId: 1, order: 1 }`**: Ensures index-covered queries for fetching cards in exact display order without in-memory sorting.
> - **Compound Index `{ boardId: 1, updatedAt: -1 }`**: Speeds up delta sync queries.
> - **Index `{ 'members.user': 1 }`**: Allows instantaneous authorization verification during RBAC checks without full collection scans.

### Q4: How would you scale this to 100,000 concurrent WebSocket connections?
> **Answer**:
> 1. **Socket.IO Redis Adapter / Redis Streams**: Distribute WebSocket nodes behind an NGINX load balancer using IP hash sticky sessions. Use the `@socket.io/redis-adapter` to publish room broadcasts across server instances.
> 2. **MongoDB Read Replicas**: Direct delta sync read queries to secondary replica nodes, keeping primary available for write transactions.
> 3. **Change Streams**: Use MongoDB Change Streams (`watch()`) to power real-time updates directly from oplog if multiple microservices are introduced.

---

## 🗄️ Database Schema & Indexing Strategy

| Collection | Key Fields | Indexes |
| :--- | :--- | :--- |
| **User** | `name`, `email`, `password` (select: false), `avatar` | `{ email: 1 }` (unique) |
| **Workspace** | `name`, `owner`, `members: [{ user, role, joinedAt }]` | `{ 'members.user': 1 }`, `{ owner: 1 }` |
| **Board** | `title`, `workspace`, `background`, `isStarred`, `createdBy` | `{ workspace: 1, createdAt: -1 }` |
| **Column** | `title`, `boardId`, `order`, `color` | `{ boardId: 1, order: 1 }` |
| **Task** | `title`, `description`, `boardId`, `columnId`, `order`, `priority`, `dueDate`, `labels`, `assignees`, `checklist`, `version` | `{ boardId: 1, columnId: 1, order: 1 }`, `{ boardId: 1, updatedAt: -1 }`, `{ assignees: 1 }` |
| **Comment** | `taskId`, `boardId`, `user`, `content` | `{ taskId: 1, createdAt: 1 }` |
| **ActivityLog** | `workspaceId`, `boardId`, `actor`, `action`, `details` | `{ boardId: 1, createdAt: -1 }`, `{ workspaceId: 1, createdAt: -1 }` |

---

## 📡 REST API Documentation

### Authentication
- `POST /api/auth/register` — Create account (`name`, `email`, `password`)
- `POST /api/auth/login` — Sign in and receive JWT token
- `GET /api/auth/me` — Get authenticated user details
- `PUT /api/auth/profile` — Update display name and avatar

### Workspaces & RBAC
- `GET /api/workspaces` — List workspaces user belongs to
- `POST /api/workspaces` — Create workspace (caller becomes `Owner`)
- `GET /api/workspaces/:id` — Get workspace with members and boards
- `PUT /api/workspaces/:id` — Update workspace details (`Admin`+)
- `DELETE /api/workspaces/:id` — Delete workspace and cascade assets (`Owner` only)
- `POST /api/workspaces/:id/members` — Add member with role (`Admin`+)
- `PUT /api/workspaces/:id/members/:userId` — Update member role (`Admin`+)
- `DELETE /api/workspaces/:id/members/:userId` — Remove member

### Boards & Columns
- `GET /api/workspaces/:workspaceId/boards` — List boards
- `POST /api/workspaces/:workspaceId/boards` — Create board with default starter columns
- `GET /api/boards/:id` — Full board data (columns, tasks, assignees)
- `PUT /api/boards/:id` — Update title, background, starred status
- `DELETE /api/boards/:id` — Delete board (`Admin`+)
- `GET /api/boards/:id/sync?since=<iso>` — Delta sync for reconnection recovery
- `POST /api/boards/:boardId/columns` — Create column
- `PUT /api/columns/:id` — Update column title or color
- `PUT /api/boards/:boardId/columns/reorder` — Batch update column orders
- `DELETE /api/columns/:id` — Delete column and its tasks

### Tasks & Concurrency
- `POST /api/columns/:columnId/tasks` — Create task
- `GET /api/tasks/:id` — Get task with comments and activity history
- `PUT /api/tasks/:id` — Update task with version check (OCC: returns `409` on conflict)
- `PUT /api/tasks/:id/move` — Drag-and-drop movement & index shifting
- `DELETE /api/tasks/:id` — Delete task

---

## 🔌 WebSocket Event Specification

| Event Name | Direction | Payload | Description |
| :--- | :--- | :--- | :--- |
| `join:board` | Client ➔ Server | `{ boardId, avatar }` | Subscribes socket to room `board:<id>` |
| `leave:board` | Client ➔ Server | `{ boardId }` | Unsubscribes from board room |
| `presence:update` | Server ➔ Room | `ActiveUser[]` | Emits active viewer avatars |
| `task:typing` | Client ➔ Server | `{ boardId, taskId }` | Broadcasts user editing indicator |
| `task:created` | Server ➔ Room | `Task` | Notifies new card added |
| `task:updated` | Server ➔ Room | `Task` | Notifies task update with incremented version |
| `task:moved` | Server ➔ Room | `{ taskId, sourceCol, destCol, destIndex, affectedTasks }` | Synchronizes card drag-and-drop |
| `task:deleted` | Server ➔ Room | `{ taskId, columnId }` | Removes deleted card |
| `comment:created`| Server ➔ Room | `{ taskId, comment }` | Appends real-time comment |

---

## 👥 Demo Persona Credentials

Use the **Instant 1-Click Login buttons** on the sign-in page to test role-based permissions:

| Persona | Role | Email | Password | Access Rights |
| :--- | :--- | :--- | :--- | :--- |
| **Alex Chen** | 👑 Owner | `alex@syncboard.dev` | `Password123!` | Full control, delete workspace, manage all roles |
| **Sarah Connor** | 🛡️ Admin | `sarah@syncboard.dev` | `Password123!` | Manage boards, invite team, manage columns/tasks |
| **Jordan Smith** | 💻 Member | `jordan@syncboard.dev` | `Password123!` | Create, edit, move cards, checklists, comments |
| **Elena Rostova** | 👁️ Viewer | `elena@syncboard.dev` | `Password123!` | Read-only mode. Task drag handles & edits disabled |

---

## 💻 Local Development Setup

### Prerequisites
- Node.js 20+ (tested on Node 22 & 24)
- MongoDB instance (local or MongoDB Atlas connection string)

### Steps
1. **Clone the repository**:
   ```bash
   git clone https://github.com/tilak-bytes/SyncBoard.git
   cd SyncBoard
   ```

2. **Install all dependencies**:
   ```bash
   npm run install:all
   ```

3. **Configure Environment Variables**:
   In `server/.env`:
   ```env
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb://127.0.0.1:27017/syncboard
   JWT_SECRET=syncboard_jwt_dev_secret_key_9921_production_ready
   JWT_EXPIRES_IN=7d
   CLIENT_ORIGIN=http://localhost:5173
   ```

4. **Seed Database with Demo Data**:
   ```bash
   npm run seed
   ```

5. **Run Automated Test Suite**:
   ```bash
   npm run test
   ```

6. **Start Frontend & Backend Concurrently**:
   ```bash
   npm run dev
   ```
   - Frontend: `http://localhost:5173`
   - Backend API: `http://localhost:5000`

---

## 🐳 Docker & Deployment Guide

### Run with Docker Compose
```bash
docker compose up --build
```
This runs MongoDB and SyncBoard in orchestrated containers with persistent volumes.

### Cloud Deployments
- **Render**: Connect repository. Render automatically reads `render.yaml` to provision the backend web service and static client.
- **Vercel**: Deploy the `client/` folder using `vercel.json` rewrites.

---

## 📜 License
Distributed under the MIT License. Developed with ❤️ by **tilak-bytes**.
