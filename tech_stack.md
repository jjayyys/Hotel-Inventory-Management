# Technology Stack Document

## 1. Purpose of This Document

This document defines the selected technology stack for the Hotel Food Waste Management system and explains how each technology contributes to the system. It turns the high-level recommendations in `project_spec.md` into a concrete implementation direction for development.

Use `README.md` for local setup and daily run commands. This document remains the source of truth for stack choices, architecture rationale, and runtime assumptions.

The selected stack is designed to support:

- A web-based dashboard for hotel inventory operations
- EOQ and reorder-point calculations by SKU
- Mock-data-driven development in phase one
- AI-assisted insights using a dual-provider LLM layer with `Gemini AI (Google AI Studio)` as primary and `Ollama` as local fallback
- Future expansion into production-grade integrations and scheduling

## 2. Selected Technology Stack

### Frontend

- `Next.js`
- `TypeScript`
- `Tailwind CSS`
- `Recharts`

### Backend

- `NestJS`
- `TypeScript`
- `class-validator`
- `class-transformer`
- `Swagger / OpenAPI`

### Database and Data Access

- `PostgreSQL`
- `Prisma`

### AI Integration

- `Gemini AI (Google AI Studio)`
- `Ollama`

### Background Processing

- `BullMQ`
- `Redis`

### Authentication and Security

- `JWT`
- `bcryptjs`
- Role-Based Access Control (`RBAC`)

### DevOps and Deployment

- `Docker`
- `Docker Compose`
- Environment-based configuration using `.env`

### Testing

- `Jest`
- `Supertest`

## 3. Why This Stack Fits the Project

This project is not just a CRUD application. It includes:

- inventory master data
- stock movement tracking
- replenishment calculations
- waste analysis
- dashboard reporting
- AI-generated explanations
- background recomputation and simulation support

Because of that, the stack must handle both standard web application needs and structured business logic. The chosen technologies are strong in exactly those areas while remaining practical for a mock-data-first first release.

### Suggested Project Structure

The selected stack fits best as a monorepo with dedicated frontend, backend, shared, and infrastructure directories.

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

Why this structure fits the stack:

- `apps/web` keeps `Next.js` route files, reusable UI, and feature-specific dashboard code together
- `apps/api` keeps `NestJS` modules, Prisma integration, auth, and AI orchestration separate from UI concerns
- `packages/shared` gives `TypeScript` types and validation schemas one reusable home
- `infra/docker` keeps container and local environment support files out of application code
- The structure cleanly separates deterministic replenishment logic from AI explanation logic

## 4. Contribution of Each Technology

### 4.1 Next.js

`Next.js` is the frontend framework for building the web application interface.

Its contribution to the system:

- Builds dashboard pages for inventory, waste, and reorder recommendations
- Supports forms for SKU, supplier, and simulation inputs
- Organizes routes cleanly for admin and operations workflows
- Provides a strong development experience for a modern internal business application

Why it was selected:

- It is a mature React framework with clear structure
- It works well for dashboard-style applications
- It supports long-term growth if the project later needs more advanced frontend behavior

### 4.2 TypeScript

`TypeScript` is used across both frontend and backend.

Its contribution to the system:

- Reduces errors in data-heavy business logic
- Improves safety for API contracts, inventory models, and calculation inputs
- Makes the codebase easier to maintain as more entities and workflows are added

Why it was selected:

- This project includes many structured entities such as SKUs, recipes, transactions, suppliers, and recommendations
- Strong typing is especially valuable when implementing EOQ, reorder-point, and simulation logic

### 4.3 Tailwind CSS

`Tailwind CSS` is used for styling the frontend UI.

Its contribution to the system:

- Speeds up building dashboard layouts, tables, forms, and metric cards
- Helps maintain a consistent visual system
- Supports responsive design for desktop and tablet usage

Why it was selected:

- It is efficient for building internal tools and operational dashboards
- It reduces the overhead of maintaining large custom CSS files in early development

### 4.4 Recharts

`Recharts` is used for data visualization in the dashboard.

Its contribution to the system:

- Displays waste trends over time
- Visualizes stock levels, reorder alerts, and consumption patterns
- Helps managers interpret historical and simulated inventory changes

Why it was selected:

- The project needs clear business charts more than complex custom graphics
- Recharts integrates smoothly with React-based applications

### 4.5 NestJS

`NestJS` is the main backend framework.

Its contribution to the system:

- Exposes API endpoints for inventory, suppliers, dashboard data, simulations, and recommendations
- Organizes business logic into modules, controllers, and services
- Provides a clean structure for separating EOQ calculations, AI orchestration, authentication, and reporting

Why it was selected:

- The system includes more than simple data storage
- NestJS is well-suited for complex domain logic and modular service design
- It supports maintainability as the application grows

### 4.6 class-validator and class-transformer

These libraries support request validation and data transformation in NestJS.

Their contribution to the system:

- Validate incoming API payloads for SKUs, suppliers, recipes, stock movements, and simulation parameters
- Prevent invalid values from entering the business logic layer
- Improve data quality before calculations are performed

Why they were selected:

- Inventory and planning systems are sensitive to bad inputs
- Validation is essential when the system handles units, quantities, dates, lead times, and cost fields

### 4.7 Swagger / OpenAPI

`Swagger / OpenAPI` is used for API documentation.

Its contribution to the system:

- Documents API endpoints for frontend and backend coordination
- Makes it easier to test and review the system during development
- Helps future contributors understand the available operations quickly

Why it was selected:

- This project will likely evolve across several phases
- Clear API documentation reduces confusion and speeds up development

### 4.8 PostgreSQL

`PostgreSQL` is the primary relational database.

Its contribution to the system:

- Stores inventory, suppliers, recipes, POS-like transactions, occupancy records, waste logs, and recommendations
- Supports relational integrity across the project’s core data model
- Provides reliable querying for reports and dashboard summaries

Why it was selected:

- The project has a strongly relational schema
- It needs reliable historical records and traceability
- PostgreSQL is a strong fit for transactional business systems

### 4.9 Prisma

`Prisma` is the ORM and schema management layer.

Its contribution to the system:

- Maps application models to PostgreSQL tables
- Simplifies database queries from the backend
- Supports migrations and mock-data seeding
- Improves development speed while keeping data access organized
- Works with Prisma ORM v7 configuration through `prisma.config.ts`
- Uses the PostgreSQL driver adapter `@prisma/adapter-pg` with `pg` for runtime database access

Why it was selected:

- The project starts with mock data and will benefit from an efficient seeding workflow
- Prisma works well with TypeScript and relational schemas

Implementation note:

- In Prisma ORM v7, the database connection URL is configured in `prisma.config.ts` instead of the Prisma schema file
- The backend runtime should instantiate Prisma Client using the PostgreSQL adapter rather than relying on the legacy direct constructor flow

### 4.10 Gemini AI and Ollama

The AI layer should use a provider abstraction with this priority order:

1. `Gemini AI (Google AI Studio)`
2. `Ollama qwen3:4b`
3. `Ollama llama3.2`

`Gemini AI (Google AI Studio)` is the primary hosted provider and `Ollama` is the local fallback runtime for AI-assisted analysis.

Its contribution to the system:

- Generates explanations for reorder recommendations
- Summarizes waste and demand patterns
- Explains unusual consumption or anomaly scenarios that were first detected by deterministic backend logic
- Helps non-technical users understand why the system is making certain suggestions
- Keeps AI delivery resilient by allowing fallback from hosted inference to local inference

What it does not do:

- It does not replace EOQ calculations
- It does not make hidden procurement decisions
- It does not become the source of truth for inventory quantities
- It does not become the only mechanism used to identify anomalies or stock risks

Why it was selected:

- The project requires AI support for interpretation and explanation
- `Gemini AI (Google AI Studio)` provides a strong first-choice hosted provider for readable business explanations
- `Ollama` provides a practical local fallback for development, offline testing, or hosted-provider failure
- The deterministic inventory logic remains in the backend regardless of which provider writes the explanation

Recommended local models:

- Primary local model: `qwen3:4b`
- Secondary local fallback: `llama3.2`

Implementation note:

- The backend should expose one AI service to the rest of the application and hide provider selection behind that service
- Prompts, response parsing, timeouts, and output validation should be shared across providers where possible
- Provider health checks, model-availability checks, and retry policy should stay centralized in the backend AI orchestration layer
- A protected backend status endpoint should make provider verification possible without exposing any provider secrets to the frontend
- If all providers fail, the API should still return deterministic recommendation results without blocking the user flow

### 4.11 BullMQ and Redis

`BullMQ` with `Redis` is used for background job processing.

Its contribution to the system:

- Schedules recalculation of recommendations
- Runs batch simulations or periodic aggregation jobs
- Supports asynchronous AI analysis so long-running LLM calls do not block user requests
- Enables future scaling if the system begins processing larger datasets

Why it was selected:

- This system has jobs that are better handled outside of immediate API requests
- AI summarization and report regeneration are good candidates for queued processing

Phase-one note:

- If the early version stays very small, some scheduled tasks can begin with simpler cron-style execution before expanding into full queue-based workflows

### 4.12 JWT, bcryptjs, and RBAC

These technologies handle authentication and authorization.

Their contribution to the system:

- Authenticate users securely
- Protect inventory and purchasing operations
- Restrict access based on roles such as Admin, Inventory Manager, Purchasing Staff, and Analyst

Why they were selected:

- The system contains operational and cost-related data
- Different user groups need different levels of access

### 4.13 Docker and Docker Compose

`Docker` and `Docker Compose` are used for local environment consistency and deployment packaging.

Their contribution to the system:

- Standardize local development setup
- Simplify running frontend, backend, database, and Redis together
- Reduce environment mismatch across team members

Why they were selected:

- The project includes several services that should run consistently in development
- Containers make onboarding and deployment easier

Runtime compatibility note:

- Container images and deployment choices should favor compatibility with both `amd64` and `arm64` systems where practical
- The default stack should run correctly on standard CPU-only environments without requiring GPU hardware

### 4.14 Environment-Based Configuration

Environment variables stored in `.env` files will manage configurable settings.

Their contribution to the system:

- Separate secrets and environment-specific configuration from source code
- Store settings such as database connection strings, JWT secrets, Redis URLs, Gemini API keys, and Ollama endpoint and model names

Why it was selected:

- This is standard practice for secure and maintainable application configuration

### 4.15 Jest and Supertest

These tools support automated testing.

Their contribution to the system:

- Verify EOQ and reorder-point logic
- Test API endpoints and validation rules
- Reduce regression risk as the system grows

Why they were selected:

- Inventory optimization logic must be reliable
- Automated tests are especially important for financial and operational calculations

## 5. Runtime Compatibility Across CPU, GPU, and MPS

The current architecture is designed to be fully functional on `CPU` by default. This is important because the primary hosted AI path uses `Gemini AI`, which performs the model inference externally rather than requiring local GPU execution.

### What this means for the current system

- `Next.js`, `NestJS`, `PostgreSQL`, `Redis`, and `Prisma` do not require local GPU acceleration
- The web application should run correctly on Windows, macOS, and Linux development environments as long as the required services are available
- Apple Silicon systems should be supported through standard `arm64`-compatible runtime and container choices
- NVIDIA GPU-equipped systems can run the application normally, even if the core system does not actively depend on GPU acceleration
- Optional local AI through `Ollama` should still be treated as a non-core enhancement path and must degrade safely to CPU where needed

### Hardware strategy

- `CPU` is the default and guaranteed execution path
- `GPU` is optional and should be used only by future local compute modules that explicitly support it
- `MPS` is optional and should be considered for Apple Silicon if future local AI or analytics modules need hardware acceleration

### Rule for future local compute modules

If the project later adds local model inference, embeddings, or accelerated forecasting, those modules should detect and use the best available device in this order:

1. `GPU`
2. `MPS`
3. `CPU`

This prevents the project from becoming locked to one hardware vendor or one operating system.

### Design guardrails

- No core application logic should depend on CUDA-only libraries
- Any future accelerated module should expose a CPU fallback path
- Docker and deployment scripts should avoid assumptions that only work on one processor architecture
- The AI layer should stay isolated behind backend services so the rest of the application remains hardware-agnostic whether it uses `Gemini AI` or `Ollama`

## 6. How the Stack Supports Input -> Process -> Output

### Input Layer

The input side of the system includes mock inventory data, POS-like transactions, occupancy signals, supplier parameters, and manual configuration inputs.

Technologies involved:

- `Next.js` provides forms and management screens
- `NestJS` receives and validates requests
- `class-validator` and `class-transformer` ensure valid payloads
- `PostgreSQL` stores structured input data
- `Prisma` manages data access

### Process Layer

The processing layer converts business inputs into inventory decisions.

Technologies involved:

- `NestJS` hosts the optimization and business rule services
- `Prisma` loads transactional and master data needed for calculations
- `PostgreSQL` stores intermediate and historical records
- `BullMQ` and `Redis` support scheduled recalculation or asynchronous processing
- `Gemini AI` or `Ollama` generates explanations and analytical summaries after core calculations are complete

### Output Layer

The output side of the system includes reorder alerts, dashboard metrics, trend analysis, and AI-generated explanations.

Technologies involved:

- `NestJS` exposes recommendation and report endpoints
- `Next.js` renders dashboard pages and tables
- `Recharts` visualizes trends and business metrics
- `Gemini AI` or `Ollama` provides natural-language insights

## 7. Security Considerations

The selected stack supports several important security needs:

- `JWT` protects authenticated access
- `RBAC` limits sensitive operations by role
- `bcryptjs` securely hashes passwords for storage while avoiding native build issues in local Windows development environments
- `.env` configuration helps keep API keys and secrets out of source control
- `NestJS` validation reduces the chance of malformed data entering the system

The Gemini API key must be stored securely and never exposed in frontend code. All LLM calls should be made through the backend. If `Ollama` is used, its local endpoint should also remain backend-only so the frontend never talks directly to the model runtime.

## 8. Scalability and Maintainability

This stack supports the project’s future growth in several ways:

- The modular `NestJS` structure makes it easier to add forecasting, supplier optimization, or multi-property support
- `PostgreSQL` can handle larger historical datasets and more reporting needs
- `BullMQ` allows heavier background workflows as usage grows
- `Prisma` keeps schema evolution manageable
- `Next.js` supports expansion of the dashboard into more advanced operational pages

## 9. Phase-One Development Notes

Because phase one uses mock data, the stack should be implemented pragmatically.

Recommended priorities:

1. Build the database schema and seed mock data
2. Implement inventory, recipe, and transaction APIs
3. Build EOQ and reorder-point services
4. Build dashboard views and reporting pages
5. Add dual-provider AI explanations after deterministic logic is stable
6. Add queue-based background processing for scheduled recalculation if needed

This keeps the project focused on correctness before adding more advanced AI and job-processing behavior.

## 10. Future Upgrade Path

The chosen stack leaves room for future improvements:

- Replace mock data with real POS or hotel system integrations
- Expand the AI layer with richer recommendation workflows or stronger local model options
- Add supplier portal or procurement approval features
- Introduce more advanced forecasting models
- Support multi-hotel operations from the same platform

## 11. Conclusion

This technology stack balances practicality, maintainability, and future growth. It supports the system’s most important needs: reliable inventory data management, transparent EOQ-based replenishment logic, useful dashboards, and AI-assisted explanations through a dual-provider AI layer with `Gemini AI (Google AI Studio)` as primary and `Ollama` as local fallback.

The result is a stack that is strong enough for a real implementation while still appropriate for a mock-data-first development phase.
