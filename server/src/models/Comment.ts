import mongoose, { Document, Schema, Model } from 'mongoose';

export interface ICommentDocument extends Document {
  _id: mongoose.Types.ObjectId;
  taskId: mongoose.Types.ObjectId;
  boardId: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema = new Schema<ICommentDocument>(
  {
    taskId: {
      type: Schema.Types.ObjectId,
      ref: 'Task',
      required: true,
      index: true,
    },
    boardId: {
      type: Schema.Types.ObjectId,
      ref: 'Board',
      required: true,
      index: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: [true, 'Comment content is required'],
      trim: true,
      maxlength: 1000,
    },
  },
  {
    timestamps: true,
  }
);

CommentSchema.index({ taskId: 1, createdAt: 1 });
CommentSchema.index({ boardId: 1, updatedAt: -1 });

export const Comment: Model<ICommentDocument> = mongoose.model<ICommentDocument>(
  'Comment',
  CommentSchema
);
