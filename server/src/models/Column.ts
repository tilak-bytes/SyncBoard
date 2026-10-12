import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IColumnDocument extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  boardId: mongoose.Types.ObjectId;
  order: number;
  color?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ColumnSchema = new Schema<IColumnDocument>(
  {
    title: {
      type: String,
      required: [true, 'Column title is required'],
      trim: true,
      maxlength: 50,
    },
    boardId: {
      type: Schema.Types.ObjectId,
      ref: 'Board',
      required: true,
      index: true,
    },
    order: {
      type: Number,
      required: true,
      default: 0,
    },
    color: {
      type: String,
      default: '#6366f1',
    },
  },
  {
    timestamps: true,
  }
);

ColumnSchema.index({ boardId: 1, order: 1 });

export const Column: Model<IColumnDocument> = mongoose.model<IColumnDocument>('Column', ColumnSchema);
