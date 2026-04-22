from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class RoomCreate(BaseModel):
    name: str
    description: Optional[str] = None

class RoomResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    created_by: int
    created_at: datetime
    online_users: Optional[int] = 0

    class Config:
        from_attributes = True