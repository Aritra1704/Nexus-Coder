# Module Design: GitGuardian (`src/agents/gitGuardian.js`)

## 1. Purpose
The `GitGuardian` agent ensures that all workspace modifications are verified before being committed to the Git repository. It enforces the "Git-Locked" principle, preventing broken code from being committed.

## 2. Logic Mapping
- **Validation Check:** Executes language-specific syntax checks (e.g., `node --check`) and project tests.
- **Git Commit:** Commits valid changes with a structured message.
- **Reversion:** If validation fails, `git checkout` the file to revert the invalid change.

## 3. Implementation Plan
1. Implement `src/agents/gitGuardian.js` with `verifyAndCommit(path, taskId)`.
2. Integrate with `src/tools/registry.js` (using `run_terminal_command` for git operations).
3. Create `src/agents/tests/gitGuardian.test.js`.

## 4. Testing Strategy
- **Success Branch:** Modify a file, verify it, and assert that a commit was made.
- **Failure Branch:** Modify a file with syntax error, verify it fails, assert the file was reverted.
