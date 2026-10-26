from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import datetime, date as dt_date

class DelayBottleneckItem(BaseModel):
    issue: str
    delay_hours: float = Field(..., ge=0)
    impact: str

class DailyLogRequest(BaseModel):
    date: str = Field(default_factory=lambda: dt_date.today().isoformat())
    supervisor_name: str = Field(default="Marcus Vance", description="Site engineer/supervisor name")
    raw_field_notes: str = Field(
        ..., min_length=10, 
        description="Free-form supervisor notes on work done, delays, labor, deliveries"
    )
    workforce_headcount: int = Field(default=35, ge=1)
    weather_observed: Optional[str] = Field(default="Clear, 28°C", description="Site weather note")

class DailyLogResponse(BaseModel):
    date: str
    supervisor_name: str
    executive_summary: str
    progress_highlights: List[str]
    delays_and_bottlenecks: List[DelayBottleneckItem]
    safety_infractions: List[str]
    next_day_punch_list: List[str]
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
