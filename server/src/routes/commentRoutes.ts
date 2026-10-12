import { Router } from 'express';
import {
  getComments,
  createComment,
  deleteComment,
  createCommentSchema,
} from '../controllers/commentController';
import { requireAuth } from '../middleware/authMiddleware';
import { validateBody } from '../middleware/validationMiddleware';

const router = Router();

router.use(requireAuth);

router.get('/tasks/:taskId/comments', getComments);
router.post('/tasks/:taskId/comments', validateBody(createCommentSchema), createComment);
router.delete('/comments/:id', deleteComment);

export default router;
