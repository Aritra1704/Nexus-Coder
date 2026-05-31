# Module Design: Intelligence Layer (`src/intelligence/`)

## 1. Purpose
The Intelligence Layer provides the decision-making data for surgical-orchestrator's orchestrator. It answers: 
1. Which model should I use for this task? (`ModelPerformanceTracker`)
2. Am I running out of context? (`TokenBudget`)
3. Can I automate this recurring pattern? (`SkillGenerator`)

## 2. Component Specifications

### 2a. ModelPerformanceTracker (`src/intelligence/modelPerformanceTracker.js`)
- **Responsibility:** Tracks task success rates, token usage, and latency per model.
- **Logic:** 
  - Store results in `db/performance.db`.
  - Provide recommendation API: `getBestModel(taskType)`.
- **Testing:** Verify model recommendation shifts after injecting failure data.

### 2b. TokenBudget (`src/intelligence/tokenBudget.js`)
- **Responsibility:** Manages context window lifespan.
- **Logic:** 
  - Track `tokensUsed` per session.
  - Signal `needsCheckpoint` at 70%.
- **Testing:** Verify checkpoint trigger.

### 2c. SkillGenerator (`src/intelligence/skillGenerator.js`)
- **Responsibility:** Auto-prompts for new `skills/` based on successful patterns.
- **Logic:** 
  - Trigger when `taskPattern` success >= 3.
  - Generate `SKILL.md` template.
- **Testing:** Verify trigger logic on mock successful task patterns.

---

## 3. Implementation Plan
1. Implement `src/intelligence/modelPerformanceTracker.js`.
2. Implement `src/intelligence/tokenBudget.js`.
3. Create unit tests for each.

## 4. Testing Strategy
- **Tracker:** Verify data logging and model ranking.
- **Budget:** Verify threshold triggers.
- **Generator:** Verify creation of skill directory structure.
