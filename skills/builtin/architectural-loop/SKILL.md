# Skill: Architectural Loop

## Purpose
Orchestrates a multi-phase architectural workflow: generates a High-Level Design (HLD), decomposes it into logical implementation stages, and iteratively implements each stage via structured sub-tasks.

## Trigger Phrases
- "start architectural loop"
- "design new application"
- "architect project from scratch"
- "implement feature with hld"

## Workflow
1. **Research Phase:** Analyze project requirements and existing context.
2. **HLD Generation:** Create a `docs/HLD.md` with architecture diagrams and component maps.
3. **Stage Decomposition:** Create a `docs/STAGE_TRACKER.md` breaking the work into 5-8 verifiable stages.
4. **Task Spawning:** For each stage, spawn an Arnold sub-task using the `spawn_subtask` tool.
5. **Monitoring:** Track progress via the `Stage Tracker` and update status as sub-tasks complete.

## Directives
- Always use Gemini Pro for the HLD phase.
- Ensure every implementation stage has explicit success criteria.
- Do not proceed to the next stage until the current one is git-verified.
