import logging
from fastapi import APIRouter, HTTPException
from app.schemas.planning import ProjectPlanRequest, ProjectPlanResponse
from app.services.planning_service import generate_project_plan

router = APIRouter()
logger = logging.getLogger("planning_router")

@router.post("/generate", response_model=ProjectPlanResponse, summary="Generate phased construction project plan")
async def create_plan(payload: ProjectPlanRequest):
    try:
        return await generate_project_plan(payload)
    except Exception as e:
        logger.error(f"Error generating construction plan: {e}")
        raise HTTPException(status_code=500, detail=f"Planning generation failed: {str(e)}")
