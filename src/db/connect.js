import mongoose from 'mongoose';

/**
 * Connects to MongoDB using the provided URI.
 *
 * @param {string} uri - MongoDB connection string
 * @returns {Promise<mongoose.Connection>} Active mongoose connection
 * @throws {Error} If URI is missing or connection fails
 */
export async function connectDB(uri) {
  if (!uri) {
    throw new Error('MongoDB URI is required');
  }

  await mongoose.connect(uri);

  return mongoose.connection;
}
