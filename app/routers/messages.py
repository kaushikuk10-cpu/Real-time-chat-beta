from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.message import Message
from app.models.user import User
from app.schemas.message import MessageResponse
from app.auth import get_current_user
from app.websockets.manager import manager
from app.kafka_client import get_kafka_producer
from typing import List
import json

router = APIRouter(prefix="/api", tags=["Messages"])

@router.get("/rooms/{room_id}/messages", response_model=List[MessageResponse])
def get_messages(
    room_id: int,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    messages = db.query(Message).filter(
        Message.room_id == room_id
    ).order_by(Message.created_at.desc()).limit(limit).all()
    result = []
    for msg in reversed(messages):
        sender = db.query(User).filter(User.id == msg.sender_id).first()
        result.append({
            **msg.__dict__,
            "sender_username": sender.username if sender else "unknown"
        })
    return result

@router.websocket("/ws/{room_id}/{username}")
async def websocket_endpoint(
    websocket: WebSocket,
    room_id: int,
    username: str,
    db: Session = Depends(get_db)
):
    await manager.connect(websocket, room_id, username)

    # Update user online status
    user = db.query(User).filter(User.username == username).first()
    if user:
        user.is_online = True
        db.commit()

    # Notify others user joined
    await manager.broadcast_to_room(room_id, {
        "type": "system",
        "content": f"{username} joined the room",
        "username": "System",
        "room_id": room_id
    }, exclude=websocket)

    try:
        producer = await get_kafka_producer()
        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)

            # Save to database
            message = Message(
                content=message_data["content"],
                sender_id=user.id if user else 0,
                room_id=room_id,
                is_read=False
            )
            db.add(message)
            db.commit()
            db.refresh(message)

            # Publish to Kafka
            kafka_message = {
                "id": message.id,
                "content": message.content,
                "username": username,
                "room_id": room_id,
                "type": "message",
                "created_at": message.created_at.isoformat()
            }
            await producer.send(
                "chat-messages",
                value=kafka_message
            )

            # Broadcast to all users in room
            await manager.broadcast_to_room(room_id, kafka_message)

        await producer.stop()

    except WebSocketDisconnect:
        manager.disconnect(websocket, room_id, username)
        if user:
            user.is_online = False
            db.commit()
        await manager.broadcast_to_room(room_id, {
            "type": "system",
            "content": f"{username} left the room",
            "username": "System",
            "room_id": room_id
        })