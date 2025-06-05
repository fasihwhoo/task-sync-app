// Task Routes Module
// Contains all task-related route handlers
//
// This module provides endpoints for:
// - Fetching all tasks
// - Fetching active tasks
// - Fetching completed tasks
// - Syncing tasks with MongoDB
// - Fetching tasks from MongoDB

const express = require('express');
const router = express.Router();
const { fetchTodoistTasks, fetchActiveTasks, fetchCompletedTasks } = require('../todoist-tasks/todoist-task-fetcher');
const syncTodoistTasks = require('../database/syncTodoistTasks');
const Task = require('../database/taskSchema');

// Direct Task Fetch Endpoint
// Gets all tasks directly from Todoist API (both active and completed)
//
// @route GET /tasks
// @returns {Array} Array of task objects from Todoist
// @throws {500} If Todoist API request fails
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

// Active Tasks Fetch Endpoint
// Gets only active (uncompleted) tasks from Todoist API
//
// @route GET /tasks/active
// @returns {Array} Array of active task objects from Todoist
// @throws {500} If Todoist API request fails
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

// Completed Tasks Fetch Endpoint
// Gets only completed tasks from Todoist API
//
// @route GET /tasks/completed
// @returns {Array} Array of completed task objects from Todoist
// @throws {500} If Todoist API request fails
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

// Task Retrieval Endpoint
// Gets all tasks from the MongoDB database
//
// @route GET /tasks/db
// @returns {Array} Array of task objects from the database
// @throws {500} If database query fails
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
