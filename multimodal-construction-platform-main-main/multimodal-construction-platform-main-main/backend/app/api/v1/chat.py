import logging
from fastapi import APIRouter, HTTPException
from app.schemas.chat import ChatMessageRequest, ChatMessageResponse
from app.services.chat_service import get_construction_chat_response

router = APIRouter()
logger = logging.getLogger("chat_router")

@router.post("/message", response_model=ChatMessageResponse, summary="Send message to Construction Knowledge Assistant")
async def chat_message(payload: ChatMessageRequest):
    try:
        return await get_construction_chat_response(payload)
    except Exception as e:
        logger.error(f"Error handling chat message: {e}")
        raise HTTPException(status_code=500, detail=f"Chat processing failed: {str(e)}")
