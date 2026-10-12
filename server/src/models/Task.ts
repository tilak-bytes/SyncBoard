import mongoose, { Document, Schema, Model } from 'mongoose';
import { TaskPriority, IChecklistItem } from '../types';

export interface ITaskDocument extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  description: string;
  boardId: mongoose.Types.ObjectId;
  columnId: mongoose.Types.ObjectId;
  order: number;
  priority: TaskPriority;
  dueDate?: Date | null;
  labels: string[];
  assignees: mongoose.Types.ObjectId[];
  checklist: IChecklistItem[];
  version: number;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ChecklistItemSchema = new Schema<IChecklistItem>(
  {
    id: { type: String, required: true },
    text: { type: String, required: true, trim: true },
    completed: { type: Boolean, default: false },
  },
  { _id: false }
);

const TaskSchema = new Schema<ITaskDocument>(
  {
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    boardId: {
      type: Schema.Types.ObjectId,
      ref: 'Board',
      required: true,
      index: true,
    },
    columnId: {
      type: Schema.Types.ObjectId,
      ref: 'Column',
      required: true,
      index: true,
    },
    order: {
      type: Number,
      required: true,
      default: 0,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
      required: true,
    },
    dueDate: {
      type: Date,
      default: null,
    },
    labels: {
      type: [String],
      default: [],
    },
    assignees: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    checklist: {
      type: [ChecklistItemSchema],
      default: [],
    },
    version: {
      type: Number,
      required: true,
      default: 1,
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

// Compound indexes for optimal performance during drag-and-drop queries and delta recovery
TaskSchema.index({ boardId: 1, columnId: 1, order: 1 });
TaskSchema.index({ boardId: 1, updatedAt: -1 });
TaskSchema.index({ assignees: 1 });

export const Task: Model<ITaskDocument> = mongoose.model<ITaskDocument>('Task', TaskSchema);
