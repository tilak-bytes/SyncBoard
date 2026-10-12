import { Router } from 'express';
import {
  createColumn,
  updateColumn,
  reorderColumns,
  deleteColumn,
  createColumnSchema,
  updateColumnSchema,
  reorderColumnsSchema,
} from '../controllers/columnController';
import { requireAuth } from '../middleware/authMiddleware';
import { requireBoardRole } from '../middleware/rbacMiddleware';
import { validateBody } from '../middleware/validationMiddleware';

const router = Router();

router.use(requireAuth);

router.post(
  '/boards/:boardId/columns',
  requireBoardRole('member'),
  validateBody(createColumnSchema),
  createColumn
);

router.put(
  '/boards/:boardId/columns/reorder',
  requireBoardRole('member'),
  validateBody(reorderColumnsSchema),
  reorderColumns
);

router.put('/columns/:id', validateBody(updateColumnSchema), updateColumn);
router.delete('/columns/:id', deleteColumn);

export default router;
