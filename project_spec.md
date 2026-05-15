# Project Specification

## 1. Project Overview

This project is a web-based food inventory management system for hotel food and beverage operations. Its main purpose is to reduce food waste, improve ingredient availability, and optimize replenishment decisions for raw materials by SKU using the Economic Order Quantity (EOQ) model.

The system is intended to support hotel kitchen and inventory teams by combining inventory records, estimated consumption, purchasing parameters, and operational business signals such as occupancy and restaurant activity. It also includes an AI-assisted analysis layer to help explain recommendations, summarize unusual patterns, and improve decision-making efficiency through a provider-abstracted LLM integration.

Use `README.md` for local setup and day-to-day development commands. This document remains the source of truth for product scope, workflows, and business requirements.

For the initial version of this project, the system will use mock data instead of live integrations from POS systems, hotel PMS systems, or supplier platforms.

## 2. Problem Statement

Hotels face recurring food waste and stock planning issues because raw material usage changes frequently based on occupancy, restaurant traffic, menu demand, lead times, and perishability. Overstocking increases spoilage and storage cost, while understocking reduces service availability and disrupts kitchen operations.

The business problem is to determine how much of each raw material should be ordered, and when, in a way that balances:

- Inventory holding cost
- Ordering cost
- Food deterioration and waste
- Supplier lead time risk
- Service continuity for guests

The project must estimate replenishment by SKU using EOQ-based logic while accounting for real-world hotel inventory factors such as safety stock, demand variability, seasonal demand, and quantity discounts.

## 3. Goals and Objectives

### Business Goals

- Reduce food waste caused by over-ordering and spoilage
- Improve availability of raw materials for hotel food service
- Lower total inventory management cost
- Improve purchasing decisions through data-driven recommendations

### Project Objectives

- Build a web application for hotel raw material inventory management
- Calculate EOQ and reorder point at the SKU level
- Estimate consumption using operational demand signals
- Provide dashboard visibility into food cost, waste, and inventory status
- Use AI support to analyze transactions and explain recommendations
- Support simulation of replenishment decisions before purchase execution

## 4. Scope

### In Scope

- Hotel food and beverage raw material inventory tracking
- SKU-level replenishment planning
- EOQ and reorder point calculations
- Safety stock and lead time handling
- Demand estimation using mock POS and occupancy-like data
- Dashboard views for inventory, waste, and ordering insights
- AI-generated analytical summaries and explanations

### Out of Scope for Initial Version

- Direct integration with real POS systems
- Direct integration with hotel property management systems
- Direct integration with supplier ordering systems
- Automatic purchase order submission to suppliers
- Multi-property enterprise orchestration beyond mock support

## 5. Assumptions and Constraints

### Assumptions

- Phase one uses mock data for all business inputs
- Each raw material is tracked as a unique SKU
- Menu demand can be approximated from mock transaction data
- Supplier lead times and order costs can be configured manually
- The system uses deterministic EOQ calculations, while AI provides support and explanation rather than replacing the core formula

### Constraints

- Source materials provide high-level intent but not a full implementation design
- Some business rules must be defined as engineering assumptions
- Perishable inventory may not fit classical EOQ perfectly, so shelf-life and waste constraints must be included in the design

## 6. Stakeholders and User Roles

### Stakeholders

- Hotel management
- Inventory managers
- Kitchen managers or chefs
- Purchasing staff
- Operations analysts

### User Roles

- `Admin`: manages users, system settings, and master data
- `Inventory Manager`: reviews stock levels, waste, and reorder recommendations
- `Purchasing Staff`: reviews supplier data and creates procurement plans
- `Kitchen Manager`: monitors ingredient availability and consumption trends
- `Analyst`: reviews performance metrics, waste patterns, and forecast quality

## 7. Input -> Process -> Output Workflow

The current source materials imply this workflow but do not describe it explicitly in a complete structured form, so it is added here.

### Inputs

- Mock inventory stock levels by SKU
- Mock POS transaction data
- Mock occupancy data
- Mock restaurant visit estimates
- Mock supplier lead times
- Mock unit prices and order costs
- Safety stock settings
- Demand variability assumptions
- Seasonal demand factors
- Quantity discount rules
- SKU shelf-life and waste sensitivity data

### Process

1. Ingest mock business and inventory data into the system
2. Validate required fields, units, and SKU mappings
3. Convert transaction and occupancy signals into estimated raw material consumption
4. Aggregate consumption by SKU over a selected time window
5. Calculate demand rate, average usage, and variability indicators
6. Compute reorder point using demand, lead time, and safety stock
7. Compute EOQ using configured ordering and holding cost assumptions
8. Adjust recommendations for perishability, shelf life, seasonal demand, and quantity discounts
9. Compare recommended reorder quantity against current stock and pending orders
10. Generate purchase recommendations and alert statuses
11. Produce dashboard metrics and AI-generated analytical explanations

### Outputs

- SKU-level reorder alerts
- Recommended order quantity per SKU
- Recommended reorder timing
- Estimated inventory coverage days
- Waste-risk warnings
- Food cost and waste dashboard summaries
- AI explanations for anomalies or recommendation changes
- Historical reports for inventory and waste performance

## 8. Functional Requirements

### 8.1 Inventory Management

- The system shall maintain a master list of raw material SKUs
- The system shall track current quantity on hand by SKU
- The system shall support unit definitions such as kg, liter, pack, and piece
- The system shall record stock movements including purchase, usage, adjustment, and waste
- The system shall support minimum stock and safety stock configuration per SKU

### 8.2 Demand and Consumption Estimation

- The system shall ingest mock transaction and occupancy data
- The system shall estimate raw material consumption based on menu demand and recipe mappings
- The system shall calculate average daily usage per SKU
- The system shall support seasonal demand multipliers
- The system shall support demand variability calculations for reorder planning

### 8.3 Replenishment Optimization

- The system shall calculate EOQ for each SKU
- The system shall calculate reorder point for each SKU
- The system shall account for lead time and safety stock in reorder logic
- The system shall support quantity discount consideration
- The system shall flag recommendations that create likely overstock risk for perishable goods
- The system shall generate reorder recommendations by SKU

### 8.4 Waste Monitoring

- The system shall record waste events by SKU
- The system shall categorize waste reasons such as expiration, spoilage, overproduction, or handling damage
- The system shall calculate waste quantity and waste cost over time
- The system shall display waste trends on the dashboard

### 8.5 Dashboard and Reporting

- The system shall display overview metrics for inventory value, waste cost, stock risk, and reorder alerts
- The system shall display SKU-level details for demand, stock, EOQ, reorder point, and supplier information
- The system shall support basic date filtering for reports
- The system shall provide historical views of usage, orders, and waste

### 8.6 AI-Assisted Analysis

- The system shall use an LLM-based component behind a provider abstraction layer
- The system shall support AI provider priority in the order `Gemini AI (Google AI Studio) -> Ollama qwen3:4b -> Ollama llama3.2`
- The system shall generate human-readable explanations for replenishment suggestions
- The system shall explain unusual consumption or waste patterns identified by deterministic business logic
- The system shall provide recommendation summaries for managers
- The system shall gracefully continue operating if all AI providers are unavailable
- The system shall expose backend-only provider health and status information for verification without exposing provider secrets to frontend clients
- The AI component shall not overwrite deterministic EOQ calculations without traceable business rules

### 8.7 Simulation

- The system shall allow mock scenario testing for occupancy increase or decrease
- The system shall allow lead time changes to be simulated
- The system shall allow seasonal demand changes to be simulated
- The system shall show the effect of simulation on reorder recommendations and waste risk

## 9. Non-Functional Requirements

### Performance

- Dashboard pages should load within a reasonable time for small and medium mock datasets
- EOQ and reorder calculations should complete quickly enough for interactive review

### Reliability

- The system should preserve inventory and recommendation records consistently
- Failed data validation should not corrupt existing inventory records
- Failure of an AI provider should not block deterministic recommendation generation

### Security

- The system should require authenticated access
- Role-based permissions should restrict sensitive inventory and purchasing actions
- Sensitive configuration values and API keys should be stored securely

### Maintainability

- Business rules should be separated from UI logic
- EOQ calculations should be implemented in testable service modules
- AI analysis features should remain modular and replaceable

### Usability

- Dashboard views should be understandable by non-technical hotel staff
- Replenishment recommendations should include explanations and source assumptions

### Auditability

- Inventory changes and recommendations should be traceable
- The system should retain the input assumptions used in each recommendation cycle

### Scalability

- The design should support adding more SKUs, suppliers, and hotel locations in future phases

### Runtime Compatibility

- The system shall run correctly on standard CPU-only environments
- The system shall remain deployable on systems that include NVIDIA GPU acceleration
- The system shall remain deployable on Apple Silicon environments that provide `MPS` acceleration
- No core application feature shall depend on CUDA-only execution
- The default application architecture shall remain fully functional without requiring local GPU or MPS hardware
- Any future local AI, forecasting, or compute-intensive module shall implement device fallback logic in the order `GPU -> MPS -> CPU`
- Containerized services should use images and build settings that support both `amd64` and `arm64` environments where practical

## 10. Core Business Logic

### EOQ Formula

The system should use the standard EOQ model as the base formula:

`EOQ = sqrt((2 * D * S) / H)`

Where:

- `D` = annual or period demand
- `S` = ordering cost per order
- `H` = holding cost per unit per period

### Reorder Point

The reorder point should be calculated using:

`ROP = (average demand during lead time) + safety stock`

### Business Adjustments

Because hotel food inventory is often perishable, the system should apply additional controls beyond classical EOQ:

- Shelf-life limit checks
- Waste-risk thresholds
- Seasonal demand adjustments
- Demand variability buffers
- Supplier lead time volatility adjustments
- Quantity discount comparisons

## 11. System Architecture

The proposed architecture is a modular web application with separate responsibilities for presentation, business logic, data storage, and AI support.

### High-Level Architecture

1. Frontend Web Application
2. Backend API Layer
3. Inventory and Optimization Engine
4. AI Analysis Service
5. Relational Database
6. Background Job or Scheduler Layer
7. Mock Data Seeder or Data Generation Module

## 12. Component Description

### Frontend Web Application

- Displays dashboards, inventory records, and reorder recommendations
- Provides forms for SKU, supplier, and parameter management
- Supports simulation scenarios and report filtering

### Backend API Layer

- Exposes endpoints for inventory, suppliers, recommendations, reports, and simulations
- Validates requests and enforces role permissions
- Coordinates data flow between UI, database, optimization, and AI services

### Inventory and Optimization Engine

- Calculates demand summaries, EOQ, reorder point, and stock risk
- Applies business rules for safety stock, lead time, and shelf-life constraints
- Generates reorder recommendations by SKU

### AI Analysis Service

- Receives structured recommendation, demand, and anomaly context from deterministic backend services
- Uses a provider abstraction to call `Gemini AI (Google AI Studio)` first, then `Ollama qwen3:4b`, then `Ollama llama3.2`
- Produces natural-language insights and anomaly explanations
- Assists interpretation without replacing core deterministic calculations

### Database

- Stores master data, stock movements, waste logs, demand inputs, and recommendations
- Supports historical analysis and traceability

### Background Jobs

- Recompute forecasts and recommendations on schedule
- Refresh dashboard aggregates
- Run simulation batches when needed

### Mock Data Module

- Seeds realistic sample data for SKUs, suppliers, menu items, transactions, occupancy, waste logs, and purchase history
- Enables development, demos, and testing without real hotel integrations

### Suggested Repository Structure

The implementation should use a monorepo structure so the frontend, backend, shared definitions, and infrastructure files remain organized and easy to evolve together.

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

Folder responsibilities:

- `apps/web/src/app`: Next.js routes, layouts, and page entrypoints
- `apps/web/src/components`: reusable UI components such as cards, tables, filters, and charts
- `apps/web/src/features`: feature-scoped UI for dashboard, inventory, waste, recommendations, and simulation flows
- `apps/web/src/lib` and `apps/web/src/services`: frontend utilities, API client setup, and backend communication helpers
- `apps/api/src/common`: shared backend guards, interceptors, pipes, filters, and helper utilities
- `apps/api/src/config`: backend configuration loading and validation
- `apps/api/src/prisma` and `apps/api/prisma`: Prisma client integration, schema, migrations, and seed files
- `apps/api/src/replenishment` and `apps/api/src/recommendations`: deterministic EOQ, reorder point, and recommendation logic
- `apps/api/src/ai`: AI facade, provider orchestration, prompt builders, and provider integrations
- `packages/shared/src`: shared types, schemas, and constants used across frontend and backend
- `infra/docker`: Docker-related infrastructure assets and environment-specific container support

## 13. Technology Stack

The source materials do not mandate a fixed stack, so the following is a recommended stack for implementation.

### Recommended Stack

- Frontend: Next.js with TypeScript
- Styling: Tailwind CSS
- Backend: NestJS with TypeScript
- Database: PostgreSQL
- ORM: Prisma
- AI Integration: Gemini AI (Google AI Studio) with Ollama fallback (`qwen3:4b`, then `llama3.2`)
- Charting: Recharts
- Authentication: JWT with role-based access control
- Background Jobs: BullMQ with Redis
- API Documentation: Swagger / OpenAPI
- Validation: class-validator and class-transformer
- Deployment: Docker and Docker Compose

### Runtime and Hardware Compatibility

- The default system is CPU-first and fully functional without local acceleration hardware
- Gemini AI keeps the hosted AI path hardware-independent on the client or server host
- Optional local AI through Ollama should support fallback across `GPU -> MPS -> CPU` when local acceleration is available
- The deployment design should remain compatible with CPU-only machines, NVIDIA GPU-enabled machines, and Apple Silicon systems
- If future local model execution or accelerated analytics are introduced, they must support graceful fallback from `GPU` to `MPS` to `CPU`
- Any future local compute module should avoid hardcoded CUDA-only assumptions

## 14. Data Flow

1. Mock data is seeded into the system
2. The backend validates and stores operational records
3. The optimization engine aggregates demand and inventory inputs
4. EOQ and reorder logic generate SKU-level recommendations
5. Deterministic services compute recommendations, anomaly flags, and supporting metrics
6. The AI service interprets trends and recommendation context through the configured provider chain
7. The frontend dashboard presents results to the user
8. Users review recommendations and simulate alternative scenarios

## 15. Database Schema

The following schema is implementation-oriented and uses relational database conventions appropriate for PostgreSQL. Data types below are recommended types for the first production-ready schema design.

### Data Type Conventions

- Primary keys use `UUID`
- Foreign keys use `UUID`
- Quantity and cost fields use `DECIMAL` to avoid floating-point precision issues
- Business calendar fields use `DATE`
- Audit fields use `TIMESTAMP WITH TIME ZONE`
- Flexible structured fields use `JSONB`
- Controlled-value fields can be implemented as PostgreSQL `ENUM` types or validated string fields

### Recommended Controlled Value Types

- `user_role_enum`: `admin`, `inventory_manager`, `purchasing_staff`, `kitchen_manager`, `analyst`
- `movement_type_enum`: `purchase`, `usage`, `adjustment`, `waste`, `return`
- `reference_type_enum`: `purchase_order`, `waste_log`, `manual_adjustment`, `pos_consumption`, `simulation`
- `waste_reason_enum`: `expiration`, `spoilage`, `overproduction`, `damage`, `quality_issue`, `other`
- `purchase_order_status_enum`: `draft`, `submitted`, `approved`, `ordered`, `received`, `cancelled`
- `risk_level_enum`: `low`, `medium`, `high`, `critical`
- `scenario_type_enum`: `occupancy_change`, `lead_time_change`, `seasonal_shift`, `supplier_delay`, `demand_spike`

### `users`

- `id`: `UUID` - primary key
- `name`: `VARCHAR(120)` - full name of the user
- `email`: `VARCHAR(255)` - unique login email
- `password_hash`: `VARCHAR(255)` - hashed password using `bcryptjs` or an equivalent password-hashing implementation
- `role`: `user_role_enum` - system access role
- `created_at`: `TIMESTAMP WITH TIME ZONE` - record creation time
- `updated_at`: `TIMESTAMP WITH TIME ZONE` - last update time

### `hotels`

- `id`: `UUID` - primary key
- `name`: `VARCHAR(150)` - hotel or property name
- `location`: `VARCHAR(255)` - city, branch, or location descriptor
- `created_at`: `TIMESTAMP WITH TIME ZONE`
- `updated_at`: `TIMESTAMP WITH TIME ZONE`

### `suppliers`

- `id`: `UUID` - primary key
- `hotel_id`: `UUID` - foreign key to `hotels.id`
- `name`: `VARCHAR(150)` - supplier business name
- `contact_name`: `VARCHAR(120)` - main supplier contact
- `contact_email`: `VARCHAR(255)` - supplier contact email
- `contact_phone`: `VARCHAR(30)` - supplier phone number
- `default_lead_time_days`: `INTEGER` - standard lead time in days
- `created_at`: `TIMESTAMP WITH TIME ZONE`
- `updated_at`: `TIMESTAMP WITH TIME ZONE`

### `skus`

- `id`: `UUID` - primary key
- `hotel_id`: `UUID` - foreign key to `hotels.id`
- `supplier_id`: `UUID` - foreign key to `suppliers.id`
- `sku_code`: `VARCHAR(50)` - unique SKU code within a hotel scope
- `name`: `VARCHAR(150)` - raw material name
- `category`: `VARCHAR(100)` - category such as meat, vegetables, rice, dairy
- `unit`: `VARCHAR(30)` - stocking unit such as `kg`, `liter`, `piece`, `pack`
- `unit_cost`: `DECIMAL(12,2)` - latest or standard cost per unit
- `holding_cost_per_unit`: `DECIMAL(12,2)` - estimated holding cost per unit per planning period
- `order_cost`: `DECIMAL(12,2)` - estimated fixed ordering cost per purchase cycle
- `shelf_life_days`: `INTEGER` - shelf life in days
- `safety_stock`: `DECIMAL(12,3)` - safety stock quantity
- `minimum_stock`: `DECIMAL(12,3)` - minimum desired stock quantity
- `is_active`: `BOOLEAN` - whether the SKU is active
- `created_at`: `TIMESTAMP WITH TIME ZONE`
- `updated_at`: `TIMESTAMP WITH TIME ZONE`

### `inventory_batches`

- `id`: `UUID` - primary key
- `sku_id`: `UUID` - foreign key to `skus.id`
- `received_quantity`: `DECIMAL(12,3)` - quantity received into stock
- `remaining_quantity`: `DECIMAL(12,3)` - quantity remaining in the batch
- `received_date`: `DATE` - date the batch was received
- `expiry_date`: `DATE` - expiry date for perishable stock
- `unit_cost`: `DECIMAL(12,2)` - cost per unit for this batch
- `created_at`: `TIMESTAMP WITH TIME ZONE`

### `inventory_movements`

- `id`: `UUID` - primary key
- `sku_id`: `UUID` - foreign key to `skus.id`
- `movement_type`: `movement_type_enum` - movement classification
- `quantity`: `DECIMAL(12,3)` - quantity moved
- `reference_type`: `reference_type_enum` - source or driver of movement
- `reference_id`: `UUID` - linked record identifier where applicable
- `movement_date`: `DATE` - effective date of stock movement
- `notes`: `TEXT` - optional descriptive notes
- `created_at`: `TIMESTAMP WITH TIME ZONE`

### `menu_items`

- `id`: `UUID` - primary key
- `hotel_id`: `UUID` - foreign key to `hotels.id`
- `name`: `VARCHAR(150)` - menu item name
- `category`: `VARCHAR(100)` - breakfast, buffet, dinner, dessert, beverage, etc.
- `selling_price`: `DECIMAL(12,2)` - selling price per menu item
- `is_active`: `BOOLEAN` - whether the menu item is active
- `created_at`: `TIMESTAMP WITH TIME ZONE`
- `updated_at`: `TIMESTAMP WITH TIME ZONE`

### `recipes`

- `id`: `UUID` - primary key
- `menu_item_id`: `UUID` - foreign key to `menu_items.id`
- `sku_id`: `UUID` - foreign key to `skus.id`
- `quantity_per_serving`: `DECIMAL(12,3)` - quantity of SKU used per serving
- `unit`: `VARCHAR(30)` - recipe unit used for the ingredient quantity
- `created_at`: `TIMESTAMP WITH TIME ZONE`
- `updated_at`: `TIMESTAMP WITH TIME ZONE`

### `pos_transactions`

- `id`: `UUID` - primary key
- `hotel_id`: `UUID` - foreign key to `hotels.id`
- `menu_item_id`: `UUID` - foreign key to `menu_items.id`
- `quantity_sold`: `INTEGER` - number of menu items sold in the transaction record
- `transaction_date`: `DATE` - date of sale
- `meal_period`: `VARCHAR(30)` - breakfast, lunch, dinner, late-night, etc.
- `created_at`: `TIMESTAMP WITH TIME ZONE`

### `occupancy_records`

- `id`: `UUID` - primary key
- `hotel_id`: `UUID` - foreign key to `hotels.id`
- `record_date`: `DATE` - occupancy record date
- `occupied_rooms`: `INTEGER` - total occupied rooms
- `occupancy_rate`: `DECIMAL(5,2)` - occupancy percentage, such as `78.50`
- `estimated_restaurant_visits`: `INTEGER` - estimated or actual guest restaurant visits
- `created_at`: `TIMESTAMP WITH TIME ZONE`

### `waste_logs`

- `id`: `UUID` - primary key
- `sku_id`: `UUID` - foreign key to `skus.id`
- `quantity`: `DECIMAL(12,3)` - wasted quantity
- `unit`: `VARCHAR(30)` - unit of wasted quantity
- `waste_reason`: `waste_reason_enum` - categorized reason for waste
- `estimated_cost`: `DECIMAL(12,2)` - estimated cost of waste
- `waste_date`: `DATE` - date of waste event
- `notes`: `TEXT` - optional context about the waste event
- `created_at`: `TIMESTAMP WITH TIME ZONE`

### `purchase_orders`

- `id`: `UUID` - primary key
- `hotel_id`: `UUID` - foreign key to `hotels.id`
- `supplier_id`: `UUID` - foreign key to `suppliers.id`
- `status`: `purchase_order_status_enum` - lifecycle status of the order
- `order_date`: `DATE` - purchase order issue date
- `expected_delivery_date`: `DATE` - expected arrival date
- `total_cost`: `DECIMAL(14,2)` - total order cost
- `created_at`: `TIMESTAMP WITH TIME ZONE`
- `updated_at`: `TIMESTAMP WITH TIME ZONE`

### `purchase_order_items`

- `id`: `UUID` - primary key
- `purchase_order_id`: `UUID` - foreign key to `purchase_orders.id`
- `sku_id`: `UUID` - foreign key to `skus.id`
- `ordered_quantity`: `DECIMAL(12,3)` - ordered quantity
- `unit_cost`: `DECIMAL(12,2)` - negotiated unit cost
- `discount_rate`: `DECIMAL(5,2)` - percentage discount, such as `10.00`
- `created_at`: `TIMESTAMP WITH TIME ZONE`

### `supplier_lead_times`

- `id`: `UUID` - primary key
- `supplier_id`: `UUID` - foreign key to `suppliers.id`
- `sku_id`: `UUID` - foreign key to `skus.id`
- `average_lead_time_days`: `INTEGER` - average lead time in whole days
- `lead_time_variability_days`: `INTEGER` - estimated lead time variability in days
- `created_at`: `TIMESTAMP WITH TIME ZONE`
- `updated_at`: `TIMESTAMP WITH TIME ZONE`

### `demand_forecasts`

- `id`: `UUID` - primary key
- `sku_id`: `UUID` - foreign key to `skus.id`
- `forecast_period_start`: `DATE` - start of forecast window
- `forecast_period_end`: `DATE` - end of forecast window
- `average_daily_demand`: `DECIMAL(12,3)` - expected average daily demand
- `demand_variability`: `DECIMAL(12,3)` - standard deviation or selected variability measure
- `seasonality_factor`: `DECIMAL(6,3)` - multiplier such as `1.250`
- `created_at`: `TIMESTAMP WITH TIME ZONE`

### `replenishment_recommendations`

- `id`: `UUID` - primary key
- `sku_id`: `UUID` - foreign key to `skus.id`
- `recommendation_date`: `DATE` - date recommendation was generated
- `current_stock`: `DECIMAL(12,3)` - available quantity at evaluation time
- `reorder_point`: `DECIMAL(12,3)` - reorder threshold quantity
- `recommended_quantity`: `DECIMAL(12,3)` - suggested reorder quantity
- `eoq_value`: `DECIMAL(12,3)` - EOQ result
- `estimated_days_of_cover`: `DECIMAL(8,2)` - estimated stock coverage in days
- `risk_level`: `risk_level_enum` - severity of stock risk
- `explanation`: `TEXT` - rule-based or AI-generated explanation
- `created_at`: `TIMESTAMP WITH TIME ZONE`

### `simulation_runs`

- `id`: `UUID` - primary key
- `hotel_id`: `UUID` - foreign key to `hotels.id`
- `name`: `VARCHAR(150)` - scenario name
- `scenario_type`: `scenario_type_enum` - type of simulation scenario
- `input_parameters`: `JSONB` - structured input settings for the simulation
- `result_summary`: `JSONB` - structured simulation outputs and summary metrics
- `created_at`: `TIMESTAMP WITH TIME ZONE`

## 16. Mock Data Strategy

Since the initial phase uses mock data, the project should include representative datasets that simulate hotel operations.

### Mock Data Categories

- Hotel master data
- Suppliers and lead times
- Raw material SKUs
- Menu items and recipes
- Daily POS transactions
- Daily occupancy and restaurant visit estimates
- Purchase orders and receipts
- Waste events
- Seasonal demand scenarios

### Mock Data Requirements

- Data should cover multiple weeks or months to support trend analysis
- Data should include normal demand, peak demand, and low-demand periods
- Data should include supplier delays and stock risk cases
- Data should include perishable SKUs with expiry pressure
- Data should support testing reorder logic and waste alerts

## 17. AI and Analytics Responsibilities

The AI layer should be used for support, not as the single source of truth for inventory decisions.

### AI Responsibilities

- Summarize demand and waste trends
- Explain why a SKU is recommended for reorder
- Explain unusual transaction or waste patterns already flagged by deterministic rules or services
- Suggest possible operational causes for changes
- Generate manager-friendly narrative insights
- Fall back across multiple providers without changing the underlying business result

### AI Non-Responsibilities

- AI should not silently replace EOQ results
- AI should not generate final procurement actions without traceable business data
- AI should not be the only mechanism for calculating reorder thresholds
- AI should not be the primary source of anomaly detection when rule-based or statistical checks are available

## 18. Key Metrics and KPIs

- Total food waste quantity
- Total food waste cost
- Inventory turnover rate
- Stockout frequency
- Reorder recommendation accuracy
- Average days of inventory on hand
- Supplier lead time reliability
- Total inventory holding cost
- Total ordering cost
- Estimated savings from optimization

## 19. Risks and Edge Cases

### Risks

- Poor data quality may distort demand estimation
- Classical EOQ may over-recommend for highly perishable items
- Supplier lead times may be unstable
- AI explanations may be persuasive but incorrect if based on bad inputs

### Edge Cases

- Missing transaction data for a day or time period
- Sudden occupancy spikes from events or holidays
- Negative inventory due to delayed stock updates
- Multiple suppliers for one SKU with different pricing and lead times
- Unit mismatch between recipes, purchases, and stock records
- Demand drops that make previously valid EOQ settings too large

## 20. Future Enhancements

- Real POS integration
- Hotel PMS or occupancy system integration
- Supplier ordering integration
- Forecasting models beyond basic EOQ inputs
- Multi-property management
- Mobile inventory operations
- Expiry-aware batch recommendation logic
- Advanced procurement approval workflows

## 21. Conclusion

This project aims to build a practical and explainable inventory intelligence system for hotel food operations. The core value comes from combining SKU-level EOQ replenishment planning with hotel-specific demand signals, waste tracking, and AI-assisted interpretation.

The first implementation phase should focus on a strong mock-data-driven foundation, transparent inventory logic, and a clear operational workflow from input to decision output. This will make the system suitable for demonstration, validation, and future expansion into real operational environments.
