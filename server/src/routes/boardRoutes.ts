import { Router } from 'express';
import {
  getBoardsByWorkspace,
  createBoard,
  getBoard,
  updateBoard,
  deleteBoard,
  syncBoard,
  createBoardSchema,
  updateBoardSchema,
} from '../controllers/boardController';
import { requireAuth } from '../middleware/authMiddleware';
import { requireWorkspaceRole, requireBoardRole } from '../middleware/rbacMiddleware';
import { validateBody } from '../middleware/validationMiddleware';

const router = Router();

router.use(requireAuth);

// Workspace-scoped board routes
router.get('/workspaces/:workspaceId/boards', requireWorkspaceRole('viewer'), getBoardsByWorkspace);
router.post(
  '/workspaces/:workspaceId/boards',
  requireWorkspaceRole('member'),
  validateBody(createBoardSchema),
  createBoard
);

// Board-scoped routes
router.get('/boards/:id', requireBoardRole('viewer'), getBoard);
router.put('/boards/:id', requireBoardRole('member'), validateBody(updateBoardSchema), updateBoard);
router.delete('/boards/:id', requireBoardRole('admin'), deleteBoard);
router.get('/boards/:id/sync', requireBoardRole('viewer'), syncBoard);

export default router;
