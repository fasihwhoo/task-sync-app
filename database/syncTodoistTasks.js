// Todoist Task Sync - Handles task synchronization between Todoist and MongoDB

const { fetchTodoistTasks } = require('../todoist/todoist-task-fetcher');
const Task = require('./taskSchema');

// Map Todoist task to MongoDB schema format
const mapTodoistTaskToSchema = (todoistTask) => {
    const isCompletedFormat = !todoistTask.due && todoistTask.task_id;
    const taskId = String(isCompletedFormat ? todoistTask.task_id : todoistTask.id);

    const dueDate = todoistTask.due ? new Date(todoistTask.due.datetime || todoistTask.due.date) : null;
    const dueTime = todoistTask.due?.datetime ? new Date(todoistTask.due.datetime).toLocaleTimeString() : '';

    let completedAt = null;
    if (todoistTask.is_completed) {
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
        url: todoistTask.url ?? `https://app.todoist.com/app/task/${taskId}`,
        project_id: todoistTask.project_id || '',
        created_at: todoistTask.created_at ? new Date(todoistTask.created_at) : new Date(),
        completed_at: completedAt,
        last_updated_by: 'todoist-sync',
        source: 'todoist',
    };
};

async function syncTodoistTasks() {
    try {
        console.log('🔄 Starting Todoist task sync...');

        const todoistTasks = await fetchTodoistTasks();
        console.log(`✅ Fetched ${todoistTasks.length} tasks from Todoist.`);

        const todoIds = todoistTasks.map((t) => String(t.task_id || t.id));
        const existingTasks = await Task.find({ todoid: { $in: todoIds } });
        const existingMap = Object.fromEntries(existingTasks.map((t) => [t.todoid, t]));

        let insertCount = 0;
        let updateCount = 0;
        let unchangedCount = 0;

        const operations = todoistTasks
            .map((todoistTask) => {
                const id = String(todoistTask.task_id || todoistTask.id);
                const mapped = mapTodoistTaskToSchema(todoistTask);
                const existing = existingMap[id];

                if (mapped.is_completed && existing) {
                    unchangedCount++;
                    console.log(`✅ Completed already exists: ${mapped.content} (ID: ${mapped.todoid})`);
                    return null;
                }

                const hasChanged = existing
                    ? Object.keys(mapped).some((key) => String(existing[key]) !== String(mapped[key]))
                    : true;

                if (!hasChanged) {
                    unchangedCount++;
                    console.log(`⏭️ Unchanged: ${mapped.content} (ID: ${mapped.todoid})`);
                    return null;
                }

                const updatedFields = { ...mapped, updated_at: new Date() };

                if (existing) {
                    updatedFields.created_at = existing.created_at;
                    updateCount++;
                    console.log(`✏️ Updating: ${mapped.content} (ID: ${mapped.todoid})`);
                } else {
                    insertCount++;
                    console.log(`📥 Inserting new: ${mapped.content} (ID: ${mapped.todoid})`);
                }

                return {
                    updateOne: {
                        filter: { todoid: mapped.todoid },
                        update: { $set: updatedFields },
                        upsert: true,
                    },
                };
            })
            .filter(Boolean);

        if (operations.length > 0) {
            await Task.bulkWrite(operations);
        }

        const total = todoistTasks.length;
        const finalCount = await Task.countDocuments();
        const completedCount = await Task.countDocuments({ is_completed: true });

        console.log('\n✅ Sync Summary:');
        console.log(`📦 Total fetched: ${total}`);
        console.log(`📥 Inserted: ${insertCount}`);
        console.log(`✏️ Updated: ${updateCount}`);
        console.log(`⏭️ Unchanged: ${unchangedCount}`);
        console.log(`🗃️ Total tasks in DB: ${finalCount} (${completedCount} completed)`);

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
