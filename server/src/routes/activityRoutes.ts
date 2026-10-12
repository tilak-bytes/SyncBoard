import { Router } from 'express';
import { getBoardActivity, getWorkspaceActivity } from '../controllers/activityController';
import { requireAuth } from '../middleware/authMiddleware';
import { requireBoardRole, requireWorkspaceRole } from '../middleware/rbacMiddleware';

const router = Router();

router.use(requireAuth);

router.get('/boards/:boardId/activity', requireBoardRole('viewer'), getBoardActivity);
router.get('/workspaces/:workspaceId/activity', requireWorkspaceRole('viewer'), getWorkspaceActivity);

export default router;
