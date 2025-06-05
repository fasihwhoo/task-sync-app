# Todoist-MongoDB Sync

A Node.js application that synchronizes tasks between Todoist and MongoDB, providing a reliable backup and API interface for your Todoist tasks.

## Features

-   Syncs both active and completed tasks from Todoist
-   Stores task history in MongoDB
-   RESTful API endpoints for task management
-   Automatic task synchronization
-   Detailed logging system
-   Real-time task updates

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

### Task Synchronization

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

### Task Management

-   **GET** `/tasks`
    -   Retrieves all tasks from the database
    -   Returns array of task objects

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

## Sync Logic

### Active Tasks

-   Fetches active tasks from Todoist REST API v2
-   Endpoint: `https://api.todoist.com/rest/v2/tasks`
-   Headers: `Authorization: Bearer ${TODOIST_API_TOKEN}`

### Completed Tasks

-   Fetches completed tasks from Todoist Sync API v9
-   Endpoint: `https://api.todoist.com/sync/v9/completed/get_all`
-   Parameters:
    -   `since`: Last 7 days (YYYY-MM-DD format)
    -   `limit`: 200 (maximum allowed)

### Task Processing

1. Fetches both active and completed tasks
2. Maps Todoist task format to MongoDB schema
3. Handles different task formats (active vs completed)
4. Updates or creates tasks in MongoDB
5. Maintains task completion status and timestamps

## File Structure

```
notion-todoist-sync/
├── database/
│   ├── config.js         # MongoDB connection
│   ├── syncTodoistTasks.js # Sync logic
│   └── taskSchema.js     # Mongoose schema
├── todoist-tasks/
│   └── todoist-task-fetcher.js # Todoist API integration
├── logs/                 # Task sync logs
├── .env                 # Environment variables
├── .gitignore
├── nodemon.json        # Nodemon config
├── package.json
├── package-lock.json
└── server.js           # Express server
```

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

### Code Documentation (Latest Update)

We've added comprehensive documentation throughout the codebase to improve maintainability and developer experience:

#### Server (`server.js`)

-   Added detailed JSDoc comments for all API endpoints
-   Documented environment variable requirements
-   Added error handling documentation
-   Improved server initialization and shutdown comments

#### Task Fetcher (`todoist-tasks/todoist-task-fetcher.js`)

-   Documented Todoist API integration methods
-   Added detailed function documentation for active and completed task fetching
-   Improved error handling and logging documentation
-   Added file saving and timestamp handling explanations

#### Database Layer

1. Configuration (`database/config.js`):

    - Added MongoDB connection configuration documentation
    - Documented environment variables and default settings
    - Added error handling and retry logic documentation

2. Task Schema (`database/taskSchema.js`):

    - Added comprehensive JSDoc type definitions
    - Documented all task properties and their purposes
    - Added schema options and middleware documentation
    - Improved field validation documentation

3. Task Synchronization (`database/syncTodoistTasks.js`):
    - Added detailed sync process documentation
    - Documented statistics tracking and error handling
    - Added task mapping and update logic documentation
    - Improved logging and debugging information

### Code Structure Improvements

-   Organized code into logical modules
-   Improved error handling across all components
-   Added consistent logging patterns
-   Implemented proper type checking and validation
-   Added graceful shutdown handling
-   Improved API response formatting

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
