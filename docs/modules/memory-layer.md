# Module Design: Memory Layer (`src/memory/`)

## 1. Purpose
The Memory Layer allows Arnold to persist its experiences beyond a single session. It manages:
- **Exact Artifacts:** Verbatim storage of decisions/artifacts.
- **Knowledge Graph:** Connections between concepts, tasks, and files.
- **Retention/Pruning:** Auto-managing storage to ensure relevance.

## 2. Component Specifications

### 2a. ExactArtifacts (`src/memory/exactArtifacts.js`)
- **Responsibility:** Persistent, queryable storage of task outcomes and decisions.
- **Logic:** Map `taskId` -> `artifact_type` -> `data`. Supports superseding artifacts.

### 2b. KnowledgeGraph (`src/memory/knowledgeGraph.js`)
- **Responsibility:** Structural relationships between concepts/tasks.
- **Logic:** Nodes (Tasks, Files, Learnings), Edges (DependsOn, Implements).

### 2c. Retention (`src/memory/retention.js`)
- **Responsibility:** Pruning stale or irrelevant memories.
- **Logic:** Time-to-Live (TTL) based on last access.

## 3. Implementation Plan
1. Implement `src/memory/exactArtifacts.js`.
2. Port knowledge graph logic (`graphifyAdapter.js` + `knowledgeGraph.js`).
3. Port retention logic (`retention.js`).

## 4. Testing Strategy
- **Artifacts:** CRUD verification for artifact types.
- **Graph:** Verify node/edge creation and transversal.
- **Retention:** Verify TTL-based deletion.
