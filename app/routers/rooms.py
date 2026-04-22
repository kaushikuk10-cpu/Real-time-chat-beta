from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.room import Room, RoomMember
from app.models.user import User
from app.schemas.room import RoomCreate, RoomResponse
from app.auth import get_current_user
from app.websockets.manager import manager
from typing import List

router = APIRouter(prefix="/api/rooms", tags=["Rooms"])

@router.post("/", response_model=RoomResponse)
def create_room(
    room_data: RoomCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if db.query(Room).filter(Room.name == room_data.name).first():
        raise HTTPException(status_code=400, detail="Room name already exists")
    room = Room(
        name=room_data.name,
        description=room_data.description,
        created_by=current_user.id
    )
    db.add(room)
    db.commit()
    db.refresh(room)
    member = RoomMember(room_id=room.id, user_id=current_user.id)
    db.add(member)
    db.commit()
    return {**room.__dict__, "online_users": 0}

@router.get("/", response_model=List[RoomResponse])
def get_rooms(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    rooms = db.query(Room).all()
    return [
        {**r.__dict__, "online_users": manager.get_online_users_in_room(r.id)}
        for r in rooms
    ]

@router.post("/{room_id}/join")
def join_room(
    room_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    existing = db.query(RoomMember).filter(
        RoomMember.room_id == room_id,
        RoomMember.user_id == current_user.id
    ).first()
    if existing:
        return {"message": "Already a member"}
    member = RoomMember(room_id=room_id, user_id=current_user.id)
    db.add(member)
    db.commit()
    return {"message": f"Joined room {room.name}"}