# Skill: Create Scaffold Skill

## Purpose
Enables Arnold to create new scaffolding skills for specific frameworks or languages by generating the necessary `SKILL.md` and associated templates.

## Trigger Phrases
- "create new scaffold skill"
- "generate framework skill"
- "teach me how to scaffold X"

## Workflow
1. **Define Pattern:** Identify the standard structure and dependencies for the target technology.
2. **Generate SKILL.md:** Create the skill definition in a new `skills/` subdirectory.
3. **Add Templates:** Populate a `templates/` folder with standard boilerplate files.
4. **Self-Register:** Register the new skill with the `SkillManager`.

## Directives
- Ensure the new skill follows the Arnold `SKILL.md` standard.
- Use `Ollama` to generate the initial boilerplate patterns.
