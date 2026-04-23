# 💬 Realtime Chat Application

![CI](https://github.com/kaushikuk10-cpu/Real-time-chat-beta/actions/workflows/ci.yml/badge.svg)

A production-grade real-time chat application built with **FastAPI**, **WebSockets**, **Apache Kafka**, **PostgreSQL**, and **React**. Features JWT authentication, persistent message history, multiple chat rooms, online presence indicators, and a full CI/CD pipeline.

---

## Architecture

```
┌─────────────────┐     WebSocket      ┌──────────────────┐
│  React Frontend  │ ◄────────────────► │  FastAPI Backend  │
│  (Vite + React)  │     REST API       │  (Python 3.13)   │
└─────────────────┘                    └────────┬─────────┘
                                                │
                                    ┌───────────▼──────────┐
                                    │    Apache Kafka       │
                                    │   (Message Broker)    │
                                    └───────────┬──────────┘
                                                │
                                    ┌───────────▼──────────┐
                                    │      PostgreSQL       │
                                    │   (Message History)   │
                                    └──────────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, React Router, Axios |
| Backend | Python 3.13, FastAPI, Uvicorn |
| Real-time | WebSockets, Apache Kafka (aiokafka) |
| Auth | JWT (python-jose), bcrypt |
| Database | PostgreSQL 15, SQLAlchemy ORM |
| Infrastructure | Docker, Docker Compose |
| CI/CD | GitHub Actions |
| API Docs | Swagger/OpenAPI (auto-generated) |

---

## Features

- **Real-time messaging** via WebSockets — messages delivered instantly across all connected clients
- **Apache Kafka** message broker for reliable, scalable async event processing
- **JWT Authentication** — register, login, and access protected routes with Bearer tokens
- **Multiple chat rooms** — create, join, and switch between rooms
- **Message history** — all messages persisted to PostgreSQL and loaded on room join
- **Online presence** — live online user count per room
- **User avatars** — colour-coded initials generated from username
- **Responsive UI** — clean React frontend with dark sidebar and chat layout
- **Kafka UI** — visual dashboard for monitoring message flow at `localhost:8090`

---

## Getting Started

### Prerequisites
- Docker Desktop
- Python 3.13+
- Node.js 22+

### 1. Clone the repo

```bash
git clone https://github.com/kaushikuk10-cpu/Real-time-chat-beta.git
cd Real-time-chat-beta
```

### 2. Configure environment

Create a `.env` file in the root:

```
DATABASE_URL=postgresql://chatuser:chatpass@localhost:5432/chatdb
SECRET_KEY=your-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
KAFKA_BOOTSTRAP_SERVERS=localhost:9092
KAFKA_TOPIC=chat-messages
```

### 3. Start infrastructure (Kafka + PostgreSQL)

```bash
docker-compose up -d
```

Verify all 4 containers are running:

```bash
docker-compose ps
```

You should see `chat_postgres`, `chat_zookeeper`, `chat_kafka`, and `chat_kafka_ui` all with status `Up`.

### 4. Start the backend

```bash
python -m venv venv
venv\Scripts\activate        # Windows
source venv/bin/activate     # Mac/Linux
pip install -r requirements.txt
uvicorn app.main:app --reload
```

- API: `http://localhost:8000`
- Swagger docs: `http://localhost:8000/docs`

### 5. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

- App: `http://localhost:5173`

### 6. Monitor Kafka

- Kafka UI: `http://localhost:8090`

---

## API Endpoints

### Authentication

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | No | Register new user |
| POST | `/api/auth/login` | No | Login and get JWT token |
| GET | `/api/auth/me` | Yes | Get current user profile |

### Rooms

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/rooms/` | Yes | List all rooms with online count |
| POST | `/api/rooms/` | Yes | Create new room |
| POST | `/api/rooms/{id}/join` | Yes | Join a room |

### Messages

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/rooms/{id}/messages` | Yes | Get message history (last 50) |
| WS | `/api/ws/{room_id}/{username}` | No | WebSocket real-time connection |

---

## WebSocket Protocol

Connect to: `ws://localhost:8000/api/ws/{room_id}/{username}`

**Send a message:**
```json
{
  "content": "Hello world!"
}
```

**Receive a message:**
```json
{
  "id": 1,
  "content": "Hello world!",
  "username": "kaushik",
  "room_id": 1,
  "type": "message",
  "created_at": "2026-04-22T11:54:33"
}
```

**System events** (user join/leave):
```json
{
  "type": "system",
  "content": "kaushik joined the room",
  "username": "System",
  "room_id": 1
}
```

---

## Project Structure

```
realtime-chat/
├── app/
│   ├── main.py                  # FastAPI app, CORS, router registration
│   ├── database.py              # SQLAlchemy engine and session
│   ├── auth.py                  # JWT + bcrypt authentication
│   ├── kafka_client.py          # Kafka producer/consumer
│   ├── models/
│   │   ├── user.py              # User ORM model
│   │   ├── room.py              # Room + RoomMember ORM models
│   │   └── message.py           # Message ORM model
│   ├── schemas/
│   │   ├── user.py              # Pydantic user schemas
│   │   ├── room.py              # Pydantic room schemas
│   │   └── message.py           # Pydantic message schemas
│   ├── routers/
│   │   ├── auth.py              # Auth endpoints
│   │   ├── rooms.py             # Room endpoints
│   │   └── messages.py          # Message endpoints + WebSocket
│   └── websockets/
│       └── manager.py           # WebSocket connection manager
├── frontend/
│   └── src/
│       ├── App.jsx              # Root component + routing
│       ├── App.css              # Global styles
│       └── components/
│           ├── Login.jsx        # Login + register UI
│           └── Chat.jsx         # Main chat UI
├── tests/
│   └── test_health.py           # API health + auth tests
├── docker-compose.yml           # PostgreSQL + Kafka + Zookeeper + Kafka UI
├── Dockerfile                   # Backend container
├── requirements.txt             # Python dependencies
└── .github/
    └── workflows/
        └── ci.yml               # GitHub Actions CI pipeline
```

---

## CI/CD Pipeline

Every push to `main` automatically:

1. Spins up a PostgreSQL service container
2. Installs Python 3.13 and all dependencies
3. Creates CI environment variables
4. Lints backend code with flake8
5. Tests database connectivity
6. Runs full API test suite (health, register, login)
7. Builds the React frontend with Vite
8. Uploads the compiled frontend as a downloadable artifact

---

## Screenshots

### Login Page
Clean authentication UI with register/login toggle.

### Chat Interface
- Dark sidebar with room list and online badges
- Colour-coded user avatars
- Real-time message delivery
- Online user count per room
- Message timestamps

### Kafka UI
Visual dashboard at `localhost:8090` showing live message flow through the `chat-messages` topic.

---

## Author

**Kaushik Krishnananda Prabhu** — [GitHub](https://github.com/kaushikuk10-cpu)

---

## License

This project is open source and available under the [MIT License](LICENSE).