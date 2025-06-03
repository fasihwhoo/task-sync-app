require('dotenv').config();
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

const TODOIST_API_TOKEN = process.env.TODOIST_API_TOKEN;

if (!TODOIST_API_TOKEN) {
    console.error('Error: TODOIST_API_TOKEN is not set in .env file');
    process.exit(1);
}

async function fetchTodoistTasks() {
    try {
        const response = await axios.get('https://api.todoist.com/rest/v2/tasks', {
            headers: {
                Authorization: `Bearer ${TODOIST_API_TOKEN}`,
            },
        });

        const tasks = response.data;

        // Create timestamp for the filename
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const fileName = `todoist-tasks-${timestamp}.json`;
        const filePath = path.join(__dirname, fileName);

        // Save tasks to file
        await fs.writeFile(filePath, JSON.stringify(tasks, null, 2));
        console.log(`Tasks saved to ${filePath}`);

        return tasks;
    } catch (error) {
        console.error('Error fetching Todoist tasks:', error.response?.data || error.message);
        throw error;
    }
}

// Export the function for use in other files
module.exports = {
    fetchTodoistTasks,
};

// Only run if this file is run directly
if (require.main === module) {
    fetchTodoistTasks()
        .then((tasks) => {
            console.log('Fetched Tasks:', JSON.stringify(tasks, null, 2));
        })
        .catch((error) => {
            process.exit(1);
        });
}
