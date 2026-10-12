import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IActivityLogDocument extends Document {
  _id: mongoose.Types.ObjectId;
  workspaceId: mongoose.Types.ObjectId;
  boardId?: mongoose.Types.ObjectId;
  actor: mongoose.Types.ObjectId;
  action: string;
  details: Record<string, any>;
  createdAt: Date;
}

const ActivityLogSchema = new Schema<IActivityLogDocument>(
  {
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true,
    },
    boardId: {
      type: Schema.Types.ObjectId,
      ref: 'Board',
      index: true,
    },
    actor: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      required: true,
      index: true,
    },
    details: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

ActivityLogSchema.index({ boardId: 1, createdAt: -1 });
ActivityLogSchema.index({ workspaceId: 1, createdAt: -1 });

export const ActivityLog: Model<IActivityLogDocument> = mongoose.model<IActivityLogDocument>(
  'ActivityLog',
  ActivityLogSchema
);
