const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
    {
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
    },
    {
        timestamps: true, // Adds createdAt and updatedAt fields automatically
    }
);

// Create the model
const Task = mongoose.model('Task', taskSchema);

module.exports = Task;
