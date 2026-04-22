from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine
from app.models import user, room, message
from app.routers import auth, rooms, messages

user.Base.metadata.create_all(bind=engine)
room.Base.metadata.create_all(bind=engine)
message.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Realtime Chat API",
    description="A production-grade real-time chat application with WebSockets and Kafka",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(rooms.router)
app.include_router(messages.router)

@app.get("/")
def root():
    return {"message": "Realtime Chat API is running"}

@app.get("/health")
def health():
    return {"status": "healthy"}