import express from 'express';
import mongoose from 'mongoose';
import { Conversation } from '../models/Conversation.js';
import { Message } from '../models/Message.js';
import { optionalAuth } from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(optionalAuth);

function getConversationQuery(id) {
  if (mongoose.isValidObjectId(id)) {
    return { $or: [{ id: id }, { _id: id }] };
  }
  return { id: id };
}

// GET /api/conversations - List conversations (scoped to authenticated user if present)
router.get('/', async (req, res) => {
  try {
    const filter = req.user?.id
      ? { $or: [{ userId: req.user.id }, { userId: null }, { userId: { $exists: false } }] }
      : {};
    const conversations = await Conversation.find(filter).sort({ updatedAt: -1 }).lean();
    const formatted = conversations.map((conv) => ({
      ...conv,
      id: conv.id || conv._id.toString(),
    }));
    res.json(formatted);
  } catch (error) {
    console.error('[API] Error fetching conversations:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// POST /api/conversations - Create a new conversation
router.post('/', async (req, res) => {
  try {
    const { title, modelId, id } = req.body;
    const conversationData = {
      title: (title || 'New Chat').trim(),
      modelId: modelId || 'gemini-3.8-flash',
    };
    if (id) {
      conversationData.id = id;
    }
    if (req.user?.id) {
      conversationData.userId = req.user.id;
    }

    const conversation = new Conversation(conversationData);
    await conversation.save();

    res.status(201).json(conversation);
  } catch (error) {
    console.error('[API] Error creating conversation:', error);
    res.status(500).json({ error: 'Failed to create conversation' });
  }
});

// GET /api/conversations/:id - Get a single conversation
router.get('/:id', async (req, res) => {
  try {
    const conversation = await Conversation.findOne(getConversationQuery(req.params.id));
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    if (conversation.userId && req.user?.id && conversation.userId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized to access this conversation' });
    }
    res.json(conversation);
  } catch (error) {
    console.error('[API] Error fetching conversation:', error);
    res.status(500).json({ error: 'Failed to fetch conversation' });
  }
});

// PATCH /api/conversations/:id - Rename/update conversation
router.patch('/:id', async (req, res) => {
  try {
    const query = getConversationQuery(req.params.id);
    const existing = await Conversation.findOne(query);
    if (!existing) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    if (existing.userId && req.user?.id && existing.userId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized to modify this conversation' });
    }

    const { title, modelId } = req.body;
    const updateData = {};
    if (typeof title === 'string') updateData.title = title.trim();
    if (typeof modelId === 'string') updateData.modelId = modelId;

    const conversation = await Conversation.findOneAndUpdate(
      query,
      { $set: updateData },
      { new: true }
    );

    res.json(conversation);
  } catch (error) {
    console.error('[API] Error updating conversation:', error);
    res.status(500).json({ error: 'Failed to update conversation' });
  }
});

// DELETE /api/conversations/:id - Delete a conversation and its messages
router.delete('/:id', async (req, res) => {
  try {
    const query = getConversationQuery(req.params.id);
    const conversation = await Conversation.findOne(query);

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    if (conversation.userId && req.user?.id && conversation.userId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized to delete this conversation' });
    }

    const targetId = conversation.id || conversation._id.toString();

    // Delete conversation
    await Conversation.deleteOne(query);

    // Delete associated messages (by targetId or _id)
    await Message.deleteMany({
      $or: [{ conversationId: targetId }, { conversationId: conversation._id.toString() }],
    });

    res.json({ success: true, message: 'Conversation deleted successfully' });
  } catch (error) {
    console.error('[API] Error deleting conversation:', error);
    res.status(500).json({ error: 'Failed to delete conversation' });
  }
});

export default router;
