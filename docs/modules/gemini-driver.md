# Module Design: GeminiDriver (`src/brain/geminiDriver.js`)

## 1. Purpose
The `GeminiDriver` is the central brain of surgical-orchestrator. It manages the continuous tool-use loop, maintains the task state, handles model orchestration (routing between Pro, Flash, and Ollama), and enforces the verification protocol.

## 2. Logic Mapping & Porting Plan

| LocalClaw Module | Method/Logic | surgical-orchestrator Implementation | Notes |
| :--- | :--- | :--- | :--- |
| `orchestrator.js` | `executeTask` | `runLoop()` | Simplify: remove sandbox isolation |
| `orchestrator.js` | `toolRegistry` | `toolRegistry.runTool()` | Keep registry clean |
| `orchestrator.js` | `tokenBudget` | `Brain.monitorBudget()` | Maintain checkpointing logic |
| `orchestrator.js` | `Hooks/Loggers` | `surgical-orchestratorHooks` | Streamlined logging |

## 3. Design: The Live-Tool-Loop

```javascript
class GeminiDriver {
  constructor(config, registry) {
    this.config = config;
    this.registry = registry;
  }

  async runLoop(task) {
    let state = await this.loadState(task);
    
    while (!state.isDone) {
      // 1. Plan/Think
      const action = await this.decide(state);
      
      // 2. Route/Delegation (Gemini decides model)
      const executionResult = await this.executeAction(action);
      
      // 3. Git-Verify
      const verification = await this.verify(executionResult);
      
      // 4. Commit or Repair
      state = await this.updateState(state, verification);
      
      // 5. Checkpoint
      await this.saveCheckpoint(state);
    }
  }
}
```

## 4. Key Improvements over LocalClaw
- **In-Place Execution:** No more sandboxes; operations target `config.workspaceRoot`.
- **Atomic Tool Loops:** Every loop iteration is a single, verifiable commit.
- **Error Transparency:** Explicit error state handling; no more `undefined` property crashes.
- **Memory-First:** Always loads state from the knowledge graph before planning.
