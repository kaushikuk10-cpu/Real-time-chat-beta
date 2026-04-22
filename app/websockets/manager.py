from fastapi import WebSocket
from typing import Dict, Set
import json

class ConnectionManager:
    def __init__(self):
        # room_id -> set of websockets
        self.active_connections: Dict[int, Set[WebSocket]] = {}
        # username -> websocket
        self.user_connections: Dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket, room_id: int, username: str):
        await websocket.accept()
        if room_id not in self.active_connections:
            self.active_connections[room_id] = set()
        self.active_connections[room_id].add(websocket)
        self.user_connections[username] = websocket

    def disconnect(self, websocket: WebSocket, room_id: int, username: str):
        if room_id in self.active_connections:
            self.active_connections[room_id].discard(websocket)
        self.user_connections.pop(username, None)

    async def broadcast_to_room(self, room_id: int, message: dict, exclude: WebSocket = None):
        if room_id in self.active_connections:
            dead = set()
            for connection in self.active_connections[room_id]:
                if connection == exclude:
                    continue
                try:
                    await connection.send_text(json.dumps(message))
                except Exception:
                    dead.add(connection)
            self.active_connections[room_id] -= dead

    async def send_to_user(self, username: str, message: dict):
        if username in self.user_connections:
            try:
                await self.user_connections[username].send_text(json.dumps(message))
            except Exception:
                self.user_connections.pop(username, None)

    def get_online_users_in_room(self, room_id: int) -> int:
        return len(self.active_connections.get(room_id, set()))

manager = ConnectionManager()