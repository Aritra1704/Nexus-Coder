# surgical-orchestrator: Implementation Plan & Task List

## 1. Implementation Design: The Porting Strategy

surgical-orchestrator will be built in **Layered Incremental Stages**. Each module is not just copied; it is rewritten using **Clean Architecture** principles, with **exact-match unit tests** and **surgical file editing**.

### Layered Rewrite Strategy
- **Layer 0 (Foundation):** CLI Entry, Configuration, Tool Registry (Registry of `replace`, `write_file`).
- **Layer 1 (The Brain):** `GeminiDriver` and the main tool-loop executor.
- **Layer 2 (Agents):** `Router`, `Surgeon` (Patcher), `Writer`, `GitGuardian`.
- **Layer 3 (Intelligence & Memory):** Performance tracking, Knowledge Graph, Skill Generator.
- **Layer 4 (Infrastructure):** Database migrations, RAG retrieval, Telegram/HTTP Control API.

---

## 2. Task List (Prioritized)

- [x] **Stage 0: Foundation** (Setup CLI, config, `registry.js` with `replace` tool)
- [x] **Stage 1: GeminiDriver** (Reimplement core tool-loop/orchestrator)
- [x] **Stage 2: Agentic Layer** (Router: Verified, Writer: Verified, Surgeon: Verified, GitGuardian: Verified)
- [x] **Stage 3: Intelligence Layer** (Performance Tracker, Skill Generator, Budgeting) — *Soul Foundation*
- [x] **Stage 4: Memory Layer** (Artifacts: Verified, Knowledge Graph: Verified, Retention: Verified) — *Soul Implementation*
- [x] **Stage 5: Infrastructure & Autonomy** (DB: Verified, Telegram: Verified, HTTP API: Verified, Heartbeat Service: Verified) — *Heartbeat Implementation*

---

## 3. Implementation Details

- **All code is strictly TypeScript/JavaScript (ESM).**
- **Surgical First:** `FilePatcher` must verify a 3-line search context before applying any `replace`.
- **Git-Locked:** Every agent operation *must* invoke the `GitGuardian` agent to verify and commit.
- **Self-Documenting:** As each module is ported, we generate its `module_design.md` inside `docs/modules/`.

---

## 4. Execution Workflow for Each Task
1. **Audit:** Read original LocalClaw module source.
2. **Design:** Map logic, dependencies, and state transitions.
3. **Spec:** Create `docs/modules/<name>.md`.
4. **Implement:** Write surgical-orchestrator version (clean-room rewrite).
5. **Verify:** Run integration tests within the target project directory.
