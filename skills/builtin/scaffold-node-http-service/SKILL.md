# Skill: Scaffold Node HTTP Service

## Purpose
Scaffolds a clean Node.js HTTP service using Express or Fastify with ESM, Zod validation, and structured error handling.

## Trigger Phrases
- "scaffold node service"
- "create express backend"
- "new node api"

## Workflow
1. **Initialize Repo:** Setup `package.json` with `type: module`.
2. **Routing:** Create `src/routes/` and `src/controllers/` structure.
3. **Middleware:** Implement logging, error-handling, and JSON body parsing.
4. **Server Bootstrap:** Write `src/index.js` with port binding and health-checks.
5. **Verification:** Run `node --check` and start the server to verify health endpoints.

## Directives
- Use `Zod` for all request body validation.
- Enforce strict ESM (no `require`).
- Implement the "Surgeon" pattern for all subsequent route modifications.
