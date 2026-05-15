# Food Waste Management System

This repository contains a monorepo implementation of a hotel food inventory and replenishment platform. The system focuses on reducing food waste, improving stock visibility, and generating SKU-level reorder recommendations using deterministic EOQ and reorder-point logic, with AI-assisted explanations layered on top.

Use this README as the primary onboarding and day-to-day runbook. Use [project_spec.md](./project_spec.md) for business requirements, [tech_stack.md](./tech_stack.md) for technology decisions, and [implement_plan.md](./implement_plan.md) for the phase-by-phase implementation workflow.

## Project Overview

The project is designed for hotel food and beverage operations where raw material demand shifts based on occupancy, restaurant activity, lead times, perishability, and waste patterns.

Core goals:

- reduce food waste caused by over-ordering and spoilage
- improve availability of kitchen raw materials
- generate transparent SKU-level replenishment recommendations
- support operator review through dashboards, reports, and AI-assisted explanations

Current implementation assumptions:

- phase one uses mock and seeded development data
- deterministic replenishment math remains the source of truth
- AI is used for explanation and interpretation, not for replacing EOQ calculations

## Tech Stack

- Frontend: `Next.js`, `React`, `TypeScript`, `Tailwind CSS`, `Recharts`
- Backend: `NestJS`, `TypeScript`, `class-validator`, `Swagger / OpenAPI`
- Database: `PostgreSQL`
- ORM: `Prisma`
- AI Providers: `Gemini AI (Google AI Studio)` with `Ollama` fallback
- Background Jobs: `BullMQ`, `Redis`
- Auth: `JWT`, `bcryptjs`, `RBAC`
- Tooling: `npm workspaces`, `Docker Compose`, `Jest`

## System Architecture

```text
Next.js Web App (apps/web, http://localhost:3000)
  -> calls
NestJS API (apps/api, http://localhost:3001)
  -> uses
Prisma + PostgreSQL (localhost:5433)
  -> stores
inventory, suppliers, waste, demand, recommendations, simulations

NestJS API
  -> deterministic modules
replenishment, recommendations, inventory, waste, simulation

NestJS API
  -> AI explanation layer
Gemini -> Ollama qwen3:4b -> Ollama llama3.2 -> rule-based fallback
```

Important architecture rules:

- the frontend never talks directly to Gemini, Ollama, PostgreSQL, or Redis
- recommendation math is computed in deterministic backend services first
- the AI layer receives structured recommendation context, not unrestricted raw database dumps
- if AI providers fail, the system can still return deterministic recommendation data

## Repository Structure

```text
FoodWaste/
  apps/
    api/          NestJS backend API
    web/          Next.js frontend dashboard
  packages/
    shared/       shared package workspace
  infra/          infrastructure-related files and future deployment assets
  docker-compose.yml
  README.md
  project_spec.md
  tech_stack.md
  implement_plan.md
```

## Prerequisites

Install these before running the project:

- `Node.js` current LTS
- `npm`
- `Docker Desktop` with Compose v2
- `Git`
- optional: `Ollama` if you want local AI fallback testing

Quick checks:

```powershell
node -v
npm -v
git --version
docker -v
docker compose version
```

## Environment Setup

The backend reads configuration from [apps/api/.env](./apps/api/.env). Start by copying the root example file if you do not already have a backend env file.

```powershell
Copy-Item .env.example apps/api/.env
```

Review and update at least these values in `apps/api/.env`:

```env
PORT=3001
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/food_waste
REDIS_URL=redis://localhost:6379
JWT_SECRET=replace-with-a-secure-secret
AI_ENABLED=true
AI_PROVIDER_ORDER=gemini,ollama-qwen,ollama-llama
AI_TIMEOUT_MS=15000
AI_HEALTH_TIMEOUT_MS=5000
AI_RETRY_ATTEMPTS=2
AI_RETRY_DELAY_MS=250
AI_ALLOW_FALLBACK=true
GEMINI_API_KEY=replace-with-gemini-key
GEMINI_MODEL=gemini-2.5-flash
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_QWEN_MODEL=qwen3:4b
OLLAMA_LLAMA_MODEL=llama3.2
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
```

Notes:

- keep API keys in backend env files only
- do not commit `.env` files
- if you are not using Ollama yet, leave the values in place but treat local AI fallback as optional

## First-Time Setup

### 1. Install dependencies

```powershell
npm install
```

### 2. Start local infrastructure

```powershell
docker compose up -d
```

Or use the root workspace helper:

```powershell
npm run docker:up
```

Verify containers:

```powershell
docker compose ps
```

Expected local services:

- PostgreSQL on `localhost:5433`
- Redis on `localhost:6379`

### 3. Run database migrations

```powershell
npm exec --workspace apps/api prisma migrate dev
```

Or:

```powershell
npm run db:migrate
```

### 4. Seed development data

```powershell
npm exec --workspace apps/api prisma db seed
```

Or:

```powershell
npm run db:seed
```

### 5. Start the API

Open a terminal and run:

```powershell
npm --workspace apps/api run start:dev
```

Or:

```powershell
npm run dev:api
```

### 6. Start the frontend

Open a second terminal and run:

```powershell
npm --workspace apps/web run dev
```

Or:

```powershell
npm run dev:web
```

Note:

- `npm run dev` currently starts only the web app
- use separate terminals for `dev:api` and `dev:web`

## Daily Development Workflow

For regular local development:

1. Start Docker if it is not already running.
2. Run `docker compose up -d`.
3. Start the API with `npm run dev:api`.
4. Start the web app with `npm run dev:web`.
5. Re-run `npm run db:migrate` after schema changes.
6. Re-run `npm run db:seed` if you need a fresh local dataset.

## Local URLs and Ports

- Frontend: `http://localhost:3000`
- API base URL: `http://localhost:3001`
- Swagger docs: `http://localhost:3001/api/docs`
- PostgreSQL: `localhost:5433`
- Redis: `localhost:6379`
- Ollama local API: `http://localhost:11434`

## Seeded Development Users

After running the seed, you can use these local-only credentials:

- Admin: `admin@azurebay.example` / `Admin123!`
- Analyst: `analyst@azurebay.example` / `Analyst123!`

These credentials come from the local seed script and should never be reused outside development.

## AI Provider Notes

The current provider order is:

1. `Gemini AI (Google AI Studio)`
2. `Ollama qwen3:4b`
3. `Ollama llama3.2`
4. rule-based fallback if all providers fail

Verification tips:

- keep `GEMINI_API_KEY` and `GEMINI_MODEL` in `apps/api/.env`
- use the protected `GET /ai/status` endpoint to verify provider configuration, reachability, and model availability before testing explanation generation
- the explanation endpoint is backend-only and requires auth
- a fresh explanation response should return `provider: "gemini"` when Gemini is working
- `provider: "cached"` means an existing explanation was returned
- `provider: "rule-based-fallback"` means the system stayed functional but did not get a live AI response
- transient provider failures can be retried automatically based on `AI_RETRY_ATTEMPTS` and `AI_RETRY_DELAY_MS`

Suggested verification flow:

```powershell
Invoke-RestMethod -Method GET `
  -Uri http://localhost:3001/ai/status `
  -Headers @{ Authorization = "Bearer YOUR_JWT" }
```

What to look for:

- `healthy: true` for `gemini` when your Google AI Studio key and model are valid
- `modelAvailable: true` for `ollama-qwen` and `ollama-llama` when those models are pulled locally
- `fallbackEnabled: true` and the expected provider order

## Useful Commands

Root workspace commands:

```powershell
npm run dev:web
npm run dev:api
npm run build
npm run test
npm run lint
npm run docker:up
npm run docker:down
npm run db:migrate
npm run db:seed
```

Direct workspace commands:

```powershell
npm --workspace apps/api run build
npm --workspace apps/api run test
npm --workspace apps/api run start:dev
npm --workspace apps/web run dev
npm --workspace apps/web run build
```

## Troubleshooting

### Prisma `ECONNREFUSED`

If the API fails with a Prisma connection error, PostgreSQL is usually not running or not reachable on `localhost:5433`.

Check:

```powershell
docker compose ps
Test-NetConnection localhost -Port 5433
```

### `401 Unauthorized`

Protected endpoints such as recommendation explanation routes require a valid JWT. Log in first through `/auth/login`.

### AI provider fallback

If Gemini is misconfigured, the app may still succeed by falling back to Ollama or to the rule-based explanation path. That is expected behavior, but it means your live Gemini configuration still needs attention.

### Stale explanation responses

If you keep seeing `provider: "cached"`, call the explanation endpoint with `?refresh=true`.

## Documentation Map

- [README.md](./README.md): onboarding, setup, run commands, troubleshooting, and local developer workflow
- [project_spec.md](./project_spec.md): business scope, requirements, user roles, workflows, and domain rules
- [tech_stack.md](./tech_stack.md): selected technologies, architecture rationale, and runtime compatibility
- [implement_plan.md](./implement_plan.md): phased implementation playbook and command-by-command build guidance

## Documentation Sync Policy

When the project changes, review these four documents together:

- `README.md`
- `project_spec.md`
- `tech_stack.md`
- `implement_plan.md`

At minimum:

- update `README.md` when setup steps, commands, ports, credentials, or onboarding workflow change
- update `project_spec.md` when requirements, scope, business rules, or workflows change
- update `tech_stack.md` when providers, infrastructure, runtime assumptions, or architecture choices change
- update `implement_plan.md` when the build sequence, implementation phases, or verification workflow change
