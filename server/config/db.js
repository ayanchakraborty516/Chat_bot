import mongoose from 'mongoose';

/**
 * Connect to MongoDB (supports both local MongoDB and MongoDB Atlas)
 */
export async function connectDB() {
  const isProduction = process.env.NODE_ENV === 'production';
  const mongoUri = process.env.MONGODB_URI || (isProduction ? '' : 'mongodb://127.0.0.1:27017/ayan-ai');

  if (!mongoUri) {
    console.error('[Database Error] MONGODB_URI is not defined! Set MONGODB_URI in Render environment variables.');
    return;
  }

  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    // Sanitize error to prevent accidental password exposure in logs
    const sanitizedMsg = (error.message || '').replace(/:([^:@]+)@/, ':***@');
    console.error(`[Database] MongoDB Connection Error: ${sanitizedMsg}`);
    // Do not terminate process so /api/health can report degraded status
  }
}

export default connectDB;
