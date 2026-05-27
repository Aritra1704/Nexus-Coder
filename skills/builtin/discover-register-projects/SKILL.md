# Skill: Discover and Register Projects

## Purpose
Scans the workspace directory to identify potential project roots and registers them with the Arnold orchestrator for management.

## Trigger Phrases
- "discover projects"
- "register existing repo"
- "find my apps"

## Workflow
1. **Scan Dir:** List all directories in the `workspace_biz` root.
2. **Identify Roots:** Look for markers like `.git`, `package.json`, or `requirements.txt`.
3. **Context Extraction:** Read `README.md` and `HLD.md` to understand the project intent.
4. **Registration:** Call the `register_project` tool to add them to Arnold's database.

## Directives
- Use `Ollama` to summarize identified project intents.
- Do not register nested sub-directories unless explicitly requested.
