import logging
import math
from app.schemas.planning import ProjectPlanRequest, ProjectPlanResponse, ConstructionPhase, RiskItem
from app.services.gemini_client import generate_multimodal_content

logger = logging.getLogger("planning_service")

PLANNING_SYSTEM_PROMPT = """
You are a certified PMP Construction Project Manager and Master Scheduler specialized in Work Breakdown Structures (WBS), Critical Path Method (CPM), and risk contingency management.
Generate a comprehensive, phased construction execution plan based on the client's project inputs.
Phases should include:
1. Pre-Construction, Permitting & Site Mobilization
2. Substructure, Deep Foundations & Earthwork
3. Superstructure (Structural Concrete / Steel Framing)
4. MEP (Mechanical, Electrical, Plumbing), Envelope & Facade
5. Interior Architectural Finishes, Commissioning & Handover

Respond in strict JSON matching this schema:
{
  "project_name": string,
  "project_type": string,
  "estimated_total_weeks": integer,
  "estimated_budget_usd": number,
  "phases": [
    {
      "phase_id": string,
      "phase_name": string,
      "duration_weeks": integer,
      "start_week": integer,
      "end_week": integer,
      "critical_path": boolean,
      "labor_headcount": integer,
      "milestones": [string],
      "budget_allocation_pct": number
    }
  ],
  "risk_contingency_matrix": [
    { "risk": string, "probability": "Low" | "Medium" | "High", "impact": "Low" | "Medium" | "High" | "Critical", "mitigation": string }
  ],
  "key_recommendations": [string]
}
"""

def generate_deterministic_plan(req: ProjectPlanRequest) -> ProjectPlanResponse:
    """Deterministic Critical Path Method (CPM) construction schedule algorithm."""
    target_weeks = req.target_duration_months * 4
    area = req.total_built_up_area_sqft
    floors = max(1, req.floors)
    
    # Scale labor headcount proportionally with floor area
    base_headcount = max(12, int(math.sqrt(area) * 0.25))
    
    # Duration weighting across 5 standard phases
    # 1: Pre-con (15%), 2: Substructure (20%), 3: Superstructure (25%), 4: MEP & Envelope (25%), 5: Finishes (15%)
    p1_weeks = max(4, int(target_weeks * 0.15))
    p2_weeks = max(5, int(target_weeks * 0.20))
    p3_weeks = max(6, int(target_weeks * 0.25))
    p4_weeks = max(6, int(target_weeks * 0.25))
    p5_weeks = max(4, target_weeks - (p1_weeks + p2_weeks + p3_weeks + p4_weeks))
    
    # Timeline sequencing (with realistic fast-track overlapping)
    # Phase 1: W1 to p1_weeks
    # Phase 2: Starts W(p1_weeks - 1)
    p1_start = 1
    p1_end = p1_weeks
    
    p2_start = max(1, p1_end - 1)
    p2_end = p2_start + p2_weeks
    
    p3_start = max(1, p2_end - 1)
    p3_end = p3_start + p3_weeks
    
    p4_start = p3_start + int(p3_weeks * 0.4) # Fast-track MEP once lower floor frames cure
    p4_end = p4_start + p4_weeks
    
    p5_start = p4_start + int(p4_weeks * 0.5)
    p5_end = max(p4_end + 2, p5_start + p5_weeks)
    
    total_weeks = p5_end
    
    phases = [
        ConstructionPhase(
            phase_id="PHASE-01",
            phase_name="Pre-Construction, Geotechnical & Mobilization",
            duration_weeks=p1_weeks,
            start_week=p1_start,
            end_week=p1_end,
            critical_path=True,
            labor_headcount=int(base_headcount * 0.6),
            milestones=[
                "Site perimeter hoarding, security & utility tap-in",
                "Soil boring logs verified & foundation permits approved",
                "Subcontractor trade packages awarded"
            ],
            budget_allocation_pct=8.0
        ),
        ConstructionPhase(
            phase_id="PHASE-02",
            phase_name="Substructure, Excavation & Deep Foundations",
            duration_weeks=p2_weeks,
            start_week=p2_start,
            end_week=p2_end,
            critical_path=True,
            labor_headcount=int(base_headcount * 0.9),
            milestones=[
                "Excavation to bottom of footing grade completed",
                "Piling / Raft foundation rebar cage inspection passed",
                "Foundation slab poured and waterproofing membrane applied"
            ],
            budget_allocation_pct=18.0
        ),
        ConstructionPhase(
            phase_id="PHASE-03",
            phase_name="Superstructure Framing & Structural Slabs",
            duration_weeks=p3_weeks,
            start_week=p3_start,
            end_week=p3_end,
            critical_path=True,
            labor_headcount=int(base_headcount * 1.4),
            milestones=[
                f"Floor 1 through {floors} structural column/slab pours completed",
                "Roof parapet level structural topping out ceremony",
                "Post-tensioning stress tendons locked and de-shored"
            ],
            budget_allocation_pct=32.0
        ),
        ConstructionPhase(
            phase_id="PHASE-04",
            phase_name="Building Envelope, Glazing & MEP Rough-Ins",
            duration_weeks=p4_weeks,
            start_week=p4_start,
            end_week=p4_end,
            critical_path=False,
            labor_headcount=int(base_headcount * 1.2),
            milestones=[
                "Curtain wall glazing and external weatherproofing sealed",
                "HVAC ductwork, main electrical switchboards & plumbing risers roughed-in",
                "Fire suppression sprinkler hydro-testing passed"
            ],
            budget_allocation_pct=26.0
        ),
        ConstructionPhase(
            phase_id="PHASE-05",
            phase_name="Interior Architectural Finishes & Handover",
            duration_weeks=p5_weeks,
            start_week=p5_start,
            end_week=p5_end,
            critical_path=True,
            labor_headcount=int(base_headcount * 1.0),
            milestones=[
                "Drywall partitions, acoustic ceilings, flooring & cabinetry installed",
                "Elevator and life-safety systems integrated testing complete",
                "City Building Inspection passed: Certificate of Occupancy (CO) issued"
            ],
            budget_allocation_pct=16.0
        ),
    ]
    
    risks = [
        RiskItem(
            risk="Subsurface ground anomalies or unmapped utility conflicts",
            probability="Medium",
            impact="High",
            mitigation="Ground-penetrating radar (GPR) scan prior to bulk excavation; 10% geotechnical budget contingency."
        ),
        RiskItem(
            risk="Supply chain lead times for specialized MEP switchgear and elevators",
            probability="High",
            impact="High",
            mitigation="Issue early procurement orders during Phase 1 with bonded manufacturer storage."
        ),
        RiskItem(
            risk="Adverse weather interruptions (heavy precipitation / high wind)",
            probability="Medium",
            impact="Medium",
            mitigation="Incorporate 12 weather buffer contingency days into CPM schedule float calculations."
        ),
        RiskItem(
            risk="Subcontractor craft labor shortages",
            probability="Medium",
            impact="Medium",
            mitigation="Execute multi-prime contracts with performance retention bonds and overtime acceleration clauses."
        )
    ]
    
    recommendations = [
        f"Implement Weekly Work Plans (WWP) and Last Planner System (LPS) across all {floors} floor levels to protect critical path.",
        "Establish concrete batch plant reserve contracts to guarantee continuous pours during Phase 2 and 3.",
        "Mandate digital 4D BIM clash detection prior to MEP rough-in commencement to eliminate costly rework."
    ]
    
    return ProjectPlanResponse(
        project_name=req.project_name,
        project_type=req.project_type,
        estimated_total_weeks=total_weeks,
        estimated_budget_usd=req.target_budget_usd,
        phases=phases,
        risk_contingency_matrix=risks,
        key_recommendations=recommendations
    )

async def generate_project_plan(req: ProjectPlanRequest) -> ProjectPlanResponse:
    """Generate construction project plan using Gemini or CPM scheduling algorithm."""
    user_prompt = f"""
    Generate an exhaustive, realistic construction project schedule and Work Breakdown Structure.
    Project Name: {req.project_name}
    Typology: {req.project_type}
    Total Area: {req.total_built_up_area_sqft} sqft
    Budget: ${req.target_budget_usd:,.2f} USD
    Target Duration: {req.target_duration_months} months
    Location: {req.location}
    Floors: {req.floors}
    Subsurface: {req.soil_condition}
    Calculate exact week spans, critical path activities, workforce requirements, risk contingency matrix, and managerial directives.
    """
    
    ai_data = await generate_multimodal_content(
        prompt=user_prompt,
        image=None,
        system_instruction=PLANNING_SYSTEM_PROMPT
    )
    
    if ai_data:
        try:
            return ProjectPlanResponse(**ai_data)
        except Exception as e:
            logger.warning(f"Error parsing Gemini planning response: {e}. Falling back to CPM engine.")
            
    return generate_deterministic_plan(req)
