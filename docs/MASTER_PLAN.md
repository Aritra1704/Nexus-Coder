# surgical-orchestrator: Master Implementation Plan

## 1. Project Philosophy
- **"Gemini thinks. Ollama types. surgical-orchestrator ships."**
- Autonomy through orchestration, not magic.
- Humans collaborate; they do not approve every trivial file change.
- Git is the absolute source of truth.

## 2. Global Stage Roadmap

- [x] **Stage 0: Foundation** (Config, Registry, `replace` tool)
- [x] **Stage 1: GeminiDriver** (Core orchestrator loop)
- [ ] **Stage 2: Agentic Layer** (Router, Writer, Surgeon, GitGuardian)
- [ ] **Stage 3: Intelligence Layer** (Model tracker, Skill generator, Budgeting)
- [ ] **Stage 4: Memory Layer** (Artifacts, Knowledge Graph, Retention)
- [ ] **Stage 5: Infrastructure & Autonomy** (DB, API, Heartbeat Service)

## 3. Communication Standards
- **Surgical First:** Never replace whole files if only a block is changed.
- **Git-Locked:** No task is complete until `git commit` is successful.
- **Verifiable:** Every tool call has a corresponding verification step.
- **Self-Documenting:** All modules must be mapped in `docs/modules/` before implementation.
