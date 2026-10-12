import { Router } from 'express';
import {
  register,
  login,
  getMe,
  updateProfile,
  registerSchema,
  loginSchema,
} from '../controllers/authController';
import { requireAuth } from '../middleware/authMiddleware';
import { validateBody } from '../middleware/validationMiddleware';

const router = Router();

router.post('/register', validateBody(registerSchema), register);
router.post('/login', validateBody(loginSchema), login);
router.get('/me', requireAuth, getMe);
router.put('/profile', requireAuth, updateProfile);

export default router;
