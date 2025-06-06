// Task Sync Checker - Compares Todoist tasks with MongoDB tasks to determine sync actions

const { fetchTodoistTasks } = require('../todoist/todoist-task-fetcher');
const Task = require('./taskSchema');

/**
 * Normalizes task data for comparison by removing irrelevant fields
 * and ensuring consistent data types
 */
function normalizeTaskForComparison(task) {
    const normalizedTask = {
        content: task.content || '',
        description: task.description || '',
        is_completed: Boolean(task.is_completed),
        labels: (task.labels || []).sort(),
        priority: Number(task.priority || 4),
        project_id: String(task.project_id || ''),
        due_date: task.due_date ? new Date(task.due_date).toISOString() : null,
        due_time: task.due_time || '',
    };

    // Remove null/undefined values for clean comparison
    Object.keys(normalizedTask).forEach((key) => {
        if (normalizedTask[key] === undefined || normalizedTask[key] === null) {
            delete normalizedTask[key];
        }
    });

    return normalizedTask;
}

/**
 * Deep compares two tasks to determine if they are different
 * Returns true if tasks are different, false if they are the same
 */
function areTasksDifferent(todoistTask, mongoTask) {
    if (!todoistTask || !mongoTask) return true;

    const normalized1 = normalizeTaskForComparison(todoistTask);
    const normalized2 = normalizeTaskForComparison(mongoTask);

    // Compare each field
    for (const key of Object.keys(normalized1)) {
        const val1 = normalized1[key];
        const val2 = normalized2[key];

        if (Array.isArray(val1) && Array.isArray(val2)) {
            // Compare arrays (e.g., labels)
            if (val1.length !== val2.length || val1.some((v, i) => v !== val2[i])) {
                return true;
            }
        } else if (val1 instanceof Date && val2 instanceof Date) {
            // Compare dates
            if (val1.getTime() !== val2.getTime()) {
                return true;
            }
        } else if (val1 !== val2) {
            // Compare other values
            return true;
        }
    }

    return false;
}

/**
 * Checks tasks from Todoist against MongoDB and determines required sync actions
 * Returns arrays of tasks to create, update, and delete
 */
async function checkSyncStatus() {
    try {
        // Fetch tasks from both sources
        const [todoistTasks, mongoTasks] = await Promise.all([fetchTodoistTasks(), Task.find({}).lean()]);

        // Create maps for faster lookup
        const todoistMap = new Map(todoistTasks.map((task) => [String(task.task_id || task.id), task]));
        const mongoMap = new Map(mongoTasks.map((task) => [task.todoid, task]));

        // Initialize result arrays
        const toCreate = [];
        const toUpdate = [];
        const toDelete = [];

        // Find tasks to create or update
        for (const [todoid, todoistTask] of todoistMap.entries()) {
            const mongoTask = mongoMap.get(todoid);

            if (!mongoTask) {
                // Task exists in Todoist but not in MongoDB -> Create
                toCreate.push(todoistTask);
            } else if (areTasksDifferent(todoistTask, mongoTask)) {
                // Task exists in both but is different -> Update
                toUpdate.push({
                    todoid,
                    todoistData: todoistTask,
                    mongoData: mongoTask,
                });
            }
        }

        // Find tasks to delete (in MongoDB but not in Todoist)
        for (const [todoid, mongoTask] of mongoMap.entries()) {
            if (!todoistMap.has(todoid)) {
                toDelete.push(mongoTask);
            }
        }

        // Log summary
        console.log('\n📊 Sync Check Summary:');
        console.log(`📥 To Create: ${toCreate.length} tasks`);
        console.log(`✏️ To Update: ${toUpdate.length} tasks`);
        console.log(`🗑️ To Delete: ${toDelete.length} tasks`);

        return {
            toCreate,
            toUpdate,
            toDelete,
            summary: {
                createCount: toCreate.length,
                updateCount: toUpdate.length,
                deleteCount: toDelete.length,
                todoistCount: todoistTasks.length,
                mongoCount: mongoTasks.length,
            },
        };
    } catch (error) {
        console.error('❌ Sync check failed:', error);
        throw error;
    }
}

module.exports = {
    checkSyncStatus,
    normalizeTaskForComparison,
    areTasksDifferent,
};
