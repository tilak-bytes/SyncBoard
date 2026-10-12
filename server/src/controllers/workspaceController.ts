import { Response, NextFunction } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import { Workspace } from '../models/Workspace';
import { Board } from '../models/Board';
import { Column } from '../models/Column';
import { Task } from '../models/Task';
import { Comment } from '../models/Comment';
import { ActivityLog } from '../models/ActivityLog';
import { User } from '../models/User';
import { AuthRequest } from '../types';
import { logActivity } from '../utils/auditLogger';

export const createWorkspaceSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  description: z.string().max(500).optional(),
});

export const addMemberSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  role: z.enum(['admin', 'member', 'viewer']).default('member'),
});

export const updateMemberRoleSchema = z.object({
  role: z.enum(['admin', 'member', 'viewer']),
});

export const getWorkspaces = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user!.id);
    const workspaces = await Workspace.find({
      $or: [{ owner: userId }, { 'members.user': userId }],
    })
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar')
      .sort({ updatedAt: -1 });

    const workspaceIds = workspaces.map((w) => w._id);
    const boardCounts = await Board.aggregate([
      { $match: { workspace: { $in: workspaceIds } } },
      { $group: { _id: '$workspace', count: { $sum: 1 } } },
    ]);

    const boardCountMap = new Map<string, number>();
    boardCounts.forEach((b) => boardCountMap.set(b._id.toString(), b.count));

    const result = workspaces.map((w) => {
      const userMember = w.members.find((m: any) => m.user?._id?.toString() === req.user!.id);
      const userRole = w.owner._id.toString() === req.user!.id ? 'owner' : userMember?.role || 'member';
      return {
        ...w.toObject(),
        boardCount: boardCountMap.get(w._id.toString()) || 0,
        currentUserRole: userRole,
      };
    });

    res.status(200).json({ success: true, workspaces: result });
  } catch (error) {
    next(error);
  }
};

export const createWorkspace = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, description } = req.body;
    const userId = new mongoose.Types.ObjectId(req.user!.id);

    const workspace = await Workspace.create({
      name,
      description: description || '',
      owner: userId,
      members: [{ user: userId, role: 'owner', joinedAt: new Date() }],
    });

    await logActivity({
      workspaceId: workspace._id,
      actorId: userId,
      action: 'workspace:created',
      details: { workspaceName: name },
    });

    const populated = await Workspace.findById(workspace._id)
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar');

    res.status(201).json({
      success: true,
      message: 'Workspace created successfully',
      workspace: {
        ...populated?.toObject(),
        boardCount: 0,
        currentUserRole: 'owner',
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getWorkspace = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const workspace = await Workspace.findById(req.params.id)
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar');

    if (!workspace) {
      res.status(404).json({ success: false, message: 'Workspace not found' });
      return;
    }

    const boards = await Board.find({ workspace: workspace._id })
      .populate('createdBy', 'name email avatar')
      .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      workspace: {
        ...workspace.toObject(),
        currentUserRole: req.workspaceRole,
        boards,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateWorkspace = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, description } = req.body;
    const workspace = await Workspace.findByIdAndUpdate(
      req.params.id,
      { $set: { ...(name && { name }), ...(description !== undefined && { description }) } },
      { new: true }
    )
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar');

    if (!workspace) {
      res.status(404).json({ success: false, message: 'Workspace not found' });
      return;
    }

    res.status(200).json({ success: true, message: 'Workspace updated', workspace });
  } catch (error) {
    next(error);
  }
};

export const deleteWorkspace = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const workspace = await Workspace.findById(req.params.id);
    if (!workspace) {
      res.status(404).json({ success: false, message: 'Workspace not found' });
      return;
    }

    if (workspace.owner.toString() !== req.user!.id) {
      res.status(403).json({ success: false, message: 'Only workspace owner can delete workspace' });
      return;
    }

    // Cascade delete boards, columns, tasks, comments, activities
    const boards = await Board.find({ workspace: workspace._id });
    const boardIds = boards.map((b) => b._id);

    await Task.deleteMany({ boardId: { $in: boardIds } });
    await Column.deleteMany({ boardId: { $in: boardIds } });
    await Comment.deleteMany({ boardId: { $in: boardIds } });
    await ActivityLog.deleteMany({ workspaceId: workspace._id });
    await Board.deleteMany({ workspace: workspace._id });
    await Workspace.findByIdAndDelete(workspace._id);

    res.status(200).json({ success: true, message: 'Workspace and associated assets deleted' });
  } catch (error) {
    next(error);
  }
};

export const addMember = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, role } = req.body;
    const workspace = await Workspace.findById(req.params.id);
    if (!workspace) {
      res.status(404).json({ success: false, message: 'Workspace not found' });
      return;
    }

    const targetUser = await User.findOne({ email: email.toLowerCase() });
    if (!targetUser) {
      res.status(404).json({
        success: false,
        message: `No user found with email ${email}. Ask them to sign up first.`,
      });
      return;
    }

    const alreadyMember = workspace.members.some(
      (m) => m.user.toString() === targetUser._id.toString()
    );
    if (alreadyMember) {
      res.status(409).json({ success: false, message: 'User is already a member of this workspace' });
      return;
    }

    workspace.members.push({
      user: targetUser._id,
      role: role || 'member',
      joinedAt: new Date(),
    });

    await workspace.save();

    await logActivity({
      workspaceId: workspace._id,
      actorId: req.user!.id,
      action: 'member:invited',
      details: { memberName: targetUser.name, memberEmail: targetUser.email, role },
    });

    const populated = await Workspace.findById(workspace._id)
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar');

    res.status(200).json({
      success: true,
      message: `${targetUser.name} added to workspace with ${role} role`,
      workspace: populated,
    });
  } catch (error) {
    next(error);
  }
};

export const updateMemberRole = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { role } = req.body;
    const targetUserId = req.params.userId;
    const workspace = await Workspace.findById(req.params.id);
    if (!workspace) {
      res.status(404).json({ success: false, message: 'Workspace not found' });
      return;
    }

    if (workspace.owner.toString() === targetUserId) {
      res.status(400).json({ success: false, message: 'Cannot change owner role' });
      return;
    }

    const member = workspace.members.find((m) => m.user.toString() === targetUserId);
    if (!member) {
      res.status(404).json({ success: false, message: 'Member not found in workspace' });
      return;
    }

    member.role = role;
    await workspace.save();

    res.status(200).json({ success: true, message: 'Member role updated successfully' });
  } catch (error) {
    next(error);
  }
};

export const removeMember = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const targetUserId = req.params.userId;
    const workspace = await Workspace.findById(req.params.id);
    if (!workspace) {
      res.status(404).json({ success: false, message: 'Workspace not found' });
      return;
    }

    if (workspace.owner.toString() === targetUserId) {
      res.status(400).json({ success: false, message: 'Owner cannot be removed from workspace' });
      return;
    }

    // Allow Admin/Owner to remove others, or user to leave themselves
    const isSelf = req.user!.id === targetUserId;
    if (!isSelf && req.workspaceRole !== 'owner' && req.workspaceRole !== 'admin') {
      res.status(403).json({ success: false, message: 'Insufficient permission to remove member' });
      return;
    }

    workspace.members = workspace.members.filter((m) => m.user.toString() !== targetUserId);
    await workspace.save();

    res.status(200).json({ success: true, message: 'Member removed from workspace' });
  } catch (error) {
    next(error);
  }
};
