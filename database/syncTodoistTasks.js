const Task = require('./taskSchema');
const { fetchTodoistTasks } = require('../todoist-tasks/todoist-task-fetcher');

const mapTodoistTaskToSchema = (todoistTask, existingTask) => {
    const dueDate = todoistTask.due ? new Date(todoistTask.due.datetime || todoistTask.due.date) : null;
    const dueTime = todoistTask.due?.datetime ? new Date(todoistTask.due.datetime).toLocaleTimeString() : '';

    // Handle completed_at logic
    let completedAt = existingTask?.completed_at || null;
    if (todoistTask.is_completed) {
        if (!existingTask || !existingTask.is_completed) {
            completedAt = new Date(); // Just completed, set current time
        }
    } else {
        completedAt = null; // Still incomplete, ensure completed_at is null
    }

    return {
        todoid: todoistTask.id,
        content: todoistTask.content,
        description: todoistTask.description,
        is_completed: todoistTask.is_completed,
        labels: todoistTask.labels,
        priority: todoistTask.priority.toString(),
        due_date: dueDate,
        due_time: dueTime,
        url: todoistTask.url,
        project_id: todoistTask.project_id,
        created_at: new Date(todoistTask.created_at),
        completed_at: completedAt,
        last_updated_by: 'todoist-sync',
        source: 'todoist',
    };
};

const syncTodoistTasks = async () => {
    try {
        console.log('Starting Todoist task sync...');
        const todoistTasks = await fetchTodoistTasks();

        const syncResults = await Promise.all(
            todoistTasks.map(async (todoistTask) => {
                try {
                    const existingTask = await Task.findOne({ todoid: todoistTask.id });
                    const mappedTask = mapTodoistTaskToSchema(todoistTask, existingTask);

                    await Task.findOneAndUpdate({ todoid: mappedTask.todoid }, mappedTask, {
                        upsert: true,
                        new: true,
                        setDefaultsOnInsert: true,
                    });
                    return { id: todoistTask.id, status: 'success' };
                } catch (err) {
                    console.error(`Failed to sync task ${todoistTask.id}:`, err.message);
                    return { id: todoistTask.id, status: 'failed', error: err.message };
                }
            })
        );

        const failedTasks = syncResults.filter((result) => result.status === 'failed');
        if (failedTasks.length) {
            console.warn(`${failedTasks.length} tasks failed to sync.`);
        } else {
            console.log('All tasks synced successfully!');
        }

        return {
            total: todoistTasks.length,
            failed: failedTasks.length,
            success: todoistTasks.length - failedTasks.length,
        };
    } catch (error) {
        console.error('Error syncing Todoist tasks:', error);
        throw error;
    }
};

module.exports = syncTodoistTasks;
