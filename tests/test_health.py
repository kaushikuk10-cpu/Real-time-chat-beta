import pytest
from fastapi.testclient import TestClient
import os

os.environ["DATABASE_URL"] = "postgresql://chatuser:chatpass@localhost:5432/chatdb"
os.environ["SECRET_KEY"] = "test-secret-key"
os.environ["ALGORITHM"] = "HS256"
os.environ["ACCESS_TOKEN_EXPIRE_MINUTES"] = "30"
os.environ["KAFKA_BOOTSTRAP_SERVERS"] = "localhost:9092"
os.environ["KAFKA_TOPIC"] = "chat-messages"

from app.main import app

client = TestClient(app)


def test_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Realtime Chat API is running"}


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}


def test_register_and_login():
    import uuid
    unique = str(uuid.uuid4())[:8]
    user = {
        "username": f"testuser_{unique}",
        "email": f"test_{unique}@test.com",
        "password": "testpass123"
    }
    reg = client.post("/api/auth/register", json=user)
    assert reg.status_code == 200
    assert reg.json()["username"] == user["username"]

    login = client.post("/api/auth/login", json={
        "username": user["username"],
        "password": "testpass123"
    })
    assert login.status_code == 200
    assert "access_token" in login.json()