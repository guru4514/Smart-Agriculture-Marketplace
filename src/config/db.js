const mongoose = require('mongoose');

const connectDB = async () => {
  const useInMemory = process.env.USE_INMEMORY_DB === 'true';
  let uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/agroconnect';

  if (useInMemory) {
    // lazy require to keep dependency optional
    const { MongoMemoryServer } = require('mongodb-memory-server');
    const mem = await MongoMemoryServer.create();
    uri = mem.getUri();
    console.log('Using in-memory MongoDB for demo');
  }

  const attempts = 3;
  for (let i = 1; i <= attempts; i++) {
    try {
      await mongoose.connect(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log('MongoDB connected');
      return;
    } catch (err) {
      console.error(`MongoDB connection attempt ${i} failed: ${err.message}`);
      if (i < attempts) {
        console.log('Retrying in 2s...');
        await new Promise(r => setTimeout(r, 2000));
      } else {
        console.error('All MongoDB connection attempts failed. Please ensure MongoDB is running or set MONGODB_URI in .env');
        process.exit(1);
      }
    }
  }
};

module.exports = connectDB;
