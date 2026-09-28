import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { User } from '../models/User.js';

const router = express.Router();
const isProduction = process.env.NODE_ENV === 'production';
const JWT_SECRET = process.env.JWT_SECRET || (isProduction ? '' : 'ayan-ai-jwt-dev-secret-local-only');
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

function verifySecretConfig(res) {
  if (!JWT_SECRET) {
    console.error('[Auth Error] JWT_SECRET is missing! Please configure JWT_SECRET in Render environment variables.');
    res.status(500).json({ error: 'Authentication service configuration error' });
    return false;
  }
  return true;
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  if (!verifySecretConfig(res)) return;

  try {
    const { name, email, password } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ error: 'Email is required' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = new User({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
    });
    await user.save();

    const userId = user.id || user._id.toString();

    // Sign JWT token
    const token = jwt.sign(
      { id: userId, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(201).json({
      token,
      user: {
        id: userId,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('[Auth API] Register error:', error);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  if (!verifySecretConfig(res)) return;

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Find user
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const userId = user.id || user._id.toString();

    // Sign JWT token
    const token = jwt.sign(
      { id: userId, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      token,
      user: {
        id: userId,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('[Auth API] Login error:', error);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

// GET /api/auth/me
router.get('/me', async (req, res) => {
  if (!verifySecretConfig(res)) return;

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No authentication token provided' });
    }

    const token = authHeader.split(' ')[1];
    let decoded;

    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }

    const query = mongoose.isValidObjectId(decoded.id)
      ? { $or: [{ id: decoded.id }, { _id: decoded.id }] }
      : { id: decoded.id };

    const user = await User.findOne(query).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User account not found' });
    }

    res.json({
      user: {
        id: user.id || user._id.toString(),
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('[Auth API] Me verification error:', error);
    res.status(500).json({ error: 'Authentication verification failed' });
  }
});

export default router;
