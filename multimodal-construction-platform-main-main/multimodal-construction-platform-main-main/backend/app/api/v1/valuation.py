import logging
from fastapi import APIRouter, HTTPException
from app.schemas.valuation import ValuationRequest, ValuationResponse
from app.services.valuation_service import calculate_real_estate_valuation

router = APIRouter()
logger = logging.getLogger("valuation_router")

@router.post("/calculate", response_model=ValuationResponse, summary="Calculate real estate valuation and investment metrics")
async def calculate_valuation(payload: ValuationRequest):
    try:
        return await calculate_real_estate_valuation(payload)
    except Exception as e:
        logger.error(f"Error calculating real estate valuation: {e}")
        raise HTTPException(status_code=500, detail=f"Valuation calculation failed: {str(e)}")
