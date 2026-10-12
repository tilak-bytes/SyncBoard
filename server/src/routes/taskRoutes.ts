import { Router } from 'express';
import {
  createTask,
  getTask,
  updateTask,
  moveTask,
  deleteTask,
  createTaskSchema,
  updateTaskSchema,
  moveTaskSchema,
} from '../controllers/taskController';
import { requireAuth } from '../middleware/authMiddleware';
import { validateBody } from '../middleware/validationMiddleware';

const router = Router();

router.use(requireAuth);

router.post('/columns/:columnId/tasks', validateBody(createTaskSchema), createTask);
router.get('/tasks/:id', getTask);
router.put('/tasks/:id', validateBody(updateTaskSchema), updateTask);
router.put('/tasks/:id/move', validateBody(moveTaskSchema), moveTask);
router.delete('/tasks/:id', deleteTask);

export default router;
