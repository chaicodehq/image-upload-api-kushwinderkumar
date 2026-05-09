import { createApp } from './app.js';
import { connectDB } from './db/connect.js';

/**
 * Application entry point.
 * Connects to MongoDB, then starts the HTTP server.
 */
async function start() {
  try {
    const port = process.env.PORT || 3000;
    const uri =
      process.env.MONGO_URI || 'mongodb://localhost:27017/image_upload_api';

    await connectDB(uri);

    const app = createApp();

    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();
