const Task = require('./taskSchema');
const { fetchTodoistTasks } = require('../todoist-tasks/todoist-task-fetcher');

const mapTodoistTaskToSchema = (todoistTask, existingTask) => {
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
        // For tasks from the completed endpoint, use the task's ID as a timestamp
        // This is because the completed tasks from sync API don't have completion dates
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
        url: todoistTask.url || '',
        project_id: todoistTask.project_id || '',
        created_at: todoistTask.created_at ? new Date(todoistTask.created_at) : new Date(),
        completed_at: completedAt,
        last_updated_by: 'todoist-sync',
        source: 'todoist',
    };
};

const syncTodoistTasks = async () => {
    try {
        console.log('Starting Todoist task sync...');
        const todoistTasks = await fetchTodoistTasks();
        console.log(`Fetched ${todoistTasks.length} total tasks from Todoist`);

        const syncResults = await Promise.all(
            todoistTasks.map(async (todoistTask) => {
                try {
                    const taskId = todoistTask.task_id || todoistTask.id;
                    console.log(
                        `Processing task: ${todoistTask.content} (ID: ${taskId}) [${
                            todoistTask.is_completed ? 'Completed' : 'Active'
                        }]`
                    );
                    const existingTask = await Task.findOne({ todoid: taskId });
                    console.log(`Task ${taskId} exists in DB: ${!!existingTask}`);

                    const mappedTask = mapTodoistTaskToSchema(todoistTask, existingTask);

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

        const failedTasks = syncResults.filter((result) => result.status === 'failed');
        if (failedTasks.length) {
            console.warn(`${failedTasks.length} tasks failed to sync.`);
            console.warn('Failed tasks:', failedTasks);
        } else {
            console.log('All tasks synced successfully!');
        }

        // Log final DB state
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
        console.error('Error syncing Todoist tasks:', error);
        throw error;
    }
};

module.exports = syncTodoistTasks;
