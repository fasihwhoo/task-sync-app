// Task Sync - Handles one-way task synchronization from Todoist to MongoDB

const Task = require('./taskSchema');
const { checkSyncStatus, normalizeTaskForComparison } = require('./syncChecker');

// Map Todoist task to MongoDB schema format
const mapTodoistTaskToSchema = (todoistTask) => {
    const taskId = String(todoistTask.task_id || todoistTask.id);
    const dueDateObj = todoistTask.due?.datetime
        ? new Date(todoistTask.due.datetime)
        : todoistTask.due?.date
        ? new Date(todoistTask.due.date)
        : null;

    const now = new Date();

    return {
        todoid: taskId,
        content: todoistTask.content,
        description: todoistTask.description || '',
        is_completed: todoistTask.is_completed || false,
        labels: (todoistTask.labels || []).sort(),
        priority: Number(todoistTask.priority || 4),
        due_date: dueDateObj,
        due_time: todoistTask.due?.datetime ? dueDateObj.toISOString() : '',
        url: todoistTask.url ?? `https://app.todoist.com/app/task/${taskId}`,
        project_id: todoistTask.project_id || '',
        created_at: todoistTask.created_at ? new Date(todoistTask.created_at) : now,
        updated_at: now,
        completed_at: todoistTask.completed_at ? new Date(todoistTask.completed_at) : null,
        last_updated_by: 'todoist-sync',
        source: 'todoist',
    };
};

/**
 * Import/sync tasks from Todoist to MongoDB (one-way sync)
 * This function only imports data FROM Todoist TO MongoDB
 * It does not modify any data in Todoist
 */
async function syncTasks() {
    try {
        console.log('\n═══════════════ 🔄 Task Sync Started ═══════════════');
        console.log('🔄 Starting Todoist to MongoDB import...');

        // Get sync status
        const { toCreate, toUpdate, toDelete, summary } = await checkSyncStatus();

        // Show detailed changes
        if (toCreate.length > 0) {
            console.log('\n📥 Tasks to be Created:');
            toCreate.forEach((task) => {
                console.log(`  • "${task.content}" (${task.id})`);
                if (task.due) {
                    console.log(`    Due: ${task.due.date || task.due.datetime || 'Not set'}`);
                }
            });
        }

        if (toUpdate.length > 0) {
            console.log('\n✏️ Tasks to be Updated:');
            toUpdate.forEach(({ todoid, todoistData, mongoData }) => {
                console.log(`  • "${todoistData.content}" (ID: ${todoid})`);
                // Compare and show what's changing
                const todoistNorm = normalizeTaskForComparison(todoistData);
                const mongoNorm = normalizeTaskForComparison(mongoData);

                Object.keys(todoistNorm).forEach((key) => {
                    if (JSON.stringify(todoistNorm[key]) !== JSON.stringify(mongoNorm[key])) {
                        console.log(`    - ${key}: ${mongoNorm[key]} → ${todoistNorm[key]}`);
                    }
                });
            });
        }

        if (toDelete.length > 0) {
            console.log('\n🗑️ Tasks to be Deleted:');
            toDelete.forEach((task) => {
                console.log(`  • "${task.content}" (${task.todoid})`);
            });
        }

        // Process tasks to create
        const createOperations = toCreate.map((task) => ({
            insertOne: {
                document: mapTodoistTaskToSchema(task),
            },
        }));

        // Process tasks to update
        const updateOperations = toUpdate.map(({ todoid, todoistData }) => ({
            updateOne: {
                filter: { todoid },
                update: {
                    $set: {
                        ...mapTodoistTaskToSchema(todoistData),
                        updated_at: new Date(),
                    },
                },
            },
        }));

        // Process tasks to delete (tasks that no longer exist in Todoist)
        const deleteOperations = toDelete.map((task) => ({
            deleteOne: {
                filter: { todoid: task.todoid },
            },
        }));

        // Combine all operations
        const operations = [...createOperations, ...updateOperations, ...deleteOperations];

        // Execute operations if any exist
        if (operations.length > 0) {
            await Task.bulkWrite(operations);
        }

        // Log results with borders
        console.log('\n═══════════════ ✅ Import Results ═══════════════');
        console.log(`📥 Created: ${summary.createCount} tasks`);
        console.log(`✏️ Updated: ${summary.updateCount} tasks`);
        console.log(`🗑️ Deleted: ${summary.deleteCount} tasks`);

        console.log('\n───────────── 📊 Final Statistics ─────────────');
        console.log(`📊 Total tasks in Todoist: ${summary.todoistCount}`);
        console.log(`📊 Total tasks in MongoDB: ${summary.mongoCount}`);

        // Get final counts
        const finalCount = await Task.countDocuments();
        const completedCount = await Task.countDocuments({ is_completed: true });
        console.log(`🗃️ Final task count: ${finalCount} (${completedCount} completed)`);
        console.log('═══════════════════════════════════════════════════\n');

        return {
            created: summary.createCount,
            updated: summary.updateCount,
            deleted: summary.deleteCount,
            todoistCount: summary.todoistCount,
            mongoCount: summary.mongoCount,
            finalCount,
            completedCount,
        };
    } catch (error) {
        console.error('❌ Import failed:', error.message);
        if (error.response) {
            console.error('API Response:', {
                status: error.response.status,
                data: error.response.data,
            });
        }
        throw error;
    }
}

module.exports = syncTasks;
