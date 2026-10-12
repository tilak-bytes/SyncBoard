import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { User } from '../models/User';
import { Workspace } from '../models/Workspace';
import { Board } from '../models/Board';
import { Column } from '../models/Column';
import { Task } from '../models/Task';
import { signToken } from '../utils/jwt';
import { AuthRequest } from '../types';

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      res.status(409).json({ success: false, message: 'An account with this email already exists' });
      return;
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
    });

    // Auto-create a default personal workspace for new users with a sample starter board
    const workspace = await Workspace.create({
      name: `${name}'s Workspace`,
      description: 'Default personal workspace',
      owner: user._id,
      members: [{ user: user._id, role: 'owner', joinedAt: new Date() }],
    });

    const board = await Board.create({
      title: 'Sprint Planning',
      description: 'Welcome to your real-time Kanban board! Drag cards to get started.',
      workspace: workspace._id,
      background: 'gradient-sunset',
      isStarred: true,
      createdBy: user._id,
    });

    const col1 = await Column.create({ title: 'To Do', boardId: board._id, order: 0, color: '#f59e0b' });
    const col2 = await Column.create({ title: 'In Progress', boardId: board._id, order: 1, color: '#3b82f6' });
    const col3 = await Column.create({ title: 'Completed', boardId: board._id, order: 2, color: '#10b981' });

    await Task.create({
      title: 'Welcome to SyncBoard! 👋',
      description: 'Explore real-time multi-user task management with optimistic concurrency control.',
      boardId: board._id,
      columnId: col1._id,
      order: 0,
      priority: 'high',
      labels: ['onboarding', 'starter'],
      assignees: [user._id],
      checklist: [
        { id: '1', text: 'Drag this card to "In Progress"', completed: false },
        { id: '2', text: 'Add a new task', completed: false },
        { id: '3', text: 'Invite a team member', completed: false },
      ],
      version: 1,
      createdBy: user._id,
    });

    const token = signToken({
      id: user._id.toString(),
      email: user.email,
      name: user.name,
    });

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
      return;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
      return;
    }

    const token = signToken({
      id: user._id.toString(),
      email: user.email,
      name: user.name,
    });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await User.findById(req.user!.id);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, avatar } = req.body;
    const updates: any = {};
    if (name) updates.name = name;
    if (avatar) updates.avatar = avatar;

    const user = await User.findByIdAndUpdate(req.user!.id, { $set: updates }, { new: true });
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    next(error);
  }
};
