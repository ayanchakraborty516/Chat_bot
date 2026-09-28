import express from 'express';
import mongoose from 'mongoose';
import { Message } from '../models/Message.js';
import { Conversation } from '../models/Conversation.js';
import { optionalAuth } from '../middleware/authMiddleware.js';

const router = express.Router({ mergeParams: true });
router.use(optionalAuth);

function getConversationQuery(id) {
  if (mongoose.isValidObjectId(id)) {
    return { $or: [{ id: id }, { _id: id }] };
  }
  return { id: id };
}

// GET /api/conversations/:id/messages - Get all messages for a conversation
router.get('/', async (req, res) => {
  try {
    const { id } = req.params;
    const conversation = await Conversation.findOne(getConversationQuery(id));

    if (conversation && conversation.userId && req.user?.id && conversation.userId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized to view messages for this conversation' });
    }

    const conversationIds = [id];
    if (conversation) {
      if (conversation.id) conversationIds.push(conversation.id);
      if (conversation._id) conversationIds.push(conversation._id.toString());
    }

    const messages = await Message.find({
      conversationId: { $in: conversationIds },
    })
      .sort({ timestamp: 1, createdAt: 1 })
      .lean();

    const formatted = messages.map((m) => ({
      ...m,
      id: m.id || m._id.toString(),
    }));

    res.json(formatted);
  } catch (error) {
    console.error('[API] Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// POST /api/conversations/:id/messages - Save a message to a conversation
router.post('/', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      id: clientMessageId,
      role,
      content,
      modelId,
      attachments = [],
      sources = [],
      status = 'success',
      feedback = null,
      timestamp,
    } = req.body;

    if (!role || !['user', 'assistant', 'system'].includes(role)) {
      return res.status(400).json({ error: 'Valid role (user, assistant, system) is required' });
    }

    // Find conversation to ensure it exists and get canonical ID
    const conversation = await Conversation.findOne(getConversationQuery(id));
    if (conversation && conversation.userId && req.user?.id && conversation.userId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized to add messages to this conversation' });
    }
    const targetConvId = conversation ? (conversation.id || conversation._id.toString()) : id;

    const messageData = {
      conversationId: targetConvId,
      role,
      content: content || '',
      modelId: modelId || null,
      attachments: attachments || [],
      sources: sources || [],
      status,
      feedback,
      timestamp: timestamp ? new Date(timestamp) : new Date(),
    };

    if (clientMessageId) {
      messageData.id = clientMessageId;
    }

    // Check if message with this id already exists to prevent duplicate messages
    if (clientMessageId) {
      const existing = await Message.findOne({ id: clientMessageId });
      if (existing) {
        existing.content = content || existing.content;
        existing.status = status || existing.status;
        existing.modelId = modelId || existing.modelId;
        existing.feedback = feedback !== undefined ? feedback : existing.feedback;
        if (Array.isArray(sources) && sources.length > 0) {
          existing.sources = sources;
        }
        await existing.save();
        return res.json(existing);
      }
    }

    const message = new Message(messageData);
    await message.save();

    // Update conversation updatedAt timestamp
    if (conversation) {
      conversation.updatedAt = new Date();
      await conversation.save();
    }

    res.status(201).json(message);
  } catch (error) {
    console.error('[API] Error saving message:', error);
    res.status(500).json({ error: 'Failed to save message' });
  }
});

export default router;
