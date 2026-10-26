from typing import List, Optional, Literal
from pydantic import BaseModel, Field
from datetime import datetime

class ChatMessage(BaseModel):
    role: Literal["user", "assistant", "system"]
    content: str

class ChatMessageRequest(BaseModel):
    message: str = Field(..., min_length=1, description="User question or engineering inquiry")
    conversation_history: Optional[List[ChatMessage]] = Field(default_factory=list)

class ChatMessageResponse(BaseModel):
    response: str
    citations: List[str]
    suggested_followups: List[str]
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
