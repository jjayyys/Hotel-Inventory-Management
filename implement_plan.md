# Implementation Plan

This document is a docs-to-code implementation guide for the Food Waste Management project. It is written for a Windows PowerShell workflow and assumes Node.js LTS, Docker Desktop, and PostgreSQL and Redis running through Docker. AI access is backend-only and should support this provider order: `Gemini AI (Google AI Studio) -> Ollama qwen3:4b -> Ollama llama3.2`. The first implementation target is a working MVP, not the full final system in a single pass.

Use `README.md` as the primary onboarding and daily-run guide for the current repository state. This document remains the detailed phase-by-phase implementation playbook and still includes bootstrap commands that were relevant when the monorepo was first scaffolded from a docs-first starting point.

## 1. Pre-Implementation Setup

### Purpose

Validate that the local machine and repository are ready before running or extending the current implementation.

### CLI Commands

```powershell
node -v
npm -v
git --version
docker -v
docker compose version
Get-ChildItem -Force
```

### Expected Tooling Policy

- `Node.js`: current LTS release
- `npm`: bundled with the installed Node.js LTS release
- `Git`: any modern version that supports standard clone, branch, and commit workflows
- `Docker Desktop`: installed with Docker Compose v2 support

### If Missing, Install First

- Install Node.js LTS if `node` or `npm` is not available
- Install Docker Desktop if `docker` or `docker compose` is not available
- Install Git if `git` is not available

### Expected Files or Folders at This Stage

- `README.md`
- `AGENTS.md`
- `PROJECT.md`
- `project_spec.md`
- `tech_stack.md`
- `implement_plan.md`
- `apps`
- `packages`
- `docker-compose.yml`
- `Food-Waste-Project.pdf`

The repository should already contain the implemented monorepo structure for normal local development.

### Manual Notes

- No code changes should happen until all required tools are available
- If Docker is installed but not running, start Docker Desktop before moving on
- For current setup and run steps, follow `README.md` before revisiting historical bootstrap commands in later sections

### Verification Checklist

- All CLI commands run successfully
- Docker Compose responds with a version
- The current checkout contains application folders such as `apps` and `packages`
- The repository includes the root documentation set and infrastructure files needed for local development

## 2. Repository Structure

### Purpose

Reference the monorepo layout and record the bootstrap commands originally used to scaffold the frontend, backend, and shared package structure using `npm workspaces`.

### Target Structure

- `apps/web`
- `apps/api`
- `packages/shared`
- `infra`
- root workspace configuration in `package.json`

Recommended internal structure:

```text
FoodWaste/
  apps/
    web/
      src/
        app/
        components/
        features/
        lib/
        services/
        types/
      public/
    api/
      src/
        common/
        config/
        prisma/
        auth/
        users/
        hotels/
        suppliers/
        skus/
        inventory/
        recipes/
        transactions/
        waste/
        replenishment/
        recommendations/
        simulation/
        ai/
      prisma/
  packages/
    shared/
      src/
        types/
        schemas/
        constants/
  infra/
    docker/
```

### CLI Commands

These are historical bootstrap commands for rebuilding the workspace from scratch. Most contributors working in the current repository should use the setup and run workflow in `README.md` instead of rerunning this section directly.

```powershell
npm init -y
npm pkg set name="food-waste"
npm pkg set private=true
npm pkg set "workspaces[0]=apps/*"
npm pkg set "workspaces[1]=packages/*"
New-Item -ItemType Directory -Force apps, packages, infra
npx create-next-app@latest apps/web --ts --tailwind --eslint --app --src-dir --use-npm
npx @nestjs/cli new apps/api --package-manager npm
New-Item -ItemType Directory -Force packages/shared
Set-Content packages/shared/package.json '{ "name": "@food-waste/shared", "version": "1.0.0", "private": true, "main": "index.ts" }'
Get-ChildItem apps
Get-ChildItem packages
npm install
```

### Expected Files or Folders After This Step

- root `package.json`
- `apps\web`
- `apps\api`
- `packages\shared\package.json`
- `infra`
- `apps\web\src\app`
- `apps\web\src\components`
- `apps\api\src\replenishment`
- `apps\api\src\ai`
- `packages\shared\src`

### Manual Code Editing Still Required

- Add or clean up root workspace scripts in `package.json`
- Align TypeScript configuration across `apps/web`, `apps/api`, and `packages/shared`
- Normalize workspace names if generated scaffolds use inconsistent naming
- Keep deterministic inventory logic under backend domain modules and keep AI provider logic inside `apps/api/src/ai`
- Keep reusable frontend UI in `apps/web/src/components` and feature-specific UI in `apps/web/src/features`

### Directory Responsibilities

- `apps/web/src/app`: route segments, layouts, and page entrypoints for the Next.js app
- `apps/web/src/components`: reusable presentation components such as charts, tables, form inputs, and cards
- `apps/web/src/features`: feature-scoped UI for inventory, waste, recommendations, dashboard, and simulation pages
- `apps/web/src/lib` and `apps/web/src/services`: API client helpers, request wrappers, formatters, and frontend utilities
- `apps/api/src/common`: backend cross-cutting helpers such as guards, filters, interceptors, and shared utilities
- `apps/api/src/config`: environment loading and configuration validation
- `apps/api/src/prisma` and `apps/api/prisma`: Prisma module wiring, schema, migrations, and seed logic
- `apps/api/src/replenishment` and `apps/api/src/recommendations`: deterministic EOQ and reorder recommendation logic
- `apps/api/src/ai`: provider abstraction, fallback orchestration, prompt builders, and AI integrations
- `packages/shared/src`: types, schemas, and constants shared across workspaces
- `infra/docker`: Docker support files and related local infrastructure assets

### Scaffolding Note

- If the directory skeleton is created before running framework generators, verify that `Next.js` and `NestJS` scaffold commands are pointed at the intended folders and adjust the workflow if a generator expects an empty target directory

### Verification Checklist

- `apps\web` exists and contains a Next.js scaffold
- `apps\api` exists and contains a NestJS scaffold
- `packages\shared` exists
- `npm install` completes successfully from the repo root

## 3. Configuration and Environment Setup

### Purpose

Install project dependencies, define shared scripts, and create environment file templates for backend, frontend, database, Redis, and dual-provider AI integration.

### Root Script Setup

```powershell
npm pkg set scripts.dev="npm run dev:web"
npm pkg set scripts.dev:web="npm --workspace apps/web run dev"
npm pkg set scripts.dev:api="npm --workspace apps/api run start:dev"
npm pkg set scripts.build="npm --workspaces --if-present run build"
npm pkg set scripts.test="npm --workspaces --if-present run test"
npm pkg set scripts.lint="npm --workspaces --if-present run lint"
npm pkg set scripts.docker:up="docker compose up -d"
npm pkg set scripts.docker:down="docker compose down"
npm pkg set scripts.db:migrate="npm exec --workspace apps/api prisma migrate dev"
npm pkg set scripts.db:seed="npm exec --workspace apps/api prisma db seed"
```

### Backend Dependencies

```powershell
npm install -w apps/api @nestjs/config @nestjs/swagger swagger-ui-express class-validator class-transformer @prisma/client prisma @nestjs/jwt passport passport-jwt bcrypt @nestjs/passport bullmq ioredis @google/genai
npm install -w apps/api -D @types/passport-jwt @types/bcrypt
```

Windows note:

- If `bcrypt` fails to install because native build tools are unavailable, use a compatible fallback approach for the local environment before continuing with authentication implementation

### Frontend Dependencies

```powershell
npm install -w apps/web recharts
```

### Shared Package Dependency

Install this only if DTOs or shared schemas are needed across frontend and backend.

```powershell
npm install -w packages/shared zod
```

### Environment File Setup

Create the environment files:

```powershell
Set-Content .env.example @'
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/food_waste
REDIS_URL=redis://localhost:6379
JWT_SECRET=replace-with-a-secure-secret
AI_ENABLED=true
AI_PROVIDER_ORDER=gemini,ollama-qwen,ollama-llama
AI_TIMEOUT_MS=15000
AI_ALLOW_FALLBACK=true
GEMINI_API_KEY=replace-with-gemini-key
GEMINI_MODEL=gemini-2.5-flash
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_QWEN_MODEL=qwen3:4b
OLLAMA_LLAMA_MODEL=llama3.2
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
'@

Set-Content apps/api/.env @'
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/food_waste
REDIS_URL=redis://localhost:6379
JWT_SECRET=replace-with-a-secure-secret
AI_ENABLED=true
AI_PROVIDER_ORDER=gemini,ollama-qwen,ollama-llama
AI_TIMEOUT_MS=15000
AI_ALLOW_FALLBACK=true
GEMINI_API_KEY=replace-with-gemini-key
GEMINI_MODEL=gemini-2.5-flash
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_QWEN_MODEL=qwen3:4b
OLLAMA_LLAMA_MODEL=llama3.2
'@

Set-Content apps/web/.env.local @'
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
'@

Get-ChildItem . -Filter ".env*"
Get-ChildItem apps/api -Filter ".env*"
Get-ChildItem apps/web -Filter ".env*"
```

### Minimum Environment Variables

- `DATABASE_URL`
- `REDIS_URL`
- `JWT_SECRET`
- `AI_ENABLED`
- `AI_PROVIDER_ORDER`
- `AI_TIMEOUT_MS`
- `AI_HEALTH_TIMEOUT_MS`
- `AI_RETRY_ATTEMPTS`
- `AI_RETRY_DELAY_MS`
- `AI_ALLOW_FALLBACK`
- `GEMINI_API_KEY`
- `GEMINI_MODEL`
- `OLLAMA_BASE_URL`
- `OLLAMA_QWEN_MODEL`
- `OLLAMA_LLAMA_MODEL`
- `NEXT_PUBLIC_API_BASE_URL`

### Expected Files or Folders After This Step

- root `.env.example`
- `apps/api/.env`
- `apps/web/.env.local`
- updated root `package.json` scripts

### Manual Code Editing Still Required

- Add backend configuration loading using NestJS `ConfigModule`
- Add frontend API base URL consumption in the HTTP layer
- Never expose `GEMINI_API_KEY` in frontend code
- Keep all `Gemini` and `Ollama` requests in backend services only
- Implement AI provider selection and fallback through backend configuration, not frontend logic

### Verification Checklist

- Dependency installation completes successfully
- Root scripts are visible in `package.json`
- All required environment files exist
- The frontend env file only contains public-safe values
- Backend env files include both hosted and local AI configuration

## 4. Docker Compose Configuration

### Purpose

Create the local infrastructure stack for PostgreSQL and Redis using Docker Compose while allowing the frontend and backend to run directly from PowerShell during early development.

### Required Services

- `postgres`
- `redis`

Optional later additions:

- `api`
- `web`

### Docker Compose Expectations

- PostgreSQL database name: `food_waste`
- PostgreSQL username: `postgres`
- PostgreSQL password: `postgres`
- PostgreSQL port: `5432`
- Redis port: `6379`
- Use named volumes for persistence

### Example `docker-compose.yml` Content

```yaml
services:
  postgres:
    image: postgres:16
    container_name: food-waste-postgres
    environment:
      POSTGRES_DB: food_waste
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7
    container_name: food-waste-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

### CLI Workflows

```powershell
docker compose up -d
docker compose ps
docker compose logs -f postgres
docker compose logs -f redis
docker compose down
docker compose down -v
```

### Health Verification Commands

```powershell
docker compose exec postgres psql -U postgres -d food_waste -c "\dt"
docker compose exec redis redis-cli ping
```

### Expected Files or Folders After This Step

- `docker-compose.yml` in the repo root

### Manual Code Editing Still Required

- Add the compose file to the repository
- Ensure `.env` values align with compose service ports and credentials
- Keep the first runnable local setup focused on Docker for infrastructure only

### Verification Checklist

- PostgreSQL container is running
- Redis container is running
- `psql` can connect to the `food_waste` database
- Redis responds with `PONG`

## 5. Detailed Phase Implementation

### Phase 1: Foundation and Workspace Scripts

#### Purpose

Validate that the scaffolded frontend and backend run correctly before domain implementation begins.

#### CLI Commands

```powershell
npm install
npm --workspace apps/web run dev
npm --workspace apps/api run start:dev
```

#### Expected Files or Folders

- initialized workspace lockfile
- generated `node_modules`
- working `apps/web` and `apps/api` dev environments

#### Manual Code Editing Still Required

- Clean the default Next.js scaffold pages
- Add shared coding conventions
- Add root developer notes or README guidance if desired
- Configure backend CORS and initialize `ConfigModule`

#### Verification Checklist

- Frontend loads in the browser
- Backend dev server starts successfully
- Both services run correctly on CPU-only machines

### Phase 2: Prisma and Database Schema

#### Purpose

Translate the database schema from `project_spec.md` into a real Prisma schema backed by PostgreSQL.

#### CLI Commands

```powershell
npm exec --workspace apps/api prisma init -- --datasource-provider postgresql
npm exec --workspace apps/api prisma generate
npm exec --workspace apps/api prisma migrate dev --name init_schema
npm exec --workspace apps/api prisma studio
```

#### Expected Files or Folders

- `apps/api/prisma/schema.prisma`
- Prisma migration files
- generated Prisma client

#### Manual Code Editing Still Required

- Implement all models from `project_spec.md`
- Define enums, relations, UUID keys, decimal fields, JSON fields, and timestamps
- Configure Prisma client as a NestJS module or provider

#### Verification Checklist

- Prisma schema is valid
- Migration applies successfully
- Prisma client generates successfully
- Database structure matches the documented entities

### Phase 3: Mock Data Seeder

#### Purpose

Create realistic mock data to support development, testing, dashboards, and EOQ scenarios without live hotel integrations.

#### CLI Commands

```powershell
npm pkg set scripts.db:seed="npm exec --workspace apps/api prisma db seed"
npm run db:seed
npm exec --workspace apps/api prisma studio
```

#### Expected Files or Folders

- Prisma seed configuration
- seed script files under the backend workspace

#### Manual Code Editing Still Required

- Create seed implementation for hotels
- Create seed implementation for suppliers
- Create seed implementation for SKUs
- Create seed implementation for menu items and recipes
- Create seed implementation for POS transactions
- Create seed implementation for occupancy records
- Create seed implementation for waste logs
- Create seed implementation for purchase orders

#### Verification Checklist

- Seed script runs successfully
- Seeded data appears in Prisma Studio
- Mock data supports EOQ, waste, and dashboard scenarios

### Phase 4: NestJS Domain Scaffolding

#### Purpose

Generate a repeatable domain structure in the backend for core business capabilities.

#### CLI Commands

Run from the repository root if Nest workspace project targeting works:

```powershell
npx nest g module auth --project api
npx nest g module users --project api
npx nest g module hotels --project api
npx nest g module suppliers --project api
npx nest g module skus --project api
npx nest g module inventory --project api
npx nest g module recipes --project api
npx nest g module transactions --project api
npx nest g module waste --project api
npx nest g module replenishment --project api
npx nest g module recommendations --project api
npx nest g module simulation --project api
npx nest g module ai --project api
```

If `--project api` does not match the generated Nest workspace layout, run from inside `apps/api` instead:

```powershell
Set-Location apps/api
npx nest g module auth
npx nest g module users
npx nest g module hotels
npx nest g module suppliers
npx nest g module skus
npx nest g module inventory
npx nest g module recipes
npx nest g module transactions
npx nest g module waste
npx nest g module replenishment
npx nest g module recommendations
npx nest g module simulation
npx nest g module ai
Set-Location ../..
```

#### Expected Files or Folders

- backend module directories for each domain area

#### Manual Code Editing Still Required

- Create controllers and services where appropriate
- Wire `ConfigModule`, Prisma module, auth guards, and Swagger setup

#### Verification Checklist

- Backend module structure exists
- The NestJS app boots with all modules registered

### Phase 5: Authentication and RBAC

#### Purpose

Secure the application with JWT-based authentication and role-based access control.

#### CLI Commands

```powershell
npm --workspace apps/api run start:dev
```

#### Expected Files or Folders

- auth strategy files
- guards and decorators for role checks

#### Manual Code Editing Still Required

- Implement login endpoint
- Implement JWT strategy
- Implement password hashing with bcrypt
- Add role guards for `admin`, `inventory_manager`, `purchasing_staff`, `kitchen_manager`, and `analyst`

#### Verification Checklist

- Protected endpoints reject unauthenticated requests
- Role restrictions work as expected

### Phase 6: Inventory and Master Data APIs

#### Purpose

Implement the core CRUD and validation flows that support suppliers, SKUs, recipes, inventory batches, inventory movements, and waste logging.

#### CLI Commands

```powershell
npm --workspace apps/api run start:dev
```

#### Expected Files or Folders

- controllers, services, DTOs, and validation classes for master and inventory domains

#### Manual Code Editing Still Required

- Build CRUD endpoints for suppliers, SKUs, recipes, inventory batches, inventory movements, and waste logs
- Add request DTOs and validation
- Connect all persistence through Prisma
- Expose API docs through Swagger

#### Verification Checklist

- CRUD endpoints respond successfully
- Validation rejects malformed inputs
- Inventory records persist correctly
- Swagger UI documents the core API surface

### Phase 7: EOQ, ROP, and Recommendation Engine

#### Purpose

Implement the deterministic inventory optimization logic that converts mock operational data into reorder recommendations.

#### CLI Commands

```powershell
npm --workspace apps/api run test
```

#### Expected Files or Folders

- replenishment and recommendation services
- business rule tests

#### Manual Code Editing Still Required

- Implement demand aggregation from transactions and recipes
- Implement average daily usage calculations
- Implement reorder point logic
- Implement EOQ logic
- Apply safety stock handling
- Apply shelf-life and overstock-risk checks
- Persist recommendation outputs

#### Verification Checklist

- Recommendations are reproducible from known mock inputs
- EOQ and reorder-point logic are deterministic
- AI is not used in the calculation path

### Phase 8: Frontend Dashboard

#### Purpose

Build the dashboard UI for inventory visibility, waste monitoring, and recommendation review.

#### CLI Commands

```powershell
npm --workspace apps/web run dev
```

#### Expected Files or Folders

- dashboard pages
- table, chart, and filter components

#### Manual Code Editing Still Required

- Build overview dashboard
- Build inventory tables
- Build reorder alert views
- Build waste trend views
- Build SKU detail pages
- Add date filtering
- Integrate frontend with backend APIs

#### Verification Checklist

- Users can navigate dashboard pages
- Charts render correctly
- Recommendation and waste data are visible

### Phase 9: Dual-Provider AI Integration

#### Purpose

Add AI-assisted explanations and summaries without allowing the LLM to replace deterministic inventory calculations, while supporting hosted and local fallback providers.

#### CLI Commands

```powershell
ollama --version
ollama list
ollama serve
ollama pull qwen3:4b
ollama pull llama3.2

Invoke-WebRequest -Method POST `
  -Uri http://localhost:11434/api/chat `
  -Body '{"model":"qwen3:4b","messages":[{"role":"user","content":"Explain why low stock and long lead time could trigger a reorder."}],"stream":false}' `
  -ContentType "application/json"

npm --workspace apps/api run start:dev
```

On Windows, the Ollama desktop install may already start the local service automatically. If it is already running in the background, `ollama serve` may not be necessary.

#### Expected Files or Folders

- backend AI service files
- prompt templates or prompt-building helpers
- provider abstraction and provider implementation files
- provider health-check or fallback orchestration helpers
- protected provider status endpoint files

#### Manual Code Editing Still Required

- Install Ollama locally before backend integration if local fallback is required
- Implement backend AI service only
- Create a provider interface shared by all AI providers
- Implement `Gemini` provider as the first-choice hosted provider
- Implement `Ollama` provider using `OLLAMA_BASE_URL`
- Configure fallback order as `Gemini AI (Google AI Studio) -> Ollama qwen3:4b -> Ollama llama3.2`
- Build prompts using known recommendation and report data
- Build prompts from deterministic outputs, not from unrestricted raw database dumps
- Add explanation endpoints or internal service methods
- Add provider error handling, retries, and timeouts
- Add provider health checks and model-availability checks
- Keep API keys and local model access out of frontend code
- Return deterministic results even if all AI providers fail

Current implementation note:

- The current repository now includes retry-aware provider orchestration plus a protected `GET /ai/status` endpoint for provider configuration, reachability, and model-availability checks

#### Ollama Setup Workflow

1. Install Ollama for Windows using the official installer
2. Confirm the CLI is available with `ollama --version`
3. Start the local service with `ollama serve` if Ollama is not already running
4. Pull the preferred local model with `ollama pull qwen3:4b`
5. Pull the secondary fallback model with `ollama pull llama3.2`
6. Verify both models appear in `ollama list`
7. Test the local chat API at `http://localhost:11434/api/chat`
8. Configure backend `.env` values for `OLLAMA_BASE_URL`, `OLLAMA_QWEN_MODEL`, and `OLLAMA_LLAMA_MODEL`
9. Integrate the Ollama provider into the NestJS AI module
10. Verify that the backend can fall back to Ollama if Gemini is unavailable

#### Provider Orchestration Workflow

1. Deterministic business services compute recommendations, risks, and anomaly flags
2. The AI facade receives only the structured explanation context it needs
3. The facade tries the `Gemini` provider first
4. If `Gemini` fails, times out, or is disabled, the facade tries `Ollama qwen3:4b`
5. If `qwen3:4b` fails, the facade tries `Ollama llama3.2`
6. If all providers fail, the API returns deterministic results with no AI text or with a simple rule-based fallback explanation

#### Verification Checklist

- `GET /ai/status` reports provider configuration, reachability, and model availability
- Explanation text is generated from backend data
- Recommendation math is unchanged if `Gemini` fails
- `qwen3:4b` is used if `Gemini` is unavailable
- `llama3.2` is used if both `Gemini` and `qwen3:4b` are unavailable
- The application still returns deterministic results if all providers fail
- No frontend code directly uses the `Gemini` key or the `Ollama` runtime

### Phase 10: BullMQ and Redis Jobs

#### Purpose

Introduce asynchronous processing for recalculation, AI summaries, and later simulation workloads.

#### CLI Commands

```powershell
docker compose up -d redis
```

#### Expected Files or Folders

- queue configuration
- worker registration files

#### Manual Code Editing Still Required

- Configure BullMQ
- Register workers
- Add jobs for recalculation
- Add jobs for AI summaries
- Add jobs for simulation processing

#### Verification Checklist

- Heavy operations run asynchronously
- Request and response APIs remain responsive
- Redis-backed job processing is operational

### Phase 11: Simulation Features

#### Purpose

Add scenario testing for occupancy, lead time, and seasonal demand changes.

#### CLI Commands

```powershell
npm --workspace apps/api run start:dev
npm --workspace apps/web run dev
```

#### Expected Files or Folders

- simulation controllers and services
- simulation UI pages or forms

#### Manual Code Editing Still Required

- Implement scenario creation
- Implement occupancy change simulation
- Implement lead-time change simulation
- Implement seasonal demand simulation
- Persist simulation results

#### Verification Checklist

- Saved scenarios produce altered recommendations
- Simulation results are reviewable in the UI or API output

### Phase 12: Testing, QA, and Hardening

#### Purpose

Stabilize the system with automated tests, configuration validation, and reproducible local setup.

#### CLI Commands

```powershell
npm --workspaces run test
npm --workspaces run build
npm --workspaces run lint
```

#### Expected Files or Folders

- unit and integration test files
- finalized build and lint scripts

#### Manual Code Editing Still Required

- Add unit tests for EOQ and reorder-point logic
- Add integration tests for seeded end-to-end flows
- Add API tests for auth and CRUD
- Add AI guardrail tests
- Add robust error handling
- Add config validation
- Verify Dockerized infrastructure workflows

#### Verification Checklist

- Builds pass
- Tests pass
- Lint passes if configured
- The seeded environment can be recreated from scratch

## Validation Checklist

- Toolchain is installed and verified
- Docker infrastructure starts cleanly
- Workspaces install successfully
- Frontend and backend both boot
- Prisma migration succeeds
- Mock seed runs successfully
- CRUD endpoints work for core entities
- EOQ and reorder-point outputs are deterministic
- Dashboard renders seeded metrics
- Dual-provider AI explanations work without changing calculations
- Redis-backed jobs process correctly
- The project remains runnable on CPU-only environments

## Assumptions

- The plan targets this repository at `C:\Users\jjayy\Downloads\FoodWaste`
- The repository currently contains documentation only and no application source code
- Commands prioritize clarity and repeatability over minimizing steps
- `npm workspaces` is preferred over Turbo or Nx to keep initial setup simpler
- PowerShell is the primary shell for all documented commands
- Some steps require manual file editing after scaffolding, and those edits are called out explicitly rather than hidden
