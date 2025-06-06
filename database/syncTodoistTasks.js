// Todoist Task Sync - Handles task synchronization between Todoist and MongoDB

const { fetchTodoistTasks } = require('../todoist/todoist-task-fetcher');
const Task = require('./taskSchema');
// const CompletedTask = require('./completedTaskSchema');

// Format date for logging
const formatDate = (date) => {
    if (!date) return 'Not set';
    return new Date(date).toISOString();
};

// Log detailed task information
const logTaskDetails = (task, status = '🔄 Processing') => {
    const details = [
        `\n📌 Task: ${task.content}`,
        `   ├── Status      : ${status}`,
        `   ├── Task ID     : ${task.task_id || task.id}`,
    ];

    if (task.is_completed) {
        details.push(
            `   ├── Was Due     : ${task.due?.date || 'Not set'}`,
            `   ├── Completed On: ${formatDate(task.completed_at)}`
        );
    } else {
        details.push(`   ├── Next Due    : ${task.due?.date || 'Not set'}`);
    }

    // Add recurring info if available
    if (task.due?.recurring) {
        details.push(
            `   ├── Recurring   : Yes (${task.due.string})`,
            task.parent_id ? `   └── Parent Task : ${task.parent_id}` : `   └── Original Task: Yes`
        );
    } else {
        details.push(`   └── Recurring   : No`);
    }

    console.log(details.join('\n'));
};

// Map Todoist task to MongoDB schema format
const mapTodoistTaskToSchema = (todoistTask) => {
    // Detect if this is a completed task from Sync API
    const isCompletedFormat = !todoistTask.due && todoistTask.task_id;
    const taskId = isCompletedFormat ? todoistTask.task_id : todoistTask.id;

    // Parse due date and time
    const dueDate = todoistTask.due ? new Date(todoistTask.due.datetime || todoistTask.due.date) : null;
    const dueTime = todoistTask.due?.datetime ? new Date(todoistTask.due.datetime).toLocaleTimeString() : '';

    // Handle completion timestamp
    let completedAt = null;
    if (todoistTask.is_completed) {
        completedAt = isCompletedFormat ? new Date() : new Date(todoistTask.completed_at || Date.now());
    }

    // Determine if task is recurring and get recurrence string
    const isRecurring = todoistTask.due?.recurring || false;
    const recurrenceString = todoistTask.due?.string || '';

    // For completed recurring tasks, try to get the original task ID
    const originalTaskId = isRecurring && todoistTask.is_completed ? todoistTask.parent_id || '' : '';

    // Map Todoist fields to our schema
    return {
        todoid: taskId,
        content: todoistTask.content,
        description: todoistTask.description || '',
        is_completed: todoistTask.is_completed || false,
        is_recurring: isRecurring,
        recurrence_string: recurrenceString,
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
        original_task_id: originalTaskId,
    };
};

// Sync tasks between Todoist and MongoDB
async function syncTodoistTasks() {
    try {
        console.log('🔄 Starting Todoist task sync...');

        // 1. Fetch all tasks from Todoist
        const todoistTasks = await fetchTodoistTasks();
        console.log(`✅ Fetched ${todoistTasks.length} tasks from Todoist.`);

        // 2. Get existing tasks from MongoDB for comparison
        const todoIds = todoistTasks.map((t) => String(t.task_id || t.id));
        const existingTasks = await Task.find({ todoid: { $in: todoIds } });
        // Create a map for quick lookup by todoid
        const existingMap = Object.fromEntries(existingTasks.map((t) => [t.todoid, t]));

        // 3. Track sync statistics
        let insertCount = 0;
        let updateCount = 0;
        let unchangedCount = 0;

        // 4. Prepare bulk operations
        const operations = todoistTasks
            .map((todoistTask) => {
                const id = String(todoistTask.task_id || todoistTask.id);
                const mapped = mapTodoistTaskToSchema(todoistTask);
                const existing = existingMap[id];

                // Skip already synced completed task
                if (mapped.is_completed && existing) {
                    unchangedCount++;
                    logTaskDetails(todoistTask, '✅ Completed (Skipped)');
                    return null;
                }

                // Compare all fields to see if anything changed
                const hasChanged = existing
                    ? Object.keys(mapped).some((key) => String(existing[key]) !== String(mapped[key]))
                    : true;

                // Skip if nothing changed
                if (!hasChanged) {
                    unchangedCount++;
                    logTaskDetails(todoistTask, '⏭️ Unchanged');
                    return null;
                }

                // Prepare update with timestamp
                const updatedFields = { ...mapped, updated_at: new Date() };

                // Preserve original creation date for existing tasks
                if (existing) {
                    updatedFields.created_at = existing.created_at;
                    updateCount++;
                    logTaskDetails(todoistTask, '✏️ Updated');
                } else {
                    insertCount++;
                    logTaskDetails(todoistTask, '📥 New');
                }

                // Return bulk operation
                return {
                    updateOne: {
                        filter: { todoid: mapped.todoid },
                        update: { $set: updatedFields },
                        upsert: true,
                    },
                };
            })
            .filter(Boolean);

        // 5. Execute bulk operations if any
        if (operations.length > 0) {
            await Task.bulkWrite(operations);
        }

        // 6. Get final statistics
        const total = todoistTasks.length;
        const finalCount = await Task.countDocuments();
        const completedCount = await Task.countDocuments({ is_completed: true });

        // 7. Log summary
        console.log('\n✅ Sync Summary:');
        console.log(`📦 Total fetched: ${total}`);
        console.log(`📥 Inserted: ${insertCount}`);
        console.log(`✏️ Updated: ${updateCount}`);
        console.log(`⏭️ Unchanged: ${unchangedCount}`);
        console.log(`🗃️ Total tasks in DB: ${finalCount} (${completedCount} completed)`);

        // 8. Return detailed statistics
        return {
            total,
            inserted: insertCount,
            updated: updateCount,
            unchanged: unchangedCount,
            dbCount: finalCount,
            completedCount,
        };
    } catch (error) {
        console.error('❌ Sync failed:', error.message);
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
