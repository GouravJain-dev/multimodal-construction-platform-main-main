import logging
from typing import Optional
from fastapi import APIRouter, File, UploadFile, Form, HTTPException
from app.schemas.crack import CrackAnalysisRequest, CrackAnalysisResponse
from app.services.crack_service import analyze_structural_crack
from app.utils.image_processing import load_image_from_bytes, load_image_from_base64, resize_for_inference

router = APIRouter()
logger = logging.getLogger("crack_router")

@router.post("/analyze", response_model=CrackAnalysisResponse, summary="Analyze structural crack from image file")
async def analyze_crack_upload(
    file: UploadFile = File(...),
    structural_element: Optional[str] = Form("Beam"),
    concrete_grade: Optional[str] = Form("M25 / 3500 PSI")
):
    try:
        contents = await file.read()
        if not contents:
            raise HTTPException(status_code=400, detail="Empty file uploaded.")
        image = load_image_from_bytes(contents)
        image = resize_for_inference(image)
        return await analyze_structural_crack(
            image=image, 
            structural_element=structural_element, 
            concrete_grade=concrete_grade
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing crack image upload: {e}")
        raise HTTPException(status_code=500, detail=f"Crack inspection failed: {str(e)}")

@router.post("/analyze-json", response_model=CrackAnalysisResponse, summary="Analyze structural crack from base64 JSON")
async def analyze_crack_json(payload: CrackAnalysisRequest):
    try:
        image = None
        if payload.image_base64 and len(payload.image_base64) > 100:
            try:
                image = load_image_from_base64(payload.image_base64)
                image = resize_for_inference(image)
            except Exception as img_err:
                logger.warning(f"Could not decode crack image: {img_err}. Proceeding with calibrated analysis.")
        return await analyze_structural_crack(
            image=image, 
            structural_element=payload.structural_element, 
            concrete_grade=payload.concrete_grade
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing crack JSON: {e}")
        raise HTTPException(status_code=500, detail=f"Crack inspection failed: {str(e)}")
