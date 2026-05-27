# Porting Status Dashboard

This document tracks the migration of modules from LocalClaw to Arnold.

| Module Name | Original Path | Status | Arnold Path | Notes |
| :--- | :--- | :--- | :--- | :--- |
| `config` | `src/config.js` | Verified | `src/config.js` | |
| `registry` | `src/tools/registry.js` | Verified | `src/tools/registry.js` | Added `replace` tool |
| `geminiDriver` | `src/orchestrator.js` | Verified | `src/brain/geminiDriver.js` | Rewrite for Live-Loop |
| `fileEditRouter`| `src/agent/executor.js` | Verified | `src/agents/fileEditRouter.js`| Surgical only |
| `fileWriter` | `src/agent/executor.js` | Pending | `src/agents/fileWriter.js` | |
| `filePatcher` | `src/agent/executor.js` | Pending | `src/agents/filePatcher.js` | |
| `gitGuardian` | `src/agent/verifier.js` | Pending | `src/agents/gitGuardian.js` | New Git hook logic |
| `modelPerformanceTracker` | `src/selfimprovement/` | Verified | `src/intelligence/modelPerformanceTracker.js` | Added `append_file` tool |
| `skillGenerator` | `src/selfimprovement/` | Verified | `src/intelligence/skillGenerator.js` | Uses registry tools |
| `tokenBudget` | `src/config.js` | Verified | `src/intelligence/tokenBudget.js` | Logic verified |
| `exactArtifacts` | `src/memory/exactArtifacts.js`| Verified | `src/memory/exactArtifacts.js`| |
| `knowledgeGraph` | `src/memory/knowledgeGraph.js` | Verified | `src/memory/knowledgeGraph.js` | Graph persistence verified |
| `retention` | `src/memory/retention.js` | Verified | `src/memory/retention.js` | Pruning logic verified |
| `rag` | `src/rag/` | Verified | `src/memory/rag/` | Chunker & Ingestor ported |
| `sandbox` | `src/sandbox/` | Verified | `src/infrastructure/sandbox/` | Works in-place in workspace_biz |
| `dbClient` | `src/db/client.js` | Verified | `src/db/client.js` | Connection logic verified |
| `telegramBot` | `src/telegram/bot.js` | Verified | `src/telegram/bot.js` | Basic setup implemented |
| `controlAPI` | `src/control/api.js` | Verified | `src/control/api.js` | Basic API implemented |
| `heartbeat` | N/A | Verified | `src/brain/heartbeat.js` | Service implemented |


*Status key: Pending, Auditing, Rewriting, Verified*
