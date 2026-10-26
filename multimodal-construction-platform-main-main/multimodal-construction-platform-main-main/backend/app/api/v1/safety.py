import logging
from typing import Optional
from fastapi import APIRouter, File, UploadFile, Form, HTTPException
from app.schemas.safety import SafetyAnalysisRequest, SafetyAnalysisResponse
from app.services.safety_service import analyze_site_safety
from app.utils.image_processing import load_image_from_bytes, load_image_from_base64, resize_for_inference

router = APIRouter()
logger = logging.getLogger("safety_router")

@router.post("/analyze", response_model=SafetyAnalysisResponse, summary="Analyze site safety from image file")
@router.post("/audit", response_model=SafetyAnalysisResponse, summary="Audit site safety (alias)")
async def analyze_safety_upload(
    file: UploadFile = File(...),
    project_name: Optional[str] = Form("Skyline Heights Tower B (Commercial Core)"),
    site_zone: Optional[str] = Form("Scaffolding Zone B - Level 4"),
    target_fall_arrest: bool = Form(True),
    target_guardrails: bool = Form(True),
    target_ppe: bool = Form(True),
    target_plank_deflection: bool = Form(True)
):
    try:
        contents = await file.read()
        if not contents:
            raise HTTPException(status_code=400, detail="Empty file uploaded.")
        image = load_image_from_bytes(contents)
        image = resize_for_inference(image)
        return await analyze_site_safety(
            image=image, 
            project_name=project_name, 
            site_zone=site_zone,
            target_fall_arrest=target_fall_arrest,
            target_guardrails=target_guardrails,
            target_ppe=target_ppe,
            target_plank_deflection=target_plank_deflection
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing safety image upload: {e}")
        raise HTTPException(status_code=500, detail=f"Safety inspection failed: {str(e)}")

@router.post("/analyze-json", response_model=SafetyAnalysisResponse, summary="Analyze site safety from base64 JSON payload")
async def analyze_safety_json(payload: SafetyAnalysisRequest):
    try:
        image = None
        if payload.image_base64 and len(payload.image_base64) > 100:
            image = load_image_from_base64(payload.image_base64)
            image = resize_for_inference(image)
        return await analyze_site_safety(
            image=image, 
            project_name=payload.project_name, 
            site_zone=payload.site_zone,
            target_fall_arrest=payload.target_fall_arrest,
            target_guardrails=payload.target_guardrails,
            target_ppe=payload.target_ppe,
            target_plank_deflection=payload.target_plank_deflection
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing safety JSON: {e}")
        raise HTTPException(status_code=500, detail=f"Safety inspection failed: {str(e)}")
