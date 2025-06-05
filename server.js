require('dotenv').config();
const express = require('express');
const connectDB = require('./database/config');
const syncTodoistTasks = require('./database/syncTodoistTasks');
const Task = require('./database/taskSchema');
// const { fetchTodoistTasks } = require('./todoist-tasks/todoist-task-fetcher');

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(express.json());

// Basic route
app.get('/', (req, res) => {
    res.send(
        'Server is running! Go to /tasks to fetch tasks.' + ` visit http://localhost:${PORT}/tasks to fetch tasks.`
    );
});

// Todoist tasks routes
app.get('/tasks/sync', async (req, res) => {
    try {
        const syncedCount = await syncTodoistTasks();
        res.json({ message: `Successfully synced ${syncedCount} tasks from Todoist` });
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({ error: 'Failed to sync Todoist tasks' });
    }
});

// Get all tasks from database
app.get('/tasks', async (req, res) => {
    try {
        // const tasks = await fetchTodoistTasks();
        // console.log('Fetched Todoist Tasks:', JSON.stringify(tasks, null, 2));
        const tasksFromDb = await Task.find({});
        res.json(tasksFromDb);
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({ error: 'Failed to fetch tasks' });
    }
});

// Start server with error handling
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

// Handle graceful shutdown
process.on('SIGTERM', () => {
    console.log('Received SIGTERM. Performing graceful shutdown...');
    server.close(() => {
        console.log('Server closed. Exiting process.');
        process.exit(0);
    });
});
