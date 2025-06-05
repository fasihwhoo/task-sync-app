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
const syncTodoistTasks = require('./database/syncTodoistTasks');
const Task = require('./database/taskSchema');
// const { fetchTodoistTasks } = require('./todoist-tasks/todoist-task-fetcher');

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
    res.send(
        'Server is running! Go to /tasks to fetch tasks.' + ` visit http://localhost:${PORT}/tasks to fetch tasks.`
    );
});

// Task Synchronization Endpoint
// Triggers a sync operation between Todoist and MongoDB
//
// @route GET /tasks/sync
// @returns {Object} JSON object containing sync results
// @returns {string} message - Success or failure message
// @returns {Object} stats - Synchronization statistics
//   @returns {number} stats.total - Total number of tasks processed
//   @returns {number} stats.failed - Number of failed task syncs
//   @returns {number} stats.success - Number of successful task syncs
//   @returns {number} stats.dbCount - Total tasks in database
//   @returns {number} stats.completedCount - Number of completed tasks
app.get('/tasks/sync', async (req, res) => {
    try {
        console.log('Starting task sync...');
        const syncedCount = await syncTodoistTasks();
        console.log('Sync completed:', syncedCount);
        res.json({
            message: `Successfully synced tasks from Todoist`,
            stats: syncedCount,
        });
    } catch (error) {
        console.error('Error in sync endpoint:', error);
        console.error('Error details:', {
            message: error.message,
            response: error.response?.data,
            stack: error.stack,
        });
        res.status(500).json({
            error: 'Failed to sync Todoist tasks',
            details: error.message,
            apiError: error.response?.data,
        });
    }
});

// Task Retrieval Endpoint
// Gets all tasks from the MongoDB database
//
// @route GET /tasks
// @returns {Array} Array of task objects from the database
// @throws {500} If database query fails
app.get('/tasks', async (req, res) => {
    try {
        const tasksFromDb = await Task.find({});
        res.json(tasksFromDb);
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({ error: 'Failed to fetch tasks' });
    }
});

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
