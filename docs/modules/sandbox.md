# Module Design: Workspace-Aware Sandbox (`src/infrastructure/sandbox/`)

## 1. Purpose
The `Sandbox` module provides a secure execution environment for terminal commands. It addresses the user's mandatory requirement: **surgical-orchestrator must work directly inside repositories under `workspace_biz`**.

## 2. Key Architectural Decisions
- **Mount-Point Logic:** When using Docker, the `workspace_biz` root (or specific project directory) is mounted as a volume. This ensures surgical-orchestrator's work is persistent and directly visible in the local filesystem.
- **Resource Constraints:** Enforces CPU/Memory limits to ensure the host system remains responsive during heavy tasks (like builds or tests).
- **Dual-Mode Execution:**
  - **Docker Mode:** Isolated, resource-limited execution for untrusted/high-risk commands.
  - **Native Mode:** Direct execution on the host OS for low-risk operations, with a strict blocklist for dangerous commands.

## 3. Component Specifications
- **Sandbox Manager (`manager.js`):** Orchestrates command routing, volume mounting, and cleanup.
- **Project Initializer (`project-init.js`):** Specialized tool for creating new directories and initializing Git/NPM inside `workspace_biz`.

## 4. Implementation Plan
1. Implement `src/infrastructure/sandbox/manager.js` with volume mounting support.
2. Implement project creation logic that targets the user's defined `workspace_biz` root.
3. Create tests verifying file visibility between the sandbox and the host.

## 5. Testing Strategy
- **Persistence Test:** Create a file inside the sandbox and verify its existence on the host filesystem at the correct `workspace_biz` path.
- **Safety Test:** Verify that blocked commands (e.g., `rm -rf /`) are caught and rejected by the native execution layer.
