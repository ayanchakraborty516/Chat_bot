import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB } from './config/db.js';
import conversationRoutes from './routes/conversationRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import authRoutes from './routes/authRoutes.js';
import searchRoutes from './routes/searchRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import { getCurrentDateInfo, buildDateSystemInstruction } from './utils/dateUtils.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables (supports root .env and server/.env)
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// Environment-based CORS configuration
const rawClientUrl = process.env.CLIENT_URL || '';
const allowedOrigins = rawClientUrl
  ? rawClientUrl.split(',').map((u) => u.trim().replace(/\/$/, ''))
  : ['http://localhost:5173', 'http://127.0.0.1:5173'];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests (health checkers, curl, Render pings) with no Origin header
    if (!origin) return callback(null, true);

    const cleanOrigin = origin.replace(/\/$/, '');

    // Allow configured origins or Vercel production/preview deployments
    if (
      rawClientUrl === '*' ||
      allowedOrigins.includes(cleanOrigin) ||
      cleanOrigin.endsWith('.vercel.app') ||
      (process.env.NODE_ENV !== 'production' && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(cleanOrigin))
    ) {
      return callback(null, true);
    }

    console.warn(`[CORS] Request rejected from untrusted origin: ${origin}`);
    callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));

// Middleware for parsing JSON with support for large image payloads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Connect to MongoDB
connectDB();

// Health Check Endpoint (used for Render deployment verification)
app.get('/api/health', (req, res) => {
  const isMongoConnected = mongoose.connection.readyState === 1;
  res.status(isMongoConnected ? 200 : 503).json({
    status: isMongoConnected ? 'ok' : 'degraded',
    service: 'Ayan AI',
    mongo: isMongoConnected ? 'connected' : 'disconnected',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
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
app.use('/api/chat', chatRoutes);

// Global Error Handler (sanitizes error details in production)
app.use((err, req, res, next) => {
  console.error('[Server Error]', err.message || err);
  if (res.headersSent) {
    return next(err);
  }
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message || 'Internal Server Error',
  });
});

// Start Server if run directly (compatible with Render dynamic PORT)
let server = null;
if (!process.env.NO_AUTO_LISTEN) {
  server = app.listen(PORT, () => {
    console.log(`[Ayan AI Backend] Server running on port ${PORT}`);
  });
}

export { app, server };
export default app;
