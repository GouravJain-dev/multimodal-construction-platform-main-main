from typing import List, Literal
from pydantic import BaseModel, Field
from datetime import datetime

class TradeAdvisory(BaseModel):
    trade: str
    status: Literal["Safe", "Caution", "Unsafe"]
    risk_factors: List[str]
    mandatory_measures: List[str]

class WeatherAdvisoryRequest(BaseModel):
    temperature_c: float = Field(default=34.0, description="Ambient temperature in Celsius")
    humidity_pct: float = Field(default=45.0, ge=0, le=100, description="Relative humidity percentage")
    precipitation_chance_pct: float = Field(default=20.0, ge=0, le=100, description="Probability of rain/snow")
    wind_speed_kmh: float = Field(default=22.0, ge=0, description="Sustained wind speed in km/h")
    uv_index: float = Field(default=8.0, ge=0, description="Solar UV index")
    scheduled_trades: List[str] = Field(
        default_factory=lambda: [
            "Concrete Pouring & Curing", 
            "Tower Crane & Aerial Hoists", 
            "External Painting & Waterproofing", 
            "Deep Excavation & Earthwork", 
            "High-Elevation Roofing & Structural Steel"
        ]
    )

class WeatherAdvisoryResponse(BaseModel):
    overall_site_condition: str
    risk_level: Literal["Safe", "Caution", "Unsafe"]
    trade_advisories: List[TradeAdvisory]
    worker_safety_advisory: str
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
