import mongoose from 'mongoose';
import crypto from 'crypto';

const AttachmentSchema = new mongoose.Schema(
  {
    fileName: { type: String },
    mimeType: { type: String },
    base64Data: { type: String },
    textContent: { type: String },
    fileSize: { type: Number },
  },
  { _id: false }
);

const SourceSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    url: { type: String, required: true },
    snippet: { type: String, default: '' },
    source: { type: String, default: '' },
    publishedAt: { type: String, default: null },
  },
  { _id: false }
);

const MessageSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      unique: true,
      index: true,
      default: () => crypto.randomUUID(),
    },
    conversationId: {
      type: String,
      required: true,
      index: true,
    },
    role: {
      type: String,
      required: true,
      enum: ['user', 'assistant', 'system'],
    },
    content: {
      type: String,
      default: '',
    },
    modelId: {
      type: String,
      default: null,
    },
    attachments: {
      type: [AttachmentSchema],
      default: [],
    },
    sources: {
      type: [SourceSchema],
      default: [],
    },
    status: {
      type: String,
      default: 'success',
    },
    feedback: {
      type: String,
      default: null,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        ret.id = ret.id || ret._id.toString();
        return ret;
      },
    },
  }
);

export const Message = mongoose.model('Message', MessageSchema);
export default Message;
