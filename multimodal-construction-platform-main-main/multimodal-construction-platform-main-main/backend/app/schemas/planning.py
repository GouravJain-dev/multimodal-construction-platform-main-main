from typing import List, Optional, Literal
from pydantic import BaseModel, Field
from datetime import datetime

class ConstructionPhase(BaseModel):
    phase_id: str
    phase_name: str
    duration_weeks: int = Field(..., ge=1)
    start_week: int = Field(..., ge=1)
    end_week: int = Field(..., ge=1)
    critical_path: bool
    labor_headcount: int = Field(..., ge=1)
    milestones: List[str]
    budget_allocation_pct: float = Field(..., ge=0, le=100)

class RiskItem(BaseModel):
    risk: str
    probability: Literal["Low", "Medium", "High"]
    impact: Literal["Low", "Medium", "High", "Critical"]
    mitigation: str

class ProjectPlanRequest(BaseModel):
    project_name: str = Field(default="Apex Commercial Complex", description="Project title")
    project_type: Literal["Residential", "Commercial", "Industrial", "Infrastructure"] = Field(
        default="Commercial", description="Building typology"
    )
    total_built_up_area_sqft: float = Field(default=45000, gt=0, description="Gross floor area in sqft")
    target_budget_usd: float = Field(default=3200000, gt=0, description="Estimated capital budget in USD")
    target_duration_months: int = Field(default=14, ge=2, le=120, description="Target timeline in months")
    location: str = Field(default="Dallas, TX", description="Geographic jurisdiction")
    soil_condition: Optional[str] = Field(default="Standard Clay / Sandy Silt", description="Subsurface condition")
    floors: int = Field(default=4, ge=1, description="Number of above-ground floors")

class ProjectPlanResponse(BaseModel):
    project_name: str
    project_type: str
    estimated_total_weeks: int
    estimated_budget_usd: float
    phases: List[ConstructionPhase]
    risk_contingency_matrix: List[RiskItem]
    key_recommendations: List[str]
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
