# API Specification & Data Contracts
## Multimodal Construction Intelligence Platform API (v1)

### Base URL: `/api/v1`

---

### 1. Health & System Status
- **Endpoint**: `GET /api/v1/health`
- **Description**: Returns system health status, active AI engine mode (Live Gemini vs Calibrated Fallback), and API version.
- **Response**:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "ai_mode": "gemini-live" | "calibrated-heuristic",
  "timestamp": "2026-10-19T10:30:00Z"
}
```

---

### 2. Site Safety Image Analysis
- **Endpoint**: `POST /api/v1/safety/analyze`
- **Content-Type**: `multipart/form-data` or `application/json` (Base64)
- **Parameters / Form Fields**:
  - `file`: Image file (JPEG, PNG, WebP)
  - `project_name` (optional): string
  - `site_zone` (optional): string (e.g., "Scaffolding Zone B")
- **Response Schema (`SafetyAnalysisResponse`)**:
```json
{
  "project_name": "Skyline Heights Tower B",
  "site_zone": "Scaffolding Zone B",
  "safety_score": 78,
  "overall_risk_level": "Medium",
  "summary": "Multiple workers observed without appropriate fall protection harnesses near floor edges. General PPE compliance is satisfactory.",
  "ppe_compliance": [
    { "item": "Hardhat", "status": "Compliant", "compliance_rate_pct": 95, "notes": "All workers wearing compliant hardhats." },
    { "item": "High-Visibility Vest", "status": "Compliant", "compliance_rate_pct": 90, "notes": "Vests visible on ground personnel." },
    { "item": "Fall Protection Harness", "status": "Violation", "compliance_rate_pct": 40, "notes": "2 workers at height unclipped." },
    { "item": "Safety Boots", "status": "Compliant", "compliance_rate_pct": 100, "notes": "Standard steel-toe boots observed." },
    { "item": "Eye Protection", "status": "Partial", "compliance_rate_pct": 60, "notes": "Grinder operator lacking goggles." }
  ],
  "hazards_identified": [
    {
      "hazard_id": "HAZ-001",
      "category": "Fall Hazard",
      "severity": "Critical",
      "location": "Upper cantilever deck",
      "description": "Lack of perimeter toe-boards and unclipped safety lanyard.",
      "osha_standard": "OSHA 1926.501(b)(1)"
    }
  ],
  "corrective_actions": [
    "Halt work on cantilever deck until 100% tie-off lifelines are installed.",
    "Issue immediate written reprimand and mandatory refresher on fall arrest equipment."
  ],
  "timestamp": "2026-10-19T10:30:00Z"
}
```

---

### 3. Crack & Structural Integrity Assessment
- **Endpoint**: `POST /api/v1/crack/analyze`
- **Content-Type**: `multipart/form-data` or `application/json` (Base64)
- **Form Fields / Payload**:
  - `file`: Close-up or wide structural image
  - `structural_element`: "Beam" | "Column" | "Slab" | "Retaining Wall" | "Foundation"
  - `concrete_grade` (optional): e.g. "M25 / 3500 PSI"
- **Response Schema (`CrackAnalysisResponse`)**:
```json
{
  "structural_element": "Beam",
  "crack_detected": true,
  "crack_classification": "Shear Crack",
  "estimated_width_mm": 2.4,
  "severity": "Severe",
  "structural_risk_rating": "High",
  "cause_analysis": "Diagonal tensile stress near support zone indicating inadequate shear reinforcement or overloading.",
  "code_reference": "ACI 318-19 Section 9.5.3 (Shear Design)",
  "immediate_actions": [
    "Install temporary hydraulic shores under the affected beam span immediately.",
    "Restrict live loads on the floor above."
  ],
  "remediation_protocol": [
    "Core drill inspection to verify crack depth and rebar corrosion.",
    "Low-viscosity epoxy pressure injection (ASTM C881 Type I/IV).",
    "External post-tensioning or carbon-fiber-reinforced polymer (CFRP) composite jacketing."
  ]
}
```

---

### 4. Construction Project Planning & Scheduling
- **Endpoint**: `POST /api/v1/planning/generate`
- **Payload (`ProjectPlanRequest`)**:
```json
{
  "project_name": "Apex Commercial Complex",
  "project_type": "Commercial",
  "total_built_up_area_sqft": 45000,
  "target_budget_usd": 3200000,
  "target_duration_months": 14,
  "location": "Dallas, TX",
  "soil_condition": "Standard Clay",
  "floors": 4
}
```
- **Response Schema (`ProjectPlanResponse`)**:
```json
{
  "project_name": "Apex Commercial Complex",
  "estimated_total_weeks": 60,
  "estimated_budget_usd": 3200000,
  "phases": [
    {
      "phase_name": "Phase 1: Pre-Construction & Earthwork",
      "duration_weeks": 8,
      "start_week": 1,
      "end_week": 8,
      "critical_path": true,
      "labor_headcount": 18,
      "milestones": ["Site clearing complete", "Excavation to grade approved by geotechnical engineer"],
      "budget_allocation_pct": 12
    }
  ],
  "risk_contingency_matrix": [
    { "risk": "Subsurface groundwater seepage", "probability": "Medium", "impact": "High", "mitigation": "Dewatering pumps on standby and bentonite slurry trenching." }
  ],
  "key_recommendations": [
    "Procure long-lead HVAC chillers and switchgear by Week 6."
  ]
}
```

---

### 5. Real Estate Valuation & Feasibility Engine
- **Endpoint**: `POST /api/v1/valuation/calculate`
- **Payload (`ValuationRequest`)**:
```json
{
  "property_type": "Residential High-Rise",
  "built_up_area_sqft": 2400,
  "bedrooms": 3,
  "bathrooms": 3,
  "construction_quality": "Premium",
  "age_years": 0,
  "location_tier": "Prime Urban Core",
  "amenities": ["Underground Parking", "Swimming Pool", "24/7 Power Backup", "Gymnasium", "LEED Silver Certified"],
  "land_area_sqft": 3000
}
```
- **Response Schema (`ValuationResponse`)**:
```json
{
  "estimated_market_value": {
    "min_value": 780000,
    "median_value": 845000,
    "max_value": 910000,
    "currency": "USD"
  },
  "price_per_sqft": 352.08,
  "cost_breakdown": {
    "construction_cost": 480000,
    "land_share_value": 265000,
    "developer_margin_overhead": 100000
  },
  "investment_metrics": {
    "projected_monthly_rental": 4200,
    "gross_rental_yield_pct": 5.96,
    "estimated_cap_rate_pct": 5.1,
    "forecasted_5yr_appreciation_pct": 28.5
  },
  "comparative_market_insights": [
    "Price is within 3.5% of prevailing luxury multi-family benchmarks in the immediate 2-mile radius.",
    "Premium finishes contribute an estimated +12% value premium over standard developments."
  ]
}
```

---

### 6. Daily Site Assistant
- **Endpoint**: `POST /api/v1/daily-log/process`
- **Payload (`DailyLogRequest`)**:
```json
{
  "date": "2026-10-19",
  "supervisor_name": "Marcus Vance",
  "raw_field_notes": "Poured 120 cubic yards of concrete on Floor 3 slab. Ready-mix transit mixer delayed 1.5 hours due to highway accident. 4 masons absent today. Steel delivery arrived at 2 PM. Minor scaffold tie wire loose, fixed on spot.",
  "workforce_headcount": 34,
  "weather_observed": "Clear, 28°C"
}
```
- **Response Schema (`DailyLogResponse`)**:
```json
{
  "date": "2026-10-19",
  "executive_summary": "120 cu.yd Floor 3 slab pour completed successfully despite batch transit delay. Masonry team operated at 70% capacity.",
  "progress_highlights": [
    "Floor 3 structural slab concrete pour finalized (120 cu.yd placed)."
  ],
  "delays_and_bottlenecks": [
    { "issue": "Ready-mix batch transit delay", "delay_hours": 1.5, "impact": "Pushed finish crew into overtime." },
    { "issue": "Masonry workforce absenteeism", "delay_hours": 0, "impact": "Slowed interior partition wall layout on Floor 2." }
  ],
  "safety_infractions": [
    "Scaffold tie wire loose on North face (immediately rectified)."
  ],
  "next_day_punch_list": [
    "Inspect concrete test cylinders for Floor 3 pour at 24-hour break point.",
    "Begin wet burlap curing regime for slab.",
    "Reallocate 2 floating laborers to assist masonry partition layout."
  ]
}
```

---

### 7. Weather-Aware Construction Advisory
- **Endpoint**: `POST /api/v1/weather/advisory`
- **Payload (`WeatherAdvisoryRequest`)**:
```json
{
  "temperature_c": 36.5,
  "humidity_pct": 32,
  "precipitation_chance_pct": 10,
  "wind_speed_kmh": 28,
  "uv_index": 9,
  "scheduled_trades": ["Concrete Pouring", "Tower Crane Operation", "External Painting", "Deep Excavation", "Roofing Installation"]
}
```
- **Response Schema (`WeatherAdvisoryResponse`)**:
```json
{
  "overall_site_condition": "High Heat & Moderate Wind Warning",
  "risk_level": "Caution",
  "trade_advisories": [
    {
      "trade": "Concrete Pouring",
      "status": "Caution",
      "risk_factors": ["High evaporation rate causing rapid plastic shrinkage cracking."],
      "mandatory_measures": [
        "Use chilled mix water or liquid nitrogen dosing in batch plant.",
        "Apply aliphatic alcohol evaporation retardant immediately after screeding.",
        "Commence fog misting or continuous wet burlap curing as soon as surface sets."
      ]
    },
    {
      "trade": "Tower Crane Operation",
      "status": "Safe",
      "risk_factors": ["Wind gusts at 28 km/h are below the 55 km/h out-of-service limit."],
      "mandatory_measures": ["Maintain wind anemometer monitoring for sudden convective gusts."]
    }
  ],
  "worker_safety_advisory": "Level 3 Heat Stress: Implement mandatory 15-minute shaded rest breaks every 60 minutes and provide chilled electrolyte hydration stations."
}
```

---

### 8. Construction Knowledge Assistant (Chatbot)
- **Endpoint**: `POST /api/v1/chat/message`
- **Payload (`ChatMessageRequest`)**:
```json
{
  "message": "What is the minimum curing period for OPC concrete in hot weather according to ACI 308?",
  "conversation_history": [
    { "role": "user", "content": "Hello" },
    { "role": "assistant", "content": "Hello! I am your Construction Intelligence Assistant. How can I assist you with site engineering, codes, or planning today?" }
  ]
}
```
- **Response Schema (`ChatMessageResponse`)**:
```json
{
  "response": "According to ACI 308R (Guide to External Curing of Concrete), standard Ordinary Portland Cement (Type I) requires a minimum curing period of 7 days, or until 70% of specified compressive strength is achieved. In hot weather (>35°C / 95°F), moisture loss is accelerated; curing should commence immediately after finishing and must be sustained continuously using wet burlap coverings, plastic sheeting, or liquid membrane-forming curing compounds meeting ASTM C309.",
  "citations": ["ACI 308R-16 Guide to External Curing", "ACI 305R-20 Hot Weather Concreting", "ASTM C309 Standard Specification"],
  "suggested_followups": [
    "What are the best curing compounds for high-rise slabs?",
    "How does fly ash (Type IP) affect curing duration?",
    "What temperature differential between core and surface causes thermal cracking?"
  ]
}
```
