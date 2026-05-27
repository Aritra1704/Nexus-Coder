# Skill: Scaffold Python FastAPI

## Purpose
Scaffolds a production-ready Python FastAPI service with Pydantic v2, SQLAlchemy 2.0, and a standard directory structure.

## Trigger Phrases
- "scaffold fastapi app"
- "create python backend"
- "new fastapi service"

## Workflow
1. **Init Directory:** Create project root and basic folders (`app/`, `tests/`, `migrations/`).
2. **Configure Environment:** Create `requirements.txt` or `pyproject.toml` with `fastapi`, `uvicorn`, `pydantic`, and `sqlalchemy`.
3. **App Bootstrap:** Write `app/main.py` with initial health-check endpoint.
4. **Verification:** Run `python -m py_compile` to verify syntax.

## Directives
- Use `write_file` for initialization.
- Default to `uv` for package management if available.
- Always include a Dockerfile for containerization.
