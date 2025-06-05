// Todoist Task Synchronization Module
// Handles the synchronization of tasks between Todoist API and MongoDB
//
// This module:
// 1. Fetches tasks from Todoist API
// 2. Updates or creates tasks in MongoDB
// 3. Tracks sync statistics and handles errors
// 4. Maintains task completion status

const { fetchTodoistTasks } = require('../todoist-tasks/todoist-task-fetcher');
const Task = require('./taskSchema');

// Maps a Todoist task to our MongoDB schema format
// Handles different task formats (active vs completed)
//
// @param {Object} todoistTask - Task data from Todoist API
// @returns {Object} Mapped task data matching our schema
const mapTodoistTaskToSchema = (todoistTask) => {
    // Handle different task formats (active vs completed)
    const isCompletedFormat = !todoistTask.due && todoistTask.task_id;

    // Map task ID correctly based on format
    const taskId = isCompletedFormat ? todoistTask.task_id : todoistTask.id;

    // Handle due date and time
    const dueDate = todoistTask.due ? new Date(todoistTask.due.datetime || todoistTask.due.date) : null;
    const dueTime = todoistTask.due?.datetime ? new Date(todoistTask.due.datetime).toLocaleTimeString() : '';

    // Handle completed_at logic
    let completedAt = null;
    if (todoistTask.is_completed) {
        // For tasks from the completed endpoint, use the task's completion date
        completedAt = isCompletedFormat ? new Date() : new Date(todoistTask.completed_at || Date.now());
    }

    return {
        todoid: taskId,
        content: todoistTask.content,
        description: todoistTask.description || '',
        is_completed: todoistTask.is_completed || false,
        labels: todoistTask.labels || [],
        priority: todoistTask.priority?.toString() || '4',
        due_date: dueDate,
        due_time: dueTime,
        url: todoistTask.url ?? (taskId ? `https://app.todoist.com/app/task/${taskId}` : null),
        project_id: todoistTask.project_id || '',
        created_at: todoistTask.created_at ? new Date(todoistTask.created_at) : new Date(),
        completed_at: completedAt,
        last_updated_by: 'todoist-sync',
        source: 'todoist',
    };
};

// Synchronizes tasks between Todoist and MongoDB
// Handles both active and completed tasks
//
// @async
// @function syncTodoistTasks
// @returns {Promise<Object>} Sync statistics including success/failure counts
// @throws {Error} If sync operation fails critically
async function syncTodoistTasks() {
    try {
        console.log('Starting Todoist task sync...');

        // Fetch all tasks from Todoist API
        const todoistTasks = await fetchTodoistTasks();
        console.log(`Fetched ${todoistTasks.length} tasks from Todoist`);

        // Track sync results
        const syncResults = await Promise.all(
            todoistTasks.map(async (todoistTask) => {
                try {
                    const taskId = todoistTask.task_id || todoistTask.id;
                    console.log(
                        `Processing task: ${todoistTask.content} (ID: ${taskId}) [${
                            todoistTask.is_completed ? 'Completed' : 'Active'
                        }]`
                    );

                    const mappedTask = mapTodoistTaskToSchema(todoistTask);

                    const result = await Task.findOneAndUpdate({ todoid: mappedTask.todoid }, mappedTask, {
                        upsert: true,
                        new: true,
                        setDefaultsOnInsert: true,
                    });

                    console.log(`Successfully saved task: ${result.content} (ID: ${result.todoid})`);
                    return { id: taskId, status: 'success' };
                } catch (err) {
                    console.error(`Failed to sync task ${todoistTask.id || todoistTask.task_id}:`, err.message);
                    return { id: todoistTask.id || todoistTask.task_id, status: 'failed', error: err.message };
                }
            })
        );

        // Calculate statistics
        const failedTasks = syncResults.filter((result) => result.status === 'failed');
        if (failedTasks.length) {
            console.warn(`${failedTasks.length} tasks failed to sync.`);
            console.warn('Failed tasks:', failedTasks);
        } else {
            console.log('All tasks synced successfully!');
        }

        // Get final database statistics
        const finalTaskCount = await Task.countDocuments();
        const completedCount = await Task.countDocuments({ is_completed: true });
        console.log(`Total tasks in database after sync: ${finalTaskCount} (${completedCount} completed)`);

        return {
            total: todoistTasks.length,
            failed: failedTasks.length,
            success: todoistTasks.length - failedTasks.length,
            dbCount: finalTaskCount,
            completedCount,
        };
    } catch (error) {
        console.error('Sync failed:', error.message);
        if (error.response) {
            console.error('API Response:', {
                status: error.response.status,
                data: error.response.data,
            });
        }
        throw error;
    }
}

module.exports = syncTodoistTasks;
