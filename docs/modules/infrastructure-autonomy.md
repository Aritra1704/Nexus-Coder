# Module Design: Infrastructure & Autonomy (`src/infrastructure/`)

## 1. Purpose
This layer enables surgical-orchestrator to connect to external systems (DB, Telegram, API) and ensures surgical-orchestrator remains active autonomously via the Heartbeat service.

## 2. Component Specifications

### 2a. DB Client (`src/db/client.js`)
- **Responsibility:** Persistent state storage (performance metrics, task status, memory logs).
- **Tool:** `pg` (PostgreSQL client).
- **Testing:** Verify connection to Postgres and ability to perform CRUD operations.

### 2b. Telegram Bot (`src/telegram/bot.js`)
- **Responsibility:** Operator interaction and delegation.
- **Tool:** `telegraf` (or similar).
- **Testing:** Verify command reception and message sending.

### 2c. Control API (`src/control/api.js`)
- **Responsibility:** Expose surgical-orchestrator status and task control.
- **Tool:** `express` or `fastify`.
- **Testing:** Verify HTTP status endpoints and task spawning endpoints.

### 2d. Heartbeat Service (`src/brain/heartbeat.js`)
- **Responsibility:** Autonomous trigger.
- **Logic:** Periodically (e.g., hourly) scan workspace/pending tasks and initiate GeminiDriver if needed.
- **Testing:** Mock time-trigger to verify loop execution.

## 3. Implementation Plan
1. Implement `dbClient` + migrations.
2. Implement `controlAPI` (HTTP interface).
3. Implement `telegramBot` (Command interface).
4. Implement `heartbeat` (Background daemon).

## 4. Testing Strategy
- **DB:** Integration tests with a test database.
- **Telegram:** Mocked message testing.
- **Heartbeat:** Simulate a task pending in queue and verify the orchestrator is triggered.
