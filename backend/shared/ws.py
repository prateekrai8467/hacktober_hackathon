"""WebSocket connection manager for real-time dashboard updates."""
import json
import logging
from typing import List
from fastapi import WebSocket

logger = logging.getLogger(__name__)

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"Client connected. Active clients: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(f"Client disconnected. Active clients: {len(self.active_connections)}")

    async def broadcast(self, payload_type: str, data: any):
        """Broadcast JSON state to all connected clients."""
        if not self.active_connections:
            return  # No one listening, save CPU

        message = json.dumps({"type": payload_type, "data": data}, default=str)
        escaped_msg = json.dumps(message)  # ensure safe serialization for JSON strings

        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception as e:
                logger.warning(f"Failed to send to client: {e}")
                disconnected.append(connection)

        # Cleanup dead sockets
        for dead in disconnected:
            self.disconnect(dead)

manager = ConnectionManager()
