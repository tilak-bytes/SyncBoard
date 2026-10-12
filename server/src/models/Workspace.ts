import mongoose, { Document, Schema, Model } from 'mongoose';
import { UserRole } from '../types';

export interface IWorkspaceMember {
  user: mongoose.Types.ObjectId;
  role: UserRole;
  joinedAt: Date;
}

export interface IWorkspaceDocument extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  owner: mongoose.Types.ObjectId;
  members: IWorkspaceMember[];
  createdAt: Date;
  updatedAt: Date;
}

const WorkspaceMemberSchema = new Schema<IWorkspaceMember>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    role: {
      type: String,
      enum: ['owner', 'admin', 'member', 'viewer'],
      default: 'member',
      required: true,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const WorkspaceSchema = new Schema<IWorkspaceDocument>(
  {
    name: {
      type: String,
      required: [true, 'Workspace name is required'],
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: 500,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    members: [WorkspaceMemberSchema],
  },
  {
    timestamps: true,
  }
);

WorkspaceSchema.index({ 'members.user': 1 });

export const Workspace: Model<IWorkspaceDocument> = mongoose.model<IWorkspaceDocument>(
  'Workspace',
  WorkspaceSchema
);
