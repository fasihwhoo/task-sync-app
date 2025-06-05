// Todoist Task Fetcher - Handles all Todoist API interactions
// Requires env var: TODOIST_API_TOKEN

require('dotenv').config();
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

// Load and validate Todoist API token
const TODOIST_API_TOKEN = process.env.TODOIST_API_TOKEN;

if (!TODOIST_API_TOKEN) {
    console.error('Error: TODOIST_API_TOKEN is not set in .env file');
    process.exit(1);
}

// Fetch active (uncompleted) tasks from Todoist
async function fetchActiveTasks() {
    try {
        const ActiveTasksResponse = await axios.get('https://api.todoist.com/rest/v2/tasks', {
            headers: {
                Authorization: `Bearer ${TODOIST_API_TOKEN}`,
            },
        });
        console.log('Successfully fetched Active tasks');
        const activeTasksItems = ActiveTasksResponse.data || [];
        console.log(`Found ${activeTasksItems.length} ACtive tasks`);
        return ActiveTasksResponse.data;
    } catch (error) {
        console.error('Error fetching active tasks:', error.response?.data || error.message);
        throw error;
    }
}

// Fetch completed tasks from last 30 days
async function fetchCompletedTasks() {
    try {
        // Get completed tasks from the last 30 days
        const now = new Date();
        const since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
        const sinceStr = since.toISOString().slice(0, 10); // Format: YYYY-MM-DD

        // First get all completed task IDs
        const completedTasksResponse = await axios.get('https://api.todoist.com/sync/v9/completed/get_all', {
            headers: {
                Authorization: `Bearer ${TODOIST_API_TOKEN}`,
            },
            params: {
                since: sinceStr,
                limit: 200, // Maximum allowed by API
            },
        });
        console.log('Successfully fetched Completed tasks since:', sinceStr);

        const completedTasksItems = completedTasksResponse.data.items || [];
        console.log(`Found ${completedTasksItems.length} completed tasks`);

        // Then get full task details for each completed task
        const completedTasksWithDetails = completedTasksItems.map((item) => ({
            ...item,
            is_completed: true,
            completed_at: item.completed_date,
        }));

        console.log(`Successfully processed ${completedTasksWithDetails.length} completed tasks`);
        return completedTasksWithDetails;
    } catch (error) {
        console.error('Error fetching completed tasks:', error.response?.data || error.message);
        if (error.response) {
            console.error('API Response:', {
                status: error.response.status,
                data: error.response.data,
            });
        }
        throw error;
    }
}

// Fetch all tasks from Todoist and save to logs
async function fetchTodoistTasks() {
    try {
        // Fetch both active and completed tasks
        console.log('Started fetching Active and Completed tasks...');
        const [activeTasks, completedTasks] = await Promise.all([fetchActiveTasks(), fetchCompletedTasks()]);

        console.log(`Fetched ${activeTasks.length} active tasks and ${completedTasks.length} completed tasks`);

        // Combine tasks and ensure completed tasks are marked
        const allTasks = [...activeTasks, ...completedTasks];

        // Create timestamp for the filename
        const now = new Date();
        const timestamp = now.toISOString().replace(/[:.]/g, '-').replace('T', '--').slice(0, 19);

        const fileName = `todoist-tasks-${timestamp}.json`;
        const logsDir = path.join(__dirname, '..', 'logs');

        // Ensure logs directory exists
        await fs.mkdir(logsDir, { recursive: true });

        const filePath = path.join(logsDir, fileName);

        // Save tasks to file for logging
        await fs.writeFile(filePath, JSON.stringify(allTasks, null, 2));
        console.log(`Tasks saved to ${filePath}`);

        return allTasks;
    } catch (error) {
        console.error('Error in fetchTodoistTasks:', error.message);
        if (error.response) {
            console.error('API Response:', {
                status: error.response.status,
                data: error.response.data,
                headers: error.response.headers,
            });
        }
        throw error;
    }
}

// Export functions
module.exports = {
    fetchTodoistTasks,
    fetchActiveTasks,
    fetchCompletedTasks,
};

// Allow direct execution for testing
if (require.main === module) {
    fetchTodoistTasks()
        .then((tasks) => {
            console.log('Fetched Tasks:', JSON.stringify(tasks, null, 2));
        })
        .catch((error) => {
            process.exit(1);
        });
}
