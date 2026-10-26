import logging
from fastapi import APIRouter, HTTPException
from app.schemas.daily_log import DailyLogRequest, DailyLogResponse
from app.services.daily_log_service import process_daily_log

router = APIRouter()
logger = logging.getLogger("daily_log_router")

@router.post("/process", response_model=DailyLogResponse, summary="Process daily supervisor site logs")
async def process_log(payload: DailyLogRequest):
    try:
        return await process_daily_log(payload)
    except Exception as e:
        logger.error(f"Error processing daily log: {e}")
        raise HTTPException(status_code=500, detail=f"Daily log processing failed: {str(e)}")
