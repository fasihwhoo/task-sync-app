# Todoist-MongoDB Sync

A Node.js application that synchronizes tasks between Todoist and MongoDB, providing a reliable backup and API interface for your Todoist tasks.

## Features

-   Syncs both active and completed tasks from Todoist
-   Stores task history in MongoDB
-   RESTful API endpoints for task management
-   Automatic task synchronization
-   Detailed logging system
-   Real-time task updates
-   Separate endpoints for active and completed tasks

## Tech Stack

-   Node.js
-   Express.js
-   MongoDB with Mongoose
-   Todoist REST API v2
-   Axios for HTTP requests
-   Nodemon for development

## Prerequisites

-   Node.js (v12 or higher)
-   MongoDB (v4.0 or higher)
-   Todoist API Token

## Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd notion-todoist-sync
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the root directory:

```env
MONGODB_URI=mongodb://localhost:27017/todoist-sync
TODOIST_API_TOKEN=your_todoist_api_token
PORT=8082
```

## API Endpoints

### Task Management

-   **GET** `/tasks`

    -   Retrieves all tasks directly from Todoist
    -   Returns array of task objects in Todoist format

-   **GET** `/tasks/active`

    -   Retrieves only active (uncompleted) tasks from Todoist
    -   Returns array of active task objects

    ```json
    [
        {
            "id": "1234567890",
            "content": "Task title",
            "description": "",
            "is_completed": false,
            "priority": 4,
            "due": {
                "date": "2024-03-15",
                "string": "Mar 15",
                "lang": "en"
            }
        }
    ]
    ```

-   **GET** `/tasks/completed`
    -   Retrieves only completed tasks from Todoist
    -   Returns array of completed task objects
    ```json
    [
        {
            "id": "0987654321",
            "content": "Completed task",
            "is_completed": true,
            "completed_at": "2024-03-10T15:30:00Z"
        }
    ]
    ```

### Database Operations

-   **GET** `/tasks/db`

    -   Retrieves all tasks from MongoDB database
    -   Returns array of task objects in database format

-   **GET** `/tasks/sync`
    -   Syncs tasks between Todoist and MongoDB
    -   Returns sync statistics
    ```json
    {
        "message": "Successfully synced tasks from Todoist",
        "stats": {
            "total": 15,
            "failed": 0,
            "success": 15,
            "dbCount": 14,
            "completedCount": 9
        }
    }
    ```

## Data Models

### Task Schema

```javascript
{
    todoid: {
        type: String,
        unique: true,
        sparse: true,
        index: true,
    },
    content: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        default: '',
    },
    is_completed: {
        type: Boolean,
        default: false,
    },
    labels: {
        type: [String],
        default: [],
    },
    priority: {
        type: String,
        enum: ['1', '2', '3', '4', null],
        default: null,
    },
    due_date: {
        type: Date,
        default: null,
    },
    due_time: {
        type: String,
        default: '',
    },
    url: {
        type: String,
        default: '',
    },
    project_id: {
        type: String,
        default: '',
    },
    created_at: {
        type: Date,
        default: Date.now,
    },
    completed_at: {
        type: Date,
        default: null,
    },
    last_updated_by: {
        type: String,
        default: '',
    },
    source: {
        type: String,
        enum: ['todoist', 'notion'],
        required: true,
    }
}
```

## Project Structure

```
notion-todoist-sync/
├── routes/
│   └── taskRoutes.js    # All task-related route handlers
├── database/
│   ├── config.js        # MongoDB connection
│   ├── syncTodoistTasks.js # Sync logic
│   └── taskSchema.js    # Mongoose schema
├── todoist-tasks/
│   └── todoist-task-fetcher.js # Todoist API integration
├── logs/                # Task sync logs
├── .env                # Environment variables
├── .gitignore
├── nodemon.json       # Nodemon config
├── package.json
├── package-lock.json
└── server.js          # Express server setup
```

## Sync Logic

### Active Tasks

-   Fetches active tasks from Todoist REST API v2
-   Endpoint: `https://api.todoist.com/rest/v2/tasks`
-   Headers: `Authorization: Bearer ${TODOIST_API_TOKEN}`

### Completed Tasks

-   Fetches completed tasks from Todoist Sync API v9
-   Endpoint: `https://api.todoist.com/sync/v9/completed/get_all`
-   Parameters:
    -   `since`: Last 30 days (YYYY-MM-DD format)
    -   `limit`: 200 (maximum allowed)

### Task Processing

1. Fetches both active and completed tasks
2. Maps Todoist task format to MongoDB schema
3. Handles different task formats (active vs completed)
4. Updates or creates tasks in MongoDB
5. Maintains task completion status and timestamps

## Error Handling

-   Detailed error logging for API requests
-   Task-level error tracking during sync
-   MongoDB connection error handling
-   API token validation
-   Rate limiting consideration

## Logging

-   JSON log files for each sync operation
-   Timestamp-based log file naming
-   Detailed task processing logs
-   Error and success tracking

## Development

1. Start MongoDB server
2. Run the application in development mode:

```bash
npm run dev
```

## Production

1. Set up MongoDB instance
2. Configure environment variables
3. Start the application:

```bash
npm start
```

## Recent Updates and Improvements

### Code Organization (Latest Update)

-   Moved all route handlers to dedicated `routes` directory
-   Separated task-related routes into `taskRoutes.js`
-   Added new endpoints for active and completed tasks
-   Improved code modularity and maintainability
-   Enhanced API documentation

### Future Enhancements

-   [ ] Add API rate limiting
-   [ ] Implement caching layer
-   [ ] Add task update webhooks
-   [ ] Improve error recovery mechanisms
-   [ ] Add automated tests
-   [ ] Add performance monitoring

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License.
