import logging
from fastapi import APIRouter, HTTPException
from app.schemas.weather import WeatherAdvisoryRequest, WeatherAdvisoryResponse
from app.services.weather_service import generate_weather_advisory

router = APIRouter()
logger = logging.getLogger("weather_router")

@router.post("/advisory", response_model=WeatherAdvisoryResponse, summary="Generate weather-aware construction advisory")
async def get_advisory(payload: WeatherAdvisoryRequest):
    try:
        return await generate_weather_advisory(payload)
    except Exception as e:
        logger.error(f"Error generating weather advisory: {e}")
        raise HTTPException(status_code=500, detail=f"Weather advisory generation failed: {str(e)}")
