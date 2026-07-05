import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000, // Timeout quickly if MongoDB is not running
    };

    if (!MONGODB_URI) {
      console.warn("MONGODB_URI is not defined. Falling back to Mock DB.");
      return null;
    }

    cached.promise = mongoose.connect(MONGODB_URI as string, opts).then((mongoose) => {
      console.log("MongoDB connected successfully");
      return mongoose;
    }).catch(err => {
      console.warn("MongoDB connection failed. Falling back to Mock DB.", err.message);
      cached.promise = null;
      return null;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    return null;
  }

  return cached.conn;
}

export default dbConnect;
