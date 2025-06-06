# Todoist MongoDB Sync

A Node.js application that imports and syncs tasks from Todoist to MongoDB. This is a one-way sync system that keeps your MongoDB database up-to-date with your Todoist tasks.

## Features

-   One-way sync from Todoist to MongoDB
-   Handles both active and completed tasks
-   Preserves all task metadata (priority, labels, due dates, etc.)
-   Bulk operations for efficient database updates
-   Preview changes before applying them
-   Detailed logging and error handling

## Prerequisites

-   Node.js (v14 or higher)
-   MongoDB (v4.4 or higher)
-   Todoist API Token

## Installation

1. Clone the repository:

```bash
git clone <repo link>
cd notion-todoist-sync
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:

```env
PORT=3000
MONGODB_URI=your_mongodb_connection_string
TODOIST_API_TOKEN=your_todoist_api_token
```

4. Start the server:

```bash
npm run dev  # for development with nodemon
# or
npm start    # for production
```

## API Endpoints

### Root Endpoint

```
GET /tasks
```

Shows API status and available endpoints.

Response:

```json
{
    "status": "success",
    "message": "Task sync API is running",
    "endpoints": {
        "GET /tasks/db": "Get all tasks from database",
        "GET /tasks/active": "Get active tasks",
        "GET /tasks/completed": "Get completed tasks",
        "GET /tasks/sync/check": "Check what needs to be synced from Todoist to MongoDB",
        "POST /tasks/sync": "Import/sync tasks from Todoist to MongoDB (one-way sync)"
    }
}
```

### Check Sync Status

```
GET /tasks/sync/check
```

Compares Todoist tasks with MongoDB and shows what would change during a sync.

Response:

```json
{
    "toCreate": [...],  // Tasks that will be created
    "toUpdate": [...],  // Tasks that will be updated
    "toDelete": [...],  // Tasks that will be deleted
    "summary": {
        "createCount": 0,
        "updateCount": 0,
        "deleteCount": 0,
        "todoistCount": 0,
        "mongoCount": 0
    }
}
```

### Perform Sync

```
POST /tasks/sync
```

Imports tasks from Todoist to MongoDB. This is a one-way sync that:

1. Creates new tasks that exist in Todoist but not in MongoDB
2. Updates existing tasks in MongoDB to match Todoist
3. Deletes tasks from MongoDB that no longer exist in Todoist

Response:

```json
{
    "status": "success",
    "message": "Successfully imported tasks from Todoist to MongoDB",
    "created": 0,
    "updated": 0,
    "deleted": 0,
    "todoistCount": 0,
    "mongoCount": 0,
    "finalCount": 0,
    "completedCount": 0
}
```

### View Database Tasks

```
GET /tasks/db
```

Returns all tasks currently stored in MongoDB.

### View Active Tasks

```
GET /tasks/active
```

Returns all non-completed tasks from MongoDB.

### View Completed Tasks

```
GET /tasks/completed
```

Returns all completed tasks from MongoDB.

## Task Schema

Tasks are stored in MongoDB with the following structure:

```javascript
{
    todoid: String,          // Unique Todoist task ID
    content: String,         // Task title/content
    description: String,     // Task description
    is_completed: Boolean,   // Completion status
    labels: [String],        // Array of labels
    priority: Number,        // Priority (1-4)
    due_date: Date,         // Due date
    due_time: String,       // Due time (if any)
    url: String,            // Todoist task URL
    project_id: String,     // Todoist project ID
    created_at: Date,       // Creation timestamp
    updated_at: Date,       // Last update timestamp
    completed_at: Date,     // Completion timestamp
    last_updated_by: String, // Source of last update
    source: String          // 'todoist' or 'notion'
}
```

## Sync Process Details

### 1. Task Comparison (`syncChecker.js`)

-   Fetches tasks from both Todoist and MongoDB
-   Normalizes task data for comparison
-   Identifies tasks to create, update, or delete
-   Provides detailed sync preview

### 2. Task Mapping (`syncTasks.js`)

-   Converts Todoist task format to MongoDB schema
-   Handles all task properties and metadata
-   Ensures data type consistency
-   Manages timestamps and IDs

### 3. Bulk Operations

-   Uses MongoDB bulkWrite for efficiency
-   Performs all operations in a single database call
-   Handles creates, updates, and deletes together

### 4. Error Handling

-   Validates API responses
-   Provides detailed error messages
-   Logs issues for debugging
-   Maintains database consistency

## Error Handling

The API uses standard HTTP status codes:

-   200: Success
-   500: Server error

Error responses include:

```json
{
    "status": "error",
    "error": "Error message",
    "details": "Detailed error information"
}
```

## Logging

The application logs:

-   Sync operations and results
-   API calls and responses
-   Errors and exceptions
-   Task changes and differences

Logs are stored in the `logs` directory with timestamps.

## Future Enhancements

Planned features:

-   Two-way sync with Todoist
-   Webhook support for real-time updates
-   Task filtering and search
-   Project-based sync options
-   Batch operation controls

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
