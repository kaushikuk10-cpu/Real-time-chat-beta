from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from app.database import get_db, SessionLocal
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
        result.append(MessageResponse(
            id=msg.id,
            content=msg.content,
            sender_id=msg.sender_id,
            room_id=msg.room_id,
            is_read=msg.is_read,
            created_at=msg.created_at,
            sender_username=sender.username if sender else "unknown"
        ))
    return result


@router.websocket("/ws/{room_id}/{username}")
async def websocket_endpoint(
    websocket: WebSocket,
    room_id: int,
    username: str
):
    db = SessionLocal()
    producer = None

    try:
        await manager.connect(websocket, room_id, username)

        user = db.query(User).filter(User.username == username).first()
        if not user:
            await websocket.close(code=4001)
            return

        user.is_online = True
        db.commit()

        await manager.broadcast_to_room(room_id, {
            "type": "system",
            "content": f"{username} joined the room",
            "username": "System",
            "room_id": room_id
        }, exclude=websocket)

        producer = await get_kafka_producer()

        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)

            message = Message(
                content=message_data["content"],
                sender_id=user.id,
                room_id=room_id,
                is_read=False
            )
            db.add(message)
            db.commit()
            db.refresh(message)

            kafka_message = {
                "id": message.id,
                "content": message.content,
                "username": username,
                "room_id": room_id,
                "type": "message",
                "created_at": message.created_at.isoformat()
            }

            await producer.send("chat-messages", value=kafka_message)
            await manager.broadcast_to_room(room_id, kafka_message)

    except WebSocketDisconnect:
        manager.disconnect(websocket, room_id, username)
        user = db.query(User).filter(User.username == username).first()
        if user:
            user.is_online = False
            db.commit()
        await manager.broadcast_to_room(room_id, {
            "type": "system",
            "content": f"{username} left the room",
            "username": "System",
            "room_id": room_id
        })
    except Exception as e:
        print(f"WebSocket error: {e}")
        manager.disconnect(websocket, room_id, username)
    finally:
        if producer:
            await producer.stop()
        db.close()