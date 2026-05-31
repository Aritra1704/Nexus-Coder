# ROADMAP

## Phase 1: Persistence Foundation (PostgreSQL)
Goal: Replace file-based skeletons with a robust database for task tracking and memory.
- [x] **Task 1.1:** Create `db/migrations/` and define the initial schema (tasks, events, artifacts, learnings).
- [x] **Task 1.2:** Implement `src/db/client.js` using `pg` for connection pooling.
- [x] **Task 1.3:** Implement a migration runner to apply SQL updates automatically.
- [x] **Task 1.4:** Refactor `Intelligence` and `Memory` modules to use the DB.

## Phase 2: The Brain (Gemini Function Calling)
Goal: Implement the dynamic decision loop where Gemini analyzes the workspace and calls tools.
- [x] **Task 2.1:** Build `GeminiClient` with function-calling support.
- [x] **Task 2.2:** Map the `Registry` tools to JSON schemas for the Gemini API.
- [x] **Task 2.3:** [P3] Implement AES-256-GCM Encryption for all DB storage.
- [x] **Task 2.4:** Implement Ollama Fallback for Gemini downtime.
- [x] **Task 2.5:** Update configuration to May 2026 GA Models (`gemini-3.1-pro`, `gemini-3.5-flash`).

## Phase 3: RAG & Semantic Memory
Goal: Enable Arnold to remember what he has done and search the project semantically.
- [x] **Task 3.1:** Implement actual embedding generation (Ollama/Gemini) in the `Ingestor`.
- [x] **Task 3.2:** Implement vector retrieval for context loading.

## Phase 5: High-Performance Upgrades (Java & Speed)
Goal: Prepare Arnold for enterprise-grade Java development with fast local execution.
- [x] **Task 5.1:** Update `config.js` to target `qwen2.5-coder:14b` for coding.
- [x] **Task 5.2:** Add Java/Maven syntax and build support to `GitGuardian.js`.
- [ ] **Task 5.3:** Implement context compaction to optimize Gemini token usage.

## Phase 6: ContractGenie Implementation
Goal: Fully autonomous delivery of the Contract Creation microservices.
- [ ] **Stage 0:** Global Infrastructure (Docker & Spec)
- [ ] **Stage 1:** User Service (Auth & JWT)
- [ ] **Stage 2:** PDF Service (Generation Engine)
- [ ] **Stage 3:** Contract Service (Orchestration)
- [ ] **Stage 4:** Frontend (React Native UI)

