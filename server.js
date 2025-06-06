// Main server file for Todoist-MongoDB sync app
// Required env vars: PORT, MONGODB_URI, TODOIST_API_TOKEN

require('dotenv').config();
const express = require('express');
const connectDB = require('./database/config');
const taskRoutes = require('./routes/taskRoutes');

// Initialize Express app
const app = express();
app.use(express.json());
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
connectDB();

// Root endpoint - Shows server status
app.get('/', (req, res) => {
    res.send('Server is running! Go to /tasks to fetch tasks.');
});

// Mount task routes
app.use('/tasks', taskRoutes);

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
