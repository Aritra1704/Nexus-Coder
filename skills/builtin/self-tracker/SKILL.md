# Skill: SelfTracker

## Purpose
Enforces project tracking, task status updates, and state retention for the surgical-orchestrator orchestrator.

## Workflow
1. **Initiation:** Every task starts by documenting its objective in the current state record.
2. **Monitoring:** After every tool execution, update `docs/IMPLEMENTATION_PLAN.md` with checkmark completion.
3. **Recovery:** If the orchestrator crashes, on reboot, read `docs/IMPLEMENTATION_PLAN.md` to determine the last uncompleted task.
4. **Handoff:** Before shutting down, ensure the state of the workspace is recorded in a `checkpoint.json`.

## Responsibilities
- Maintain `docs/PORTING_STATUS.md` as the live dashboard.
- Act as the "Git-Guardian" for all task completions.
- Validate that all dependencies for a stage are met before marking it "done" in the plan.
