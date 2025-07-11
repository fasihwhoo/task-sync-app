// Task Schema - Defines MongoDB schema for Todoist tasks

const mongoose = require('mongoose');

// Task Schema fields
const taskSchema = new mongoose.Schema(
    {
        todoid: {
            type: String,
            required: true,
            unique: true,
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
            index: true,
        },
        labels: {
            type: [String],
            default: [],
        },
        priority: {
            type: Number,
            enum: [1, 2, 3, 4],
            default: 4,
            index: true,
        },
        due_date: {
            type: Date,
            default: null,
            index: true,
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
            index: true,
        },
        created_at: {
            type: Date,
            required: true,
            index: true,
        },
        updated_at: {
            type: Date,
            required: true,
            index: true,
        },
        completed_at: {
            type: Date,
            default: null,
            index: true,
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
    },
    {
        timestamps: false, // Disable mongoose automatic timestamps
    }
);

// Pre-save middleware - Set created_at if not provided
taskSchema.pre('save', function (next) {
    if (!this.created_at) {
        this.created_at = new Date();
    }
    this.updated_at = new Date();
    next();
});

// Create and export the Task model
const Task = mongoose.model('Task', taskSchema);
module.exports = Task;
