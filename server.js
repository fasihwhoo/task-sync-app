require('dotenv').config();
const express = require('express');
const { fetchTodoistTasks } = require('./todoist-tasks/todoist-task-fetcher');
const app = express();

const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Basic route
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to the API' });
});

// Todoist tasks route
app.get('/tasks', async (req, res) => {
    try {
        const tasks = await fetchTodoistTasks();
        console.log('Fetched Todoist Tasks:', JSON.stringify(tasks, null, 2));
        res.json(tasks);
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({ error: 'Failed to fetch Todoist tasks' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
