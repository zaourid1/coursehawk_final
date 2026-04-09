---
title: Make project portable & Vercel-ready
---
# Make Project Portable & Vercel-Ready

## What & Why

The project currently depends on several platform-specific integrations that
prevent it from running outside this environment. This task removes all of those
dependencies and replaces them with standard, portable equivalents so the code can
be cloned into any IDE, pushed to Git, and deployed to Vercel without modification.

Specific problems to fix:
- Authentication uses Replit's OpenID Connect (requires `REPL_ID` / `ISSUER_URL`), which only works here.
- OpenAI is accessed through a platform proxy (`AI_INTEGRATIONS_OPENAI_API_KEY` / `AI_INTEGRATIONS_OPENAI_BASE_URL` / model `gpt-5.1`), which is not a standard model name.
- The Vite build includes three Replit-only dev plugins (`@replit/vite-plugin-runtime-error-modal`, `@replit/vite-plugin-cartographer`, `@replit/vite-plugin-dev-banner`) and a `REPL_ID` env-var check.
- There is no `vercel.json`, no Vercel API entry point, and no README.

## Done looks like

- `npm install && npm run dev` works in any Node 20 environment given a `.env` file with `DATABASE_URL`, `SESSION_SECRET`, and `OPENAI_API_KEY`.
- `npm run build` produces a deployable `dist/` folder.
- Pushing the repo to GitHub and importing it into Vercel results in a working deployment — API routes served as a serverless function, frontend served as static files.
- A `README.md` exists at the root explaining setup, environment variables, local development, and Vercel deployment — with no mention of Replit anywhere.
- All Replit-specific packages are removed from `package.json`.

## Out of scope

- Switching databases (PostgreSQL via `DATABASE_URL` stays).
- Changing any UI pages or features.
- Adding CI/CD pipelines beyond Vercel.
- Switching to a different AI provider.

## Tasks

1. **Replace Replit Auth with email/password auth** — Remove the Replit OIDC strategy from `server/replit_integrations/auth/replitAuth.ts`. Implement standard session-based auth (bcrypt + express-session) with `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/logout`, and `GET /api/auth/user` endpoints. Update the `users` table to store `email` and `passwordHash` (add migration-safe columns). Update `server/replit_integrations/auth/routes.ts` and `server/replit_integrations/auth/storage.ts` to use the new logic. Update `client/src/hooks/use-auth.ts` and the frontend landing/login flow to show an email + password form instead of an OAuth redirect button.

2. **Fix OpenAI integration** — In `server/routes.ts`, change `AI_INTEGRATIONS_OPENAI_API_KEY` → `OPENAI_API_KEY`, remove the `baseURL` override, and change the model from `gpt-5.1` to `gpt-4o`.

3. **Remove Replit Vite plugins** — In `vite.config.ts`, remove `@replit/vite-plugin-runtime-error-modal`, `@replit/vite-plugin-cartographer`, `@replit/vite-plugin-dev-banner`, and the `REPL_ID` env-var check. Remove those three packages from `devDependencies` in `package.json`.

4. **Add Vercel deployment config** — Create `vercel.json` at the project root that routes `/api/*` to the Express server as a serverless function and serves the built client from `dist/public`. Create `api/index.ts` that imports and exports the Express app (without calling `listen()`) so Vercel's Node.js runtime can wrap it. Adjust `server/index.ts` so it only calls `httpServer.listen()` when run directly (not when imported as a module).

5. **Create README.md** — Write a comprehensive `README.md` at the project root covering: project overview, tech stack, environment variables table, local development steps, database setup (`npm run db:push`), and Vercel deployment steps. No mention of Replit anywhere.

## Relevant files

- `server/replit_integrations/auth/replitAuth.ts`
- `server/replit_integrations/auth/routes.ts`
- `server/replit_integrations/auth/storage.ts`
- `server/replit_integrations/auth/index.ts`
- `server/routes.ts`
- `server/index.ts`
- `server/storage.ts`
- `shared/schema.ts`
- `shared/models/auth.ts`
- `client/src/hooks/use-auth.ts`
- `client/src/App.tsx`
- `vite.config.ts`
- `package.json`
- `script/build.ts`