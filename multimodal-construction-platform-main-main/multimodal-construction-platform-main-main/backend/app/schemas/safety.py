from typing import List, Optional, Literal
from pydantic import BaseModel, Field, field_validator
from datetime import datetime

class BoundingBox(BaseModel):
    x: float = Field(..., ge=0.0, le=1.0, description="Normalized top-left X (0.0 to 1.0)")
    y: float = Field(..., ge=0.0, le=1.0, description="Normalized top-left Y (0.0 to 1.0)")
    w: float = Field(..., ge=0.0, le=1.0, description="Normalized box width (0.0 to 1.0)")
    h: float = Field(..., ge=0.0, le=1.0, description="Normalized box height (0.0 to 1.0)")

    @field_validator("x", "y", "w", "h", mode="before")
    @classmethod
    def clamp_normalized(cls, v):
        try:
            val = float(v)
            return max(0.0, min(1.0, val))
        except (ValueError, TypeError):
            return 0.0

class DetectionItem(BaseModel):
    id: str
    type: Literal["worker", "hazard", "ppe"]
    label: str
    severity: Literal["Critical", "High", "Moderate", "Low", "OK", "Unverified"]
    confidence: float = Field(..., ge=0.0, le=1.0)
    bbox: BoundingBox
    verifiable: bool = Field(default=True, description="False for distant or occluded subjects where safety gear cannot be evaluated")
    description: Optional[str] = Field(default=None, description="Detailed explanation of finding")
    infraction_id: Optional[str] = Field(default=None, description="Linked infraction ID if applicable")

class InfractionItem(BaseModel):
    id: str
    severity: Literal["CRITICAL", "MODERATE", "LOW"]
    osha_standard: str
    location: str
    description: str

class CorrectiveActionStep(BaseModel):
    step_number: str
    category: str
    title: str
    description: str

class SafetyAnalysisRequest(BaseModel):
    project_name: Optional[str] = Field(default="Skyline Heights Tower B (Commercial Core)")
    site_zone: Optional[str] = Field(default="Scaffolding Zone B - Level 4")
    image_base64: Optional[str] = Field(default=None)
    target_fall_arrest: bool = Field(default=True)
    target_guardrails: bool = Field(default=True)
    target_ppe: bool = Field(default=True)
    target_plank_deflection: bool = Field(default=True)

class SafetyAnalysisResponse(BaseModel):
    project_name: str
    site_zone: str
    hazard_score: int = Field(84, ge=0, le=100)
    fall_risk_pct: int = Field(88, ge=0, le=100)
    scaffold_defect_pct: int = Field(42, ge=0, le=100)
    workers_detected: int = Field(..., ge=0)
    ppe_compliance_pct: int = Field(..., ge=0, le=100)
    hazards_count: int = Field(..., ge=0)
    detections: List[DetectionItem]
    infractions: List[InfractionItem]
    actions: List[CorrectiveActionStep]
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
