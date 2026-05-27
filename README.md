# Arnold: The Autonomous Coding Orchestrator

Arnold is a persistent, agentic coding orchestrator built to be the "brain" of your development lifecycle. It takes a project from idea to working code — planning, architecting, writing, verifying, and committing — with a focus on surgical precision and cost optimization.

Born from the lessons of LocalClaw, Arnold solves the "sandbox trap" by working directly inside your real projects, editing files surgically to maintain context, and managing a multi-model intelligence pipeline to minimize API costs while maximizing reasoning quality.

---

## How It Works

Arnold does not generate a static plan and walk away. Gemini drives a **live tool loop** — deciding the next action, calling the right tool, reading the result, and deciding again — until the task is done.

```
Task arrives
    ↓
Gemini reads project context (project-specific memory, not the whole codebase)
    ↓
Gemini drives: read → think → delegate → verify → commit → repeat
    ↓
When online: delegates complex implementation to you via Telegram
When offline: Ollama models handle routine code generation locally
    ↓
Every file change is git-verified before the next step begins
    ↓
Task ships. Learning saved. Skill created if pattern repeats.
```

---

## Core Principles

1. **Gemini is the Orchestrator, not just a tool.** It drives the entire loop — planning, routing, reviewing, and deciding when to escalate. It retains global architectural state.

2. **Ollama models are "Workers," not planners.** Each Ollama call does one constrained job: write this function, patch this block. Gemini provides the context, receives the output, and acts as the "Surgeon" to apply the code.

3. **Surgical editing by default.** Every change to an existing file goes through a 3-agent pipeline: a router decides `write` vs `patch`, a writer or patcher generates the change, and a git-verification agent confirms syntax and logic before committing.

4. **Works in your real projects.** No isolated workspace copies. Arnold operates directly inside your target project directory.

5. **Git is the source of truth.** Every verified step is committed immediately. The git log is the task execution log. Crashes resume from the last clean commit.

6. **You are a collaborator, not an approver.** When you are online, Arnold delegates complex tasks to you, waits for your git push, then verifies and continues automatically.

7. **Learns and evolves.** Every task outcome is recorded. Model performance is tracked per task type. When a pattern succeeds three times, Arnold auto-generates a skill so the next run is faster and cheaper.

---

## Multi-Model Intelligence

| Decision | Model | Cost |
|----------|-------|------|
| Architecture, routing, complex reasoning | Gemini 1.5 Pro | Optimized |
| Surgical editing, routine verification | Gemini 1.5 Flash | Cheap |
| Routine code generation | Ollama qwen2.5-coder:7b | Free |
| Write vs patch routing | Ollama llama3.2:3b | Free |

Gemini drives the strategy. Ollama handles the heavy lifting. You handle what neither can.

---

## Project Structure

```
Arnold/
├── src/
│   ├── brain/          # GeminiDriver (the core loop)
│   ├── agents/         # FileEditRouter, Surgeon, GitGuardian
│   ├── intelligence/   # ModelPerformanceTracker, SkillGenerator, TokenBudget
│   ├── memory/         # Exact artifacts, knowledge graph, retention
│   ├── tools/          # Tool registry (all tools Gemini can call)
│   ├── skills/         # Skill manager
│   ├── control/        # Task contract handling, orchestration logic
│   └── ...             # git, mcp, rag, learnings
├── skills/
│   └── builtin/        # Reusable workflow instructions
├── docs/
│   ├── ARCHITECTURE.md     # Full technical specification
│   └── TRANSITION_RATIONALE.md # Why Arnold replaced LocalClaw
└── db/
    └── migrations/         # Persistence layer
```

---

## What Makes It Different from LocalClaw

| LocalClaw | Arnold |
|-----------|--------|
| Static JSON plans | Live, continuous tool loop |
| Ollama planned everything (high failure) | Gemini plans/reviews, Ollama executes |
| `write_file` for everything | Surgical `replace` patches by default |
| Isolated SSD sandbox | Direct in-place editing |
| Approval gate on every task | No gates for local code; only deploys need approval |
| No persistent context | Auto-checkpointing and knowledge graph retention |

---

## Status

Planning phase complete. Module porting from LocalClaw is underway.
See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the full technical spec.
