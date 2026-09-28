import mongoose from 'mongoose';
import crypto from 'crypto';

const ConversationSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      unique: true,
      index: true,
      default: () => crypto.randomUUID(),
    },
    title: {
      type: String,
      required: true,
      trim: true,
      default: 'New Chat',
      maxlength: 120,
    },
    modelId: {
      type: String,
      default: 'gemini-3.8-flash',
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

export const Conversation = mongoose.model('Conversation', ConversationSchema);
export default Conversation;
