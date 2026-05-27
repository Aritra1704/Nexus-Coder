# Skill: Refresh Project Context

## Purpose
Synchronizes Arnold's internal knowledge graph and memory with the latest state of a project's filesystem, documentation, and git history.

## Trigger Phrases
- "refresh context"
- "update project memory"
- "sync with repo"

## Workflow
1. **Scan Files:** Perform a recursive file listing of the project root.
2. **Read Docs:** Update the knowledge graph with content from `.md` and `.txt` files.
3. **Git Sync:** Read recent git logs and diffs since the last refresh.
4. **Learning Extraction:** Update the learning memory based on recent successful/failed commits.

## Directives
- Always run this skill before starting a large implementation task.
- Update `docs/PORTING_STATUS.md` if the project is part of an Arnold migration.
