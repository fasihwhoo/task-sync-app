// Task Routes Module - Handles all task-related endpoints

const express = require('express');
const router = express.Router();
const { fetchTodoistTasks, fetchActiveTasks, fetchCompletedTasks } = require('../todoist/todoist-task-fetcher');
const syncTodoistTasks = require('../database/syncTodoistTasks');
const Task = require('../database/taskSchema');

// GET /tasks - Get all tasks from Todoist
router.get('/', async (req, res) => {
    try {
        console.log('Starting Fetching All tasks from Todoist...');
        const tasks = await fetchTodoistTasks();
        res.json(tasks);
    } catch (error) {
        console.error('Error fetching tasks:', error);
        res.status(500).json({
            error: 'Failed to fetch tasks from Todoist',
            details: error.message,
            apiError: error.response?.data,
        });
    }
});

// GET /tasks/active - Get only active tasks from Todoist
router.get('/active', async (req, res) => {
    try {
        console.log('Starting to fetch active tasks from Todoist...');
        const activeTasks = await fetchActiveTasks();
        console.log(`Successfully fetched ${activeTasks.length} active tasks`);
        res.json(activeTasks);
    } catch (error) {
        console.error('Error fetching active tasks:', error);
        res.status(500).json({
            error: 'Failed to fetch active tasks from Todoist',
            details: error.message,
            apiError: error.response?.data,
        });
    }
});

// GET /tasks/completed - Get only completed tasks from Todoist
router.get('/completed', async (req, res) => {
    try {
        console.log('Starting to fetch completed tasks from Todoist...');
        const completedTasks = await fetchCompletedTasks();
        console.log(`Successfully fetched ${completedTasks.length} completed tasks`);
        res.json(completedTasks);
    } catch (error) {
        console.error('Error fetching completed tasks:', error);
        res.status(500).json({
            error: 'Failed to fetch completed tasks from Todoist',
            details: error.message,
            apiError: error.response?.data,
        });
    }
});

// GET /tasks/sync - Sync tasks between Todoist and MongoDB
router.get('/sync', async (req, res) => {
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

// GET /tasks/db - Get all tasks from MongoDB
router.get('/db', async (req, res) => {
    try {
        console.log('Fetching tasks from MongoDB...');
        const tasksFromDb = await Task.find({});
        res.json(tasksFromDb);
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({ error: 'Failed to fetch tasks' });
    }
});

module.exports = router;
