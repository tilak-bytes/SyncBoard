import { Router } from 'express';
import {
  getWorkspaces,
  createWorkspace,
  getWorkspace,
  updateWorkspace,
  deleteWorkspace,
  addMember,
  updateMemberRole,
  removeMember,
  createWorkspaceSchema,
  addMemberSchema,
  updateMemberRoleSchema,
} from '../controllers/workspaceController';
import { requireAuth } from '../middleware/authMiddleware';
import { requireWorkspaceRole } from '../middleware/rbacMiddleware';
import { validateBody } from '../middleware/validationMiddleware';

const router = Router();

router.use(requireAuth);

router.get('/', getWorkspaces);
router.post('/', validateBody(createWorkspaceSchema), createWorkspace);

router.get('/:id', requireWorkspaceRole('viewer'), getWorkspace);
router.put('/:id', requireWorkspaceRole('admin'), updateWorkspace);
router.delete('/:id', requireWorkspaceRole('owner'), deleteWorkspace);

// Member management
router.post('/:id/members', requireWorkspaceRole('admin'), validateBody(addMemberSchema), addMember);
router.put(
  '/:id/members/:userId',
  requireWorkspaceRole('admin'),
  validateBody(updateMemberRoleSchema),
  updateMemberRole
);
router.delete('/:id/members/:userId', requireWorkspaceRole('viewer'), removeMember);

export default router;
