from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class MessageCreate(BaseModel):
    content: str
    room_id: int

class MessageResponse(BaseModel):
    id: int
    content: str
    sender_id: int
    room_id: int
    is_read: bool
    created_at: datetime
    sender_username: Optional[str] = None

    class Config:
        from_attributes = True