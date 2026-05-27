# Skill: Add Deploy Readiness Notes

## Purpose
Analyzes a project's implementation status and generates a markdown report detailing its readiness for production deployment (Railway, Vercel, etc.).

## Trigger Phrases
- "check deploy readiness"
- "can i ship this"
- "production audit"

## Workflow
1. **Infrastructure Audit:** Verify presence of `Dockerfile`, `docker-compose.yml`, or provider-specific manifests.
2. **Security Scan:** Check for hardcoded secrets and basic vulnerabilities.
3. **Environment Check:** Ensure `.env.example` is complete and matches project needs.
4. **Documentation Check:** Verify presence of up-to-date `README.md` and `HLD.md`.
5. **Report Generation:** Create `docs/DEPLOY_READINESS.md`.

## Directives
- Use `Gemini Pro` for the final deployment audit.
- Be blunt about security risks (secrets in code = failure).
