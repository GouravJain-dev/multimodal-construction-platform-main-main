from typing import List, Optional, Literal
from pydantic import BaseModel, Field
from datetime import datetime

class CrackAnalysisRequest(BaseModel):
    structural_element: Literal["Beam", "Column", "Slab", "Retaining Wall", "Foundation", "Masonry Wall"] = Field(
        default="Beam", description="Structural component type"
    )
    concrete_grade: Optional[str] = Field(default="M25 / 3500 PSI", description="Specified concrete design grade")
    image_base64: Optional[str] = Field(default=None, description="Base64 encoded structural image")

class CrackAnalysisResponse(BaseModel):
    structural_element: str
    crack_detected: bool
    crack_classification: Literal[
        "Shear Crack", "Flexural Crack", "Settlement Crack", "Thermal / Shrinkage Crack", 
        "Corrosion Spalling", "Hairline Surface Crazing", "No Significant Cracking"
    ]
    estimated_width_mm: float = Field(..., ge=0.0, description="Estimated maximum crack width in millimeters")
    severity: Literal["Negligible", "Minor", "Moderate", "Severe", "Critical"]
    structural_risk_rating: Literal["Low", "Medium", "High", "Critical"]
    cause_analysis: str = Field(..., description="Root cause engineering explanation")
    code_reference: str = Field(..., description="Relevant design code (e.g. ACI 318, IS 456, Eurocode 2)")
    immediate_actions: List[str] = Field(..., description="Urgent safety actions (shoring, load reduction, etc.)")
    remediation_protocol: List[str] = Field(..., description="Permanent structural repair procedure")
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
