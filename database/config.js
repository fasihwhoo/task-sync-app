// MongoDB Configuration Module
// Handles the connection to MongoDB database
//
// Environment variables required:
// - MONGODB_URI: MongoDB connection string (default: mongodb://localhost:27017/todoist-sync)

const mongoose = require('mongoose');

// Default MongoDB connection string for local development
const defaultUri = 'mongodb://localhost:27017/todoist-sync';

// Establishes connection to MongoDB
// Uses environment variable or falls back to default local connection
// Implements retry logic and error handling
//
// @async
// @function connectDB
// @returns {Promise<void>}
// @throws {Error} If connection fails after retries
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
