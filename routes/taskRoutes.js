// Task Routes - Handles all task-related endpoints

const express = require('express');
const router = express.Router();
const Task = require('../database/taskSchema');
const syncTasks = require('../database/syncTasks');
const { checkSyncStatus } = require('../database/syncChecker');

// GET /tasks - Show API status
router.get('/', async (req, res) => {
    res.json({
        status: 'success',
        message: 'Task sync API is running',
        endpoints: {
            'GET /tasks/db': 'Get all tasks from database',
            'GET /tasks/active': 'Get active tasks',
            'GET /tasks/completed': 'Get completed tasks',
            'GET /tasks/sync/check': 'Check what needs to be synced from Todoist to MongoDB',
            'POST /tasks/sync': 'Import/sync tasks from Todoist to MongoDB (one-way sync)',
        },
    });
});

// GET /tasks/db - Get all tasks from MongoDB
router.get('/db', async (req, res) => {
    try {
        const tasks = await Task.find({});
        res.json(tasks);
    } catch (error) {
        console.error('Error fetching tasks:', error);
        res.status(500).json({ error: 'Error fetching tasks' });
    }
});

// GET /tasks/sync/check - Check what needs to be synced
router.get('/sync/check', async (req, res) => {
    try {
        const syncStatus = await checkSyncStatus();
        res.json({
            status: 'success',
            ...syncStatus,
        });
    } catch (error) {
        console.error('Error checking sync status:', error);
        res.status(500).json({
            status: 'error',
            error: 'Error checking sync status',
            details: error.message,
        });
    }
});

// POST /tasks/sync - Import tasks from Todoist to MongoDB (one-way sync)
router.post('/sync', async (req, res) => {
    try {
        // Proceed with sync
        console.log('\n🔄 Proceeding with sync...');
        const result = await syncTasks();
        res.json({
            status: 'success',
            message: 'Successfully imported tasks from Todoist to MongoDB',
            ...result,
        });
    } catch (error) {
        console.error('Error importing tasks from Todoist:', error);
        res.status(500).json({
            status: 'error',
            error: 'Error importing tasks from Todoist',
            details: error.message,
        });
    }
});

// GET /tasks/completed - Get completed tasks
router.get('/completed', async (req, res) => {
    try {
        const tasks = await Task.find({ is_completed: true });
        res.json(tasks);
    } catch (error) {
        console.error('Error fetching completed tasks:', error);
        res.status(500).json({ error: 'Error fetching completed tasks' });
    }
});

// GET /tasks/active - Get active (not completed) tasks
router.get('/active', async (req, res) => {
    try {
        const tasks = await Task.find({ is_completed: false });
        res.json(tasks);
    } catch (error) {
        console.error('Error fetching active tasks:', error);
        res.status(500).json({ error: 'Error fetching active tasks' });
    }
});

module.exports = router;
