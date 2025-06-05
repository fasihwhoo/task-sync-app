// Main server file for the Todoist-MongoDB Sync application
// This file sets up the Express server and defines the API endpoints
//
// Environment variables required:
// - PORT: The port number for the server (default: 3000)
// - MONGODB_URI: MongoDB connection string
// - TODOIST_API_TOKEN: Todoist API authentication token

require('dotenv').config();
const express = require('express');
const connectDB = require('./database/config');
const taskRoutes = require('./routes/taskRoutes');

// Initialize Express application
const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(express.json());

// Root endpoint
// Provides basic server status and navigation information
//
// @route GET /
// @returns {string} HTML response with server status and available endpoints
app.get('/', (req, res) => {
    res.send('Server is running! Go to /tasks to fetch tasks.');
});

// Mount task routes
app.use('/tasks', taskRoutes);

// Server initialization with error handling
// Includes graceful shutdown and port conflict resolution
const server = app
    .listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    })
    .on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.error(
                `Port ${PORT} is already in use. Please:\n` +
                    '1. Stop any other running instances of this server\n' +
                    '2. Choose a different port in your .env file\n' +
                    '3. Or wait a few seconds and try again'
            );
            process.exit(1);
        } else {
            console.error('Server error:', err.message);
            process.exit(1);
        }
    });

// Graceful Shutdown Handler
// Ensures clean server shutdown on SIGTERM signal
// Important for container environments and process managers
process.on('SIGTERM', () => {
    console.log('Received SIGTERM. Performing graceful shutdown...');
    server.close(() => {
        console.log('Server closed. Exiting process.');
        process.exit(0);
    });
});
