# Module Design: Retention (`src/memory/retention.js`)

## 1. Purpose
The `Retention` module automatically prunes stale data from `memory/artifacts/` and `memory/graph.json` to prevent memory bloat, based on Time-to-Live (TTL) policies defined in `config.js`.

## 2. Component Specifications
- **Logic:**
  - `pruneArtifacts(maxAgeDays)`: Iterates through artifact files and deletes those older than `maxAgeDays`.
  - `pruneGraph(maxAgeDays)`: (Future) Prune stale nodes/edges from `graph.json`.
- **Testing:** 
  - Verify artifact deletion based on file modification time.

## 3. Implementation Plan
1. Implement `src/memory/retention.js` using `fs.stat` and `fs.rm`.
2. Create unit tests in `src/memory/tests/retention.test.js`.

## 4. Testing Strategy
- Create dummy files with old modification times.
- Run `pruneArtifacts`.
- Verify dummy files are deleted while newer files remain.
