import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IBoardDocument extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  workspace: mongoose.Types.ObjectId;
  background: string;
  isStarred: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const BoardSchema = new Schema<IBoardDocument>(
  {
    title: {
      type: String,
      required: [true, 'Board title is required'],
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: 500,
    },
    workspace: {
      type: Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true,
    },
    background: {
      type: String,
      default: 'gradient-sunset', // default modern theme preset
    },
    isStarred: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

BoardSchema.index({ workspace: 1, createdAt: -1 });

export const Board: Model<IBoardDocument> = mongoose.model<IBoardDocument>('Board', BoardSchema);
