# Module Design: Agentic Layer (`src/agents/`)

## 1. Purpose
The Agentic Layer transforms Gemini's high-level tool calls into surgical, verified filesystem modifications. It prevents the engine from blindly writing files by introducing a router, a surgeon (patcher), and a Git-based verification gate.

## 2. Component Specifications

### 2a. FileEditRouter (`src/agents/fileEditRouter.js`)
- **Responsibility:** Decision layer for write vs. patch.
- **Inputs:** `path`, `objective`, `fileContent` (if exists).
- **Logic:** 
  - If `fileContent` is null/empty → `WRITE`
  - If `fileContent` exists → `PATCH`
- **Testing:** Unit test with mock file existence/content checks.

### 2b. FileWriter (`src/agents/fileWriter.js`)
- **Responsibility:** Create new files.
- **Input:** `path`, `content`.
- **Tool:** `write_file`.
- **Testing:** Unit test that `write_file` is called with provided path/content.

### 2c. FilePatcher (`src/agents/filePatcher.js`)
- **Responsibility:** Surgical replacement.
- **Input:** `path`, `oldContent`, `newContent`.
- **Tool:** `replace`.
- **Testing:** 
  - Unit test for successful match/patch.
  - Unit test for failure when `oldContent` is missing.

### 2d. GitGuardian (`src/agents/gitGuardian.js`)
- **Responsibility:** Integrity gatekeeper.
- **Input:** Task `id`, changed `path`.
- **Logic:**
  1. `git diff <path>` (verify change exists).
  2. Run `lint` / `syntax_check` for the language.
  3. Run related `unit_tests`.
  4. If all pass: `git commit -m "feat(arnold): <task id> - <change summary>"`.
  5. If fail: `git checkout <path>` (revert), return failure to GeminiDriver.
- **Testing:** 
  - Test Git failure branch (revert triggered).
  - Test Git success branch (commit triggered).

---

## 3. Testing Strategy

### Isolation Testing (Unit)
Each agent will have its own unit test file in `src/agents/tests/<module>.test.js`.
- **Writer:** Verifies correct path/content passed to `registry.runTool`.
- **Patcher:** Verifies `replace` logic (mocking `fs.readFile`).
- **Router:** Verifies logical decision tree.

### Integration Testing (Loop)
- **GitGuardian-Loop:** A test scenario where a broken file is provided to the Patcher → GitGuardian detects syntax failure → Revert triggered → Repair requested.
- **Full Pipeline:** An end-to-end simulation where Gemini calls `Router` → `Surgeon` → `GitGuardian` → `Commit`.
