# Multimodal Construction Intelligence Platform
## Comprehensive Requirements Specification & Functional Analysis

### 1. Executive Summary
The **AI-Powered Multimodal Construction Intelligence Platform** is an enterprise-grade, full-stack decision-support system engineered for general contractors, site safety managers, structural engineers, cost estimators, and real estate developers. By fusing multimodal Large Language Models (LLMs) with high-speed deterministic algorithms, the platform transforms unstructured image and text data into real-time, actionable engineering insights.

---

### 2. Stakeholders & Personas
1. **On-Site Safety Officer / HSE Inspector**
   - Goal: Enforce OSHA/NBC safety compliance, detect PPE violations (helmets, vests, harnesses), identify structural tripping/falling hazards.
2. **Structural Civil Engineer**
   - Goal: Perform structural crack triage, classify crack morphology (hairline, structural, settlement, thermal), evaluate concrete integrity, and prescribe remediation.
3. **Construction Project Manager / Planner**
   - Goal: Formulate Work Breakdown Structures (WBS), sequence critical path activities, balance manpower allocation, and map contingency risk matrices.
4. **Real Estate Valuer & Quantity Surveyor**
   - Goal: Model accurate valuation estimates incorporating built-up area, material grades, local economic indicators, rental yield, and Cap Rates.
5. **Site Superintendent**
   - Goal: Aggregate daily field logs, identify critical material/subcontractor bottlenecks, and issue automated next-day punch lists.
6. **Field Operations Lead**
   - Goal: Proactively mitigate weather risks (temperature, precipitation, wind velocity, humidity) on sensitive operations like concrete curing, crane hoists, and external waterproofing.

---

### 3. Functional Requirements by Epic & Module

#### Epic 1: Requirements Specification and Environment Setup
- **FR-1.1**: Define structured data contracts for all multimodal requests and outputs.
- **FR-1.2**: Implement multi-tier configuration handling (Environment variables, Docker parameters, fallback offline mock mode).

#### Epic 2: Image-Based Analysis Module Development
- **FR-2.1: Site Safety Monitoring**:
  - Ingestion: High-resolution site photographs (JPEG, PNG, WebP) up to 25MB or Base64 payload.
  - Analysis: Identification of worker PPE compliance (Hardhat, High-Visibility Vest, Harness, Safety Boots, Gloves, Eye Protection).
  - Hazard Detection: Unprotected edges, scaffolding instability, tripping debris, electrical hazards, trench collapses.
  - Metrics: Safety Compliance Score (0-100), Severity Breakdown (Low, Medium, High, Critical), OSHA / NBC standard citations.
  - Output: Structured JSON containing itemized violations, risk ratings, and immediate corrective action recommendations.
- **FR-2.2: Crack Detection & Structural Assessment**:
  - Ingestion: Close-up and perspective imagery of concrete walls, beams, columns, or foundations.
  - Classification: Crack category (Structural Shear/Flexural, Settlement, Hairline/Shrinkage, Thermal).
  - Metrics: Estimated width range (mm), orientation/pattern, progression severity (Minor, Moderate, Severe, Critical).
  - Risk Evaluation: Immediate structural failure hazard rating and urgency level.
  - Remediation: Engineering repair protocols (Epoxy pressure injection, Polyurethane sealing, Carbon-fiber wrap, Stitching, Underpinning).

#### Epic 3: Construction Planning and Valuation Module Development
- **FR-3.1: Automated Project Planning & Scheduling**:
  - Ingestion: Project category (Residential, Commercial, Industrial, Infrastructure), Total Built-up Area (sq ft), Target Budget ($ / INR), Location, Site Constraints.
  - Synthesis: 5-stage Work Breakdown Structure (Pre-Construction, Substructure, Superstructure, MEP & Enclosure, Interior Finishes & Handover).
  - Deliverables: Phased timeline (Gantt-compatible week counts), critical milestones, estimated labor crew size, critical path flags, and risk contingency matrix.
- **FR-3.2: Real Estate Valuation & Investment Engine**:
  - Ingestion: Property type, gross floor area, construction quality grade (Standard, Premium, Luxury), location tier, amenities, age.
  - Analytics: Estimated market value (Min, Median, Max), Price per sq ft benchmark, Replacement cost vs Land value ratio.
  - Financial Metrics: Projected gross rental yield (%), Capitalization Rate (Cap Rate %), 5-year compound appreciation forecast.

#### Epic 4: AI Intelligence Layer Implementation
- **FR-4.1: Multimodal Ingestion Pipeline**:
  - Seamless handling of base64 data URIs and multi-part file uploads.
  - Dual Execution Mode: Direct Google Gemini 1.5/2.0 API integration + Resilient deterministic rule-based fallback when offline or without API key.
- **FR-4.2: Strict Output Enforcement**:
  - Guaranteed JSON schema compliance via Pydantic model validation. Zero crashing on ill-formatted LLM responses.
- **FR-4.3: Construction Domain Persona Prompting**:
  - Standardized prompt templates calibrated for OSHA 1926, ACI 318 (American Concrete Institute), IBC (International Building Code), and ISO 45001.

#### Epic 5: Assistant and Advisory Engine Development
- **FR-5.1: Construction Knowledge Assistant**:
  - Conversational chatbot capable of multi-turn dialogue regarding building standards, concrete mix ratios, curing periods, material specifications, and regulatory codes.
- **FR-5.2: Daily Site Log Assistant**:
  - Input: Raw superintendent field notes, worker headcount, machinery log, material deliveries, weather observations.
  - Output: Executive summary, delayed activity flags, subcontractor accountability check, and automated next-day action punch list.
- **FR-5.3: Weather-Aware Construction Advisory**:
  - Input: Forecast temperature (°C/°F), precipitation probability (%), wind speed (km/h or mph), humidity (%), UV index.
  - Output: Workability index (Safe, Caution, Unsafe) across 5 critical trades:
    1. Concrete Pouring & Curing (plastic shrinkage, freezing risk).
    2. Tower Crane & Aerial Lifts (wind cutoff thresholds).
    3. External Painting & Waterproofing (dew point & moisture sensitivity).
    4. Deep Excavation & Earthwork (mudding & slope failure).
    5. Roofing & High-Elevation Steel Erection.

#### Epic 6: Interface, Testing, and Deployment
- **FR-6.1: High-Performance Minimalist Web UI**:
  - React 18 + Vite frontend adhering to Linear/Vercel design standards (dark mode, crisp typography, clean zero-clutter cards, no rainbow tags).
  - Instant one-click preset test samples for rapid evaluator/mentor grading.
  - Downloadable / printable executive inspection audit report.
- **FR-6.2: Automated Verification & Testing**:
  - Pytest suite covering all API endpoints, Pydantic contracts, edge-case invalid image handling, and offline resilience.
- **FR-6.3: Production Containerization**:
  - Multi-stage Dockerfile for FastAPI backend and Vite frontend.
  - Unified `docker-compose.yml` for zero-configuration startup.

---

### 4. Non-Functional Requirements
- **Performance**: API response time < 3.5 seconds for multimodal vision inference; < 800ms for deterministic calculation modules.
- **Reliability & Availability**: 99.9% uptime capability; graceful degradation to heuristic analysis when LLM upstream experiences rate limits or timeouts.
- **Security**: No persistent storage of raw personal data; image processing conducted in-memory with secure temporary buffer isolation.
- **Maintainability**: Clean modular architecture separating routing (`api/`), domain logic (`services/`), data contracts (`schemas/`), and user interface (`frontend/`).
