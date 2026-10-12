import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { verifyToken } from '../utils/jwt';
import { User } from '../models/User';

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    // Verify user still exists in database
    const user = await User.findById(decoded.id).select('name email avatar');
    if (!user) {
      res.status(401).json({ success: false, message: 'User not found or session invalid.' });
      return;
    }

    req.user = {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
    };

    next();
  } catch (error: any) {
    res.status(401).json({ success: false, message: 'Invalid or expired authentication token.' });
  }
};
