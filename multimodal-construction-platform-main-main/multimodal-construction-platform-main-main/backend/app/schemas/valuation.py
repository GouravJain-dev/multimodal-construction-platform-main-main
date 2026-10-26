from typing import List, Optional, Literal
from pydantic import BaseModel, Field
from datetime import datetime

class MarketValueRange(BaseModel):
    min_value: float
    median_value: float
    max_value: float
    currency: str = "USD"

class CostBreakdown(BaseModel):
    construction_cost: float
    land_share_value: float
    developer_margin_overhead: float

class InvestmentMetrics(BaseModel):
    projected_monthly_rental: float
    gross_rental_yield_pct: float
    estimated_cap_rate_pct: float
    forecasted_5yr_appreciation_pct: float

class ValuationRequest(BaseModel):
    property_type: Literal[
        "Residential Single-Family", "Residential High-Rise", 
        "Commercial Office", "Retail Storefront", "Industrial Warehouse"
    ] = Field(default="Residential High-Rise")
    built_up_area_sqft: float = Field(default=2400, gt=0)
    bedrooms: Optional[int] = Field(default=3, ge=0)
    bathrooms: Optional[int] = Field(default=3, ge=0)
    construction_quality: Literal["Standard", "Premium", "Ultra-Luxury"] = Field(default="Premium")
    age_years: int = Field(default=0, ge=0)
    location_tier: Literal["Prime Urban Core", "Suburban Growth Corridor", "Outer Metropolitan", "Industrial Zone"] = Field(
        default="Prime Urban Core"
    )
    amenities: List[str] = Field(
        default_factory=lambda: ["Underground Parking", "Swimming Pool", "24/7 Power Backup", "Gymnasium", "LEED Certified"]
    )
    land_area_sqft: Optional[float] = Field(default=3000, gt=0)

class ValuationResponse(BaseModel):
    property_type: str
    estimated_market_value: MarketValueRange
    price_per_sqft: float
    cost_breakdown: CostBreakdown
    investment_metrics: InvestmentMetrics
    comparative_market_insights: List[str]
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
