# Module Design: Persona (`src/infrastructure/persona/`)

## 1. Purpose
The `Persona` module defines surgical-orchestrator's identity, communication style, and high-signal notification formatting. It ensures that surgical-orchestrator remains a professional, precise, and non-chatty "Coding Architect."

## 2. Component Specifications
- **Persona Settings (`settings.js`):** Defines verbosity levels and teaching depth for different channels (Telegram, UI, GitHub).
- **Narrative Engine (`narrative.js`):** Transforms raw execution data (task status, tool results) into concise, professional updates.
- **Soul Integration:** Syncs with `src/memory/soul.md` to maintain behavioral consistency.

## 3. Implementation Plan
1. Implement `src/infrastructure/persona/settings.js` with default configurations.
2. Implement `src/infrastructure/persona/narrative.js` for high-signal task summaries.
3. Create unit tests in `src/infrastructure/persona/tests/`.

## 4. Testing Strategy
- **Settings:** Verify default values and normalization logic.
- **Narrative:** Verify that task results are correctly summarized into professional, non-chatty text.
