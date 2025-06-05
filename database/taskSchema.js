// Task Schema Definition
// Defines the MongoDB schema for Todoist tasks
//
// This schema maps Todoist task properties to MongoDB document fields
// and includes additional fields for sync tracking and task management

const mongoose = require('mongoose');

// Task Schema
// @typedef {Object} Task
// @property {string} todoid - Todoist task ID (used as primary key)
// @property {string} content - Task description/title
// @property {string} description - Task description
// @property {boolean} is_completed - Whether the task is completed
// @property {string[]} labels - Array of label IDs associated with the task
// @property {string} priority - Task priority (1-4, 4 being highest)
// @property {Date} due_date - Due date in YYYY-MM-DD format
// @property {string} due_time - Due time in HH:MM format
// @property {string} url - Todoist URL for the task
// @property {string} project_id - ID of the project containing this task
// @property {Date} created_at - Task creation timestamp
// @property {Date} completed_at - Timestamp when task was completed
// @property {string} last_updated_by - ID of user who last updated the task
// @property {string} source - Source of the task (e.g., 'todoist', 'notion')

const taskSchema = new mongoose.Schema({
    todoid: {
        type: String,
        unique: true,
        sparse: true,
        index: true,
    },
    content: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        default: '',
    },
    is_completed: {
        type: Boolean,
        default: false,
    },
    labels: {
        type: [String],
        default: [],
    },
    priority: {
        type: String,
        enum: ['1', '2', '3', '4', null],
        default: null,
    },
    due_date: {
        type: Date,
        default: null,
    },
    due_time: {
        type: String,
        default: '',
    },
    url: {
        type: String,
        default: '',
    },
    project_id: {
        type: String,
        default: '',
    },
    created_at: {
        type: Date,
        default: Date.now,
    },
    completed_at: {
        type: Date,
        default: null,
    },
    last_updated_by: {
        type: String,
        default: '',
    },
    source: {
        type: String,
        enum: ['todoist', 'notion'],
        required: true,
    },
});

// Pre-save middleware
// Ensures created_at is set to current time if not provided

taskSchema.pre('save', function (next) {
    if (!this.created_at) {
        this.created_at = new Date();
    }
    next();
});

// Create and export the Task model
const Task = mongoose.model('Task', taskSchema);
module.exports = Task;
