# Module Design: Knowledge Graph (`src/memory/knowledgeGraph.js`)

## 1. Purpose
The `KnowledgeGraph` manages complex relationships between project entities: Tasks, Files, Learnings, and Artifacts. It enables Arnold to query dependencies (e.g., "Which tasks must complete before implementing Task X?").

## 2. Component Specifications
- **Nodes:** Unique entities (Task IDs, File paths, Learning IDs).
- **Edges:** Semantic relationships (DependsOn, Implements, LearnsFrom, Modifies).
- **Storage:** JSON file-based graph (`memory/graph.json`) for foundational simplicity.

## 3. Implementation Plan
1. Implement `src/memory/knowledgeGraph.js` with `addNode`, `addEdge`, and `getDependencies`.
2. Create unit tests in `src/memory/tests/knowledgeGraph.test.js`.

## 4. Testing Strategy
- **Graph Construction:** Verify node and edge creation.
- **Dependency Query:** Verify that traversing the graph returns the correct dependent nodes.
- **Persistence:** Verify graph is saved to disk and can be reloaded.
