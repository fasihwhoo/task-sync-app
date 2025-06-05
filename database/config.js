// MongoDB Config - Handles database connection
// Requires env var: MONGODB_URI (default: mongodb://localhost:27017/todoist-sync)

const mongoose = require('mongoose');

// Default MongoDB connection string
const defaultUri = 'mongodb://localhost:27017/todoist-sync';

// Connect to MongoDB with error handling
const connectDB = async () => {
    try {
        const uri = process.env.MONGODB_URI || defaultUri;
        await mongoose.connect(uri || defaultUri);
        console.log('MongoDB Connected Successfully');
    } catch (error) {
        console.error('MongoDB connection error:', error.message);
        process.exit(1);
    }
};

module.exports = connectDB;
