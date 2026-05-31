# Module Design: DB Client (`src/db/client.js`)

## 1. Purpose
The `dbClient` provides a centralized, pooled connection to the PostgreSQL database. It is used by the `ModelPerformanceTracker`, `ExactArtifacts`, and the task queue to ensure data integrity and persistence.

## 2. Logic Mapping
- **Connection Pooling:** Uses `pg.Pool` for efficient connection management.
- **Schema Management:** Automatically ensures the `surgical-orchestrator` schema exists.
- **Query Wrapper:** Provides a robust `query` method with error handling and logging.

## 3. Implementation Plan
1. Install `pg` dependency.
2. Implement `src/db/client.js`.
3. Implement basic migrations in `db/migrations/001_initial.sql`.
4. Create verification tests in `src/db/tests/dbClient.test.js`.

## 4. Testing Strategy
- **Connection Test:** Verify that the client can connect to the database.
- **Query Test:** Perform a simple `SELECT 1` to verify the execution path.
- **Schema Test:** Verify that the search path is correctly set to the configured schema.
