# Module Design: Surgeon & Writer Agents (`src/agents/`)

## 1. Purpose
- **FileWriter (`fileWriter.js`):** Encapsulates the `write_file` operation. Used exclusively for creating *new* files or full-file initialization.
- **FilePatcher (`filePatcher.js`):** Encapsulates the `replace` operation. Used for *surgical* updates to existing codebases.

## 2. Logic Mapping
| Module | Original Method | Arnold Method | Dependencies |
| :--- | :--- | :--- | :--- |
| `fileWriter` | `write_file` (tool) | `write(path, content)` | `registry.js` |
| `filePatcher` | `replace` (tool) | `patch(path, old, new)` | `registry.js` |

## 3. Implementation Plan
1. Implement `src/agents/fileWriter.js` (simple wrapper around `write_file` tool).
2. Implement `src/agents/filePatcher.js` (wrapper around `replace` tool with added verification).
3. Create `src/agents/tests/filePatcher.test.js` to verify exact string matching and failure modes.

## 4. Testing Strategy
- **Writer:** Verify file creation + content accuracy.
- **Patcher:** 
  - Valid patch: Verify file content updated correctly.
  - Invalid patch: Verify error is thrown if `oldContent` is not found (and does *not* modify the file).
