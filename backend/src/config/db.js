const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.error('❌  MONGO_URI is not set in your .env file.');
    console.error('    Open backend/.env and set: MONGO_URI=your_connection_string');
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(uri, {
      // Mongoose 7+ has these as defaults, kept for clarity
      serverSelectionTimeoutMS: 5000, // Fail fast if DB unreachable
    });
    console.log(`✅  MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌  MongoDB connection failed:', error.message);
    console.error('    Check your MONGO_URI in backend/.env');
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('MongoDB connection closed (app termination)');
  process.exit(0);
});

module.exports = connectDB;
