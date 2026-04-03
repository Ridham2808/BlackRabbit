# 🛡️ Defence Equipment Accountability System (DEAS)

> Full-stack military equipment tracking system with real-time GPS, QR scanning, biometric auth, AI anomaly detection, and complete audit chain-of-custody.

**Stack:** React 18 + Vite · Node.js 20 + Express · Python FastAPI · PostgreSQL (Neon) + pgvector · React Native Expo · Redis · Docker

---

## 🚀 Quick Start

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running
- Node.js 20 LTS
- Python 3.11+

### 1. Clone & configure
```bash
git clone https://github.com/Ridham2808/BlackRabbit.git
cd BlackRabbit
cp .env.example .env   # all dev values are pre-filled
```

### 2. Start Redis (Docker)
```bash
docker run -d --name deas_redis --restart unless-stopped \
  -p 6380:6379 \
  -v deas_redis_data:/data \
  redis:7-alpine redis-server \
  --requirepass "deas_redis_str0ng_pass" \
  --maxmemory 256mb --maxmemory-policy allkeys-lru --save 60 1
```

### 3. Run the database schema on Neon
```bash
# Install psql or use Neon console → SQL Editor
psql "$DATABASE_DIRECT_URL" -f db/init.sql
psql "$DATABASE_DIRECT_URL" -f db/seed.sql
```

### 4. Start all services
```bash
# Development (Redis only in Docker, services run via npm)
docker compose up redis        # Redis on port 6380

cd backend  && npm install && npm run dev   # :5000
cd web      && npm install && npm run dev   # :3000
cd ai-service && pip install -r requirements.txt && uvicorn main:app --port 8001

# OR full Docker (when Dockerfiles are ready)
docker compose up
```

---

## 🗂️ Project Structure

```
BlackRabbit/
├── docker-compose.yml          # All 5 services
├── .env.example                # All env vars (copy to .env)
├── db/
│   ├── init.sql                # Full schema — 16 tables + pgvector
│   └── seed.sql                # Demo data — 15 users, 20 equipment
├── web/                        # React 18 + Vite + Tailwind (Layer 1)
├── mobile/                     # React Native Expo (Layer 2)
├── backend/                    # Node.js + Express API (Layer 3)
├── ai-service/                 # Python FastAPI AI (Layer 4)
└── nginx/                      # Reverse proxy config
```

---

## 🔐 Demo Login Credentials

| Role | Email | Password |
|---|---|---|
| Super Admin | arjun.mehta@deas.mil | Deas@2024! |
| Base Admin | priya.sharma@deas.mil | Deas@2024! |
| Officer | vikram.singh@deas.mil | Deas@2024! |
| Quartermaster | deepak.patel@deas.mil | Deas@2024! |
| Auditor | suresh.iyer@deas.mil | Deas@2024! |
| Soldier | karan.gupta@deas.mil | Deas@2024! |

---

## 🏗️ Architecture

```
React Web App  ──┐
                 ├──► Node.js API ──► Python AI Service
React Native   ──┘        │                  │
(Expo Mobile)         Socket.io          pgvector
                           │
                    PostgreSQL (Neon) + Redis (Docker)
```

---

## 🐳 Docker Services

| Service | Port | Description |
|---|---|---|
| `deas_redis` | 6380 | Redis 7 — sessions, cache, rate limiting |
| `backend` | 5000 | Node.js Express API |
| `ai-service` | 8001 | Python FastAPI AI (internal) |
| `web` | 3000 | React Vite dev server |
| `nginx` | 80/443 | Reverse proxy (production only) |

---

## 📦 Environment Setup

All values are in `.env.example`. Key ones:

| Variable | Value |
|---|---|
| `DATABASE_URL` | Neon.tech PostgreSQL pooler URL |
| `REDIS_URL` | `redis://:deas_redis_str0ng_pass@localhost:6380/0` |
| `JWT_ACCESS_SECRET` | Change in production! |
| `EXPO_PUBLIC_API_URL` | Set to your machine's local IP |

---

## 📋 Implementation Progress

- [x] Phase 1 — Foundation (DB schema, Docker, env config)
- [ ] Phase 2 — Node.js Backend API
- [ ] Phase 3 — Python AI Service
- [ ] Phase 4 — React Web App
- [ ] Phase 5 — React Native Mobile App
- [ ] Phase 6 — Integration & Testing
- [ ] Phase 7 — Production Readiness