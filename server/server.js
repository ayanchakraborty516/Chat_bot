import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB } from './config/db.js';
import conversationRoutes from './routes/conversationRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import authRoutes from './routes/authRoutes.js';
import searchRoutes from './routes/searchRoutes.js';
import { getCurrentDateInfo, buildDateSystemInstruction } from './utils/dateUtils.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
app.use(cors());

// Middleware for parsing JSON with support for large image payloads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Connect to MongoDB
connectDB();

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  const isMongoConnected = mongoose.connection.readyState === 1;
  res.status(isMongoConnected ? 200 : 503).json({
    status: isMongoConnected ? 'ok' : 'degraded',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    mongo: isMongoConnected ? 'connected' : 'disconnected',
  });
});

// Dynamic Current Date & Temporal Context Endpoint
app.get(['/api/date', '/api/context/date'], (req, res) => {
  try {
    const dateInfo = getCurrentDateInfo();
    const systemInstruction = buildDateSystemInstruction();
    res.json({
      ...dateInfo,
      systemInstruction,
    });
  } catch (error) {
    console.error('[API] Error retrieving date context:', error);
    res.status(500).json({ error: 'Failed to retrieve date context' });
  }
});

// REST Routes
app.use('/api/auth', authRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/conversations/:id/messages', messageRoutes);
app.use('/api/search', searchRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Server Error]', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Start Server if run directly
let server = null;
if (!process.env.NO_AUTO_LISTEN) {
  server = app.listen(PORT, () => {
    console.log(`[Ayan AI Backend] Server running on http://localhost:${PORT}`);
  });
}

export { app, server };
export default app;
