# Rationale for surgical-orchestrator

We are transitioning from **LocalClaw** to **surgical-orchestrator** to build a superior, more robust, and architecturally cleaner autonomous coding agent. 

## The Core Limitations of LocalClaw
1.  **Architecture Bottleneck:** LocalClaw was designed for an autonomous, sandboxed paradigm that made it difficult to integrate seamlessly with the main project directory.
2.  **Structural Fragility:** Our debugging session revealed critical logic errors in `orchestrator.js` and `executor.js`, specifically unclosed blocks and unsafe property access (e.g., `Cannot read properties of undefined (reading 'status')`) that forced frequent patching rather than clean development.
3.  **Lack of Surgical Editing:** LocalClaw relied heavily on `write_file` (overwriting entire files), which is inefficient, prone to context loss, and unsuitable for professional-grade codebases.
4.  **Planner Malfunctions:** The LLM-based planning logic often failed, forcing us to use deterministic fallback plans that lacked the intelligence required for complex tasks.

## The Vision for surgical-orchestrator
surgical-orchestrator is built on three core pillars:
1.  **Surgical-First Editing:** Every modification will be done using `replace` (patching) to preserve file integrity.
2.  **Orchestrator-in-Control:** The architecture moves from "Autonomous Engine" to "Orchestrator Library." Gemini CLI acts as the central brain, invoking specialized tools (executor, verifier, git-guardian) to perform actions.
3.  **Multi-Model Intelligence:** A flexible, model-agnostic execution flow:
    *   **Gemini (High-Tier):** Orchestration, planning, architectural review, verification, complex refactoring.
    *   **Ollama (Mid-Tier):** Routine coding, writing tests, simple implementation blocks.
    *   **Git-Guardian (Low-Tier/Deterministic):** Monitoring `git status`, log verification, and state machine enforcement.

## Key LocalClaw Modules to Port
The following modules from LocalClaw will be audited, cleaned, and ported to surgical-orchestrator:
- `src/agent/`: Executor, planner, verifier (must be refactored for surgical editing).
- `src/control/`: Task contract logic and orchestration.
- `src/db/`: Persistence layer.
- `src/llm/`: Provider interfaces (Gemini/Ollama).
- `src/memory/`: Memory management system.
- `src/tools/`: The core registry (must be expanded with a robust `replace` tool).

surgical-orchestrator starts from a clean slate with a rigorous, test-driven approach.
