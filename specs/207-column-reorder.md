# Feature 207: Column Reorder

## Overview
Add CLI commands to reorder columns on a board by moving them left or right.

## API Endpoints

### Move Column Left
- **Endpoint**: `POST /columns/:column_id/left_position`
- **Description**: Moves a column one position to the left
- **Response**: `204 No Content` on success

### Move Column Right
- **Endpoint**: `POST /columns/:column_id/right_position`
- **Description**: Moves a column one position to the right
- **Response**: `204 No Content` on success

## Implementation Tasks

### 1. API Methods
Add two new methods to `src/lib/api.js`:

- `moveColumnLeft(columnId)` - POST to `/columns/:id/left_position`
- `moveColumnRight(columnId)` - POST to `/columns/:id/right_position`

Note: These endpoints are NOT scoped to a board in the URL path, just the column ID.

### 2. CLI Commands
Add two new subcommands to `src/commands/columns.js`:

- `columns move-left <columnId>` - Move a column one position to the left
- `columns move-right <columnId>` - Move a column one position to the right

### 3. Unit Tests
Add tests to `test/api.test.js`:

- Test `moveColumnLeft` calls correct endpoint with POST
- Test `moveColumnRight` calls correct endpoint with POST

## Acceptance Criteria

1. `fizzy columns move-left <columnId>` moves column left
2. `fizzy columns move-right <columnId>` moves column right
3. Both commands show success message on completion
4. Both commands show error message on failure
5. All existing tests continue to pass
6. New unit tests cover the API methods
