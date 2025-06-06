// Todoist Task Sync - Handles task synchronization between Todoist and MongoDB

const { fetchTodoistTasks } = require('../todoist/todoist-task-fetcher');
const Task = require('./taskSchema');

// Sanitize priority to ensure it's a valid string enum value
const sanitizePriority = (priority) => {
    const validPriorities = ['1', '2', '3', '4'];
    const strPriority = String(priority || 4);
    return validPriorities.includes(strPriority) ? strPriority : '4';
};

const mapTodoistTaskToSchema = (todoistTask) => {
    const taskId = String(todoistTask.task_id || todoistTask.id);
    const dueDateObj = todoistTask.due?.datetime
        ? new Date(todoistTask.due.datetime)
        : todoistTask.due?.date
        ? new Date(todoistTask.due.date)
        : null;

    return {
        todoid: taskId,
        content: todoistTask.content,
        description: todoistTask.description || '',
        is_completed: todoistTask.is_completed || false,
        labels: (todoistTask.labels || []).sort(),
        priority: sanitizePriority(todoistTask.priority),
        due_date: dueDateObj,
        due_time: todoistTask.due?.datetime ? dueDateObj.toISOString() : '',
        url: todoistTask.url ?? `https://app.todoist.com/app/task/${taskId}`,
        project_id: todoistTask.project_id || '',
        created_at: todoistTask.created_at,
        completed_at: todoistTask.completed_at ? new Date(todoistTask.completed_at) : null,
        last_updated_by: 'todoist-sync',
        source: 'todoist',
    };
};

// Normalize date by removing microseconds
const normalizeDate = (dateString) => {
    if (!dateString) return '';
    try {
        return new Date(dateString).toISOString().split('.')[0] + 'Z';
    } catch (e) {
        return '';
    }
};

function normalizeValue(val) {
    if (val === undefined || val === null) return '';
    if (val instanceof Date || (typeof val === 'string' && !isNaN(Date.parse(val)))) {
        return normalizeDate(val);
    }
    if (Array.isArray(val)) return val.sort().join(',');
    return String(val).trim();
}

function isEqualTasks(mapped, existing) {
    const isDifferent = Object.keys(mapped).some((key) => {
        const a = normalizeValue(mapped[key]);
        const b = normalizeValue(existing[key]);
        const isEqual = a === b;

        if (!isEqual) {
            // For dates, show normalized values in the diff
            if (mapped[key] instanceof Date || existing[key] instanceof Date) {
                console.log(
                    `   ⛔ ${key}: mapped = "${normalizeDate(mapped[key])}", existing = "${normalizeDate(
                        existing[key]
                    )}"`
                );
            } else {
                console.log(`   ⛔ ${key}: mapped = "${a}", existing = "${b}"`);
            }
        }

        return !isEqual;
    });

    if (isDifferent) {
        console.log('❗ Differences detected for task:', mapped.content, `(ID: ${mapped.todoid})`);
    }

    return !isDifferent;
}

async function syncTodoistTasks() {
    try {
        console.log('🔄 Starting Todoist task sync...');
        const todoistTasks = await fetchTodoistTasks();
        console.log(`✅ Fetched ${todoistTasks.length} tasks from Todoist.`);

        const todoIds = todoistTasks.map((t) => String(t.task_id || t.id));
        const existingTasks = await Task.find({ todoid: { $in: todoIds } });
        const existingMap = Object.fromEntries(existingTasks.map((t) => [t.todoid, t]));

        let insertCount = 0,
            updateCount = 0,
            unchangedCount = 0;

        const operations = todoistTasks
            .map((todoistTask) => {
                const id = String(todoistTask.task_id || todoistTask.id);
                const mapped = mapTodoistTaskToSchema(todoistTask);
                const existing = existingMap[id];

                // If it exists and they're equal, skip
                if (existing && isEqualTasks(mapped, existing)) {
                    unchangedCount++;
                    console.log(`⏭️ Unchanged: ${mapped.content} (ID: ${mapped.todoid})`);
                    return null;
                }

                // Otherwise insert or update
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
