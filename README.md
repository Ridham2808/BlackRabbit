<div align="center">

# 🛡️ BlackRabbit — Defence Equipment Accountability System

[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![React Native](https://img.shields.io/badge/React_Native-Expo_54-0055FF?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![Firebase](https://img.shields.io/badge/Firebase-RTDB-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)

> **A full-stack, military-grade equipment tracking and accountability platform** with real-time GPS tracking, QR-code-based check-in/check-out, biometric authentication, multi-role access control, offline-first mobile support, incident reporting, and a complete chain-of-custody audit system.

</div>

---

## 👥 TEAM MEMBERS

| ID | Name            | Role                |
|----|-----------------|---------------------|
| 01 | Ridham Patel   | Full Stack Developer |
| 02 | Yasar Khan      | Full Stack Developer |
| 03 | Aditya Raulji    | Frontend Developer  |
| 04 | Rijans Patoliya | Backend Developer   |

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [System Architecture](#-system-architecture)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Roles & Permissions](#-roles--permissions)
- [API Reference](#-api-reference)
- [Database Schema](#-database-schema)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Docker Setup](#-docker-setup)
- [Running Each Service](#-running-each-service)
- [Demo Credentials](#-demo-credentials)
- [Mobile App](#-mobile-app)
- [Web Dashboard](#-web-dashboard)
- [Security](#-security)
- [Contributing](#-contributing)

---

## 🔍 Overview

DEAS is a **military-grade equipment accountability platform** designed for defence units to track, manage, and audit all equipment — from rifles and night-vision devices to vehicles and communication gear.

The system enforces a strict **chain-of-custody** for every item, from issuance to return, across multiple military roles. Every action is immutably logged. Equipment that goes overdue, is flagged for maintenance, or triggers a security breach automatically escalates through the command chain.

**The platform comprises three layers:**
1. **Web Dashboard** — Command & control for officers, admins, quartermasters, and auditors
2. **Mobile App (Expo)** — Field app for soldiers to scan, check out, and track equipment offline
3. **REST API (Node.js)** — Secure backend powering both layers with real-time WebSocket events

---

## ✨ Key Features

### 🔐 Authentication & Access Control
- JWT-based authentication with access + refresh token rotation
- Role-Based Access Control (RBAC) with 8 distinct military roles
- Granular permission system (40+ permissions across 10 domains)
- Officer self-registration flow with base/unit assignment
- Biometric login support on mobile (Face ID / Fingerprint via `expo-local-authentication`)
- Rate-limited login endpoints (5 attempts per 15 minutes)

### 📦 Equipment Management
- Full CRUD with category classification (Weapons, Vehicles, Electronics, etc.)
- Serial number tracking and QR code generation per item
- Equipment status lifecycle: `AVAILABLE → CHECKED_OUT → MAINTENANCE → DECOMMISSIONED`
- Complete custody chain history per equipment item
- Dashboard stats with real-time availability overview

### 📱 QR Scan & Checkout Flow
- Mobile QR scanner using `expo-camera` / `expo-barcode-scanner`
- Web "Digital Tag Station" — displays QR codes for mobile-first scanning
- Weapon confirmation screen with multi-asset selection
- Digital signature capture on checkout/check-in
- Checkout request → sergeant approval → issuance workflow

### 🗺️ Real-Time GPS Tracking
- Live map dashboard powered by **Leaflet** + **React-Leaflet**
- Firebase Realtime Database for sub-second location updates from mobile
- Background location tracking on mobile with `expo-location` + `expo-task-manager`
- Location staleness detection via scheduled background job
- Per-unit and per-soldier gun location history

### 📴 Offline-First Mobile
- `OfflineQueueContext` — all actions queued locally when offline
- Automatic sync when connectivity is restored via `@react-native-community/netinfo`
- Equipment data pre-fetched and cached locally with `AsyncStorage` + `expo-secure-store`
- Sync status screen showing pending/failed queue items

### 🚨 Incident Reporting System
- Multi-asset incident reports (lost, stolen, damaged, misuse)
- Investigation entry log with timestamped entries
- Witness statement capture
- Evidence file uploads (photos, PDFs)
- CO acknowledgment and resolution workflow
- Automatic alert escalation for stolen equipment

### 🔧 Maintenance Management
- Schedule and track maintenance tasks per equipment
- Technician sign-off with timestamps
- Overdue maintenance detection via `node-cron` background job
- Maintenance reminder alerts for upcoming schedules

### 🔄 Inter-Base Transfers
- Transfer request → approval → dispatch → receive workflow
- Full transfer audit trail
- Multi-base scoped access (each admin only sees their base)

### 🔔 Smart Alerts & Escalation
- Auto-generated alerts for: overdue equipment, location staleness, maintenance due, security breaches
- Alert acknowledgment and resolution by role
- Escalation engine — unacknowledged alerts auto-escalate to higher command
- Real-time alert push via Socket.io

### 📊 Reports & Audit
- Audit log for every system action (immutable, with actor metadata)
- PDF export using `jsPDF` + `jspdf-autotable`
- Excel export using `xlsx`
- Equipment reports, checkout history, personnel reports
- Audit log filterable by actor, entity, date range

### 🤖 AI Search (Planned)
- Python FastAPI AI service with `pgvector` for semantic search
- Natural language equipment queries
- Anomaly detection on checkout patterns

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CLIENT LAYER                               │
│                                                                     │
│   ┌─────────────────────────┐    ┌──────────────────────────────┐  │
│   │   React Web Dashboard   │    │  React Native Mobile (Expo)  │  │
│   │   (Vite + TailwindCSS)  │    │  Offline-First Field App     │  │
│   │   Port: 3000            │    │  iOS / Android               │  │
│   └───────────┬─────────────┘    └──────────────┬───────────────┘  │
└───────────────┼──────────────────────────────────┼─────────────────┘
                │  HTTP/REST + WebSocket (Socket.io) │  HTTP/REST
                ▼                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         API LAYER                                   │
│                                                                     │
│           Node.js 20 + Express 4  —  Port: 5000                    │
│                                                                     │
│   Middleware: Helmet · CORS · Rate Limit · JWT Auth · Joi Validate  │
│   Jobs: Overdue Detection · Alert Escalation · Maintenance Remind   │
│   Real-time: Socket.io events (checkout, location, alerts)          │
└────────┬───────────────────────────────────────────┬───────────────┘
         │                                           │
         ▼                                           ▼
┌─────────────────────┐                 ┌────────────────────────┐
│  PostgreSQL (Neon)  │                 │  Redis 7 (Docker)      │
│  Primary Database   │                 │  Sessions · Cache       │
│  pgvector extension │                 │  Rate Limiting · Pub/Sub│
└─────────────────────┘                 └────────────────────────┘
         │
         ▼
┌─────────────────────┐        ┌──────────────────────────────────┐
│  Python FastAPI     │        │  Firebase Realtime Database       │
│  AI Service (8001)  │        │  Live GPS location from mobile    │
│  Semantic search    │        │  Sub-second updates to web map    │
└─────────────────────┘        └──────────────────────────────────┘
```

---

## 🛠️ Tech Stack

### Backend (`/backend`)
| Technology | Purpose |
|---|---|
| **Node.js 20** + **Express 4** | REST API server |
| **PostgreSQL 15** (Neon.tech) | Primary relational database |
| **Redis 7** (Docker) | Session store, caching, rate limiting, pub/sub |
| **Socket.io 4** | Real-time WebSocket events |
| **JWT** (`jsonwebtoken` + `jose`) | Stateless authentication |
| **Bcrypt** | Password hashing |
| **Joi** | Request validation |
| **Multer** | File upload handling (evidence photos) |
| **QRCode** | QR code generation per equipment |
| **node-cron** | Scheduled background jobs |
| **Nodemailer** | Email alerts |
| **Winston** + **daily-rotate-file** | Structured logging |
| **Helmet** | HTTP security headers |
| **express-rate-limit** | Login & API rate limiting |

### Web Dashboard (`/web`)
| Technology | Purpose |
|---|---|
| **React 19** + **Vite 8** | Frontend framework + build tool |
| **TailwindCSS 4** | Utility-first styling |
| **React Router 7** | Client-side routing |
| **TanStack Query 5** | Server state, caching, background refetch |
| **TanStack Table 8** | Feature-rich data tables |
| **Zustand 5** | Global state management |
| **Framer Motion 12** | Animations and transitions |
| **Recharts 3** | Analytics charts and graphs |
| **Leaflet** + **React-Leaflet** | Interactive live tracking map |
| **React Hook Form** + **Zod** | Forms and schema validation |
| **Firebase SDK 12** | Realtime location updates on map |
| **html5-qrcode** | Web-based QR scanner |
| **react-qr-code** + **qrcode** | QR code display generation |
| **jsPDF** + **jspdf-autotable** | PDF report export |
| **xlsx** | Excel report export |
| **react-signature-canvas** | Digital signature capture |
| **Socket.io-client** | Live alerts and real-time updates |
| **Lucide React** | Icon system |

### Mobile App (`/mobile`)
| Technology | Purpose |
|---|---|
| **React Native 0.81** + **Expo 54** | Cross-platform mobile framework |
| **React Navigation 7** | Stack + bottom tab navigation |
| **expo-camera** + **expo-barcode-scanner** | QR code scanning |
| **expo-location** + **expo-task-manager** | Background GPS tracking |
| **expo-local-authentication** | Biometric login (Face ID / Fingerprint) |
| **expo-secure-store** | Encrypted local credential storage |
| **expo-crypto** | Cryptographic operations |
| **expo-linear-gradient** | UI gradient effects |
| **AsyncStorage** | Offline data persistence |
| **NetInfo** | Network connectivity detection |
| **Firebase SDK 12** | Realtime location publishing |
| **react-native-qrcode-svg** | QR code rendering |
| **react-native-signature-canvas** | Signature capture |
| **react-native-reanimated** | Smooth animations |
| **NativeWind** | Tailwind styling for React Native |
| **Lucide React Native** | Icon system |

### Database (`/db`)
| Technology | Purpose |
|---|---|
| **PostgreSQL 15** | 16-table relational schema |
| **pgvector** | AI embedding vectors for semantic search |
| `init.sql` | Full schema — all tables, indexes, constraints |
| `seed.sql` | Demo data — 15 users, 20+ equipment items |
| `/migrations` | Incremental migration scripts |

---

## 📁 Project Structure

```
BlackRabbit/
├── 📄 .env.example                 # Safe env template (copy to .env)
├── 📄 .gitignore                   # Comprehensive ignore rules
├── 📄 docker-compose.yml           # Full 5-service Docker setup
├── 📄 README.md                    # This file
│
├── 🗄️ db/
│   ├── init.sql                    # Full PostgreSQL schema (16 tables)
│   ├── seed.sql                    # Demo seed data
│   ├── setup.js                    # DB setup script
│   └── migrations/
│       ├── feature_9_migration.sql # Incident system migration
│       └── fix_incident_base_id.sql
│
├── 🔧 backend/
│   ├── server.js                   # App entrypoint
│   ├── app.js                      # Express app config, routes mount
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── config/
│       │   ├── database.js          # pg Pool with connection management
│       │   ├── redis.js             # ioredis client
│       │   ├── socket.js            # Socket.io server setup
│       │   ├── rateLimiter.js       # express-rate-limit configs
│       │   ├── logger.js            # Winston logger
│       │   └── corsOptions.js
│       ├── constants/
│       │   ├── roles.js             # 8 military roles
│       │   ├── permissions.js       # 40+ fine-grained permissions
│       │   ├── rolePermissions.js   # Role → permissions mapping
│       │   ├── statusTypes.js
│       │   ├── alertTypes.js
│       │   └── eventNames.js
│       ├── middleware/
│       │   ├── authenticate.js      # JWT verification
│       │   ├── authorize.js         # Permission-based gating
│       │   ├── validateRequest.js   # Joi schema validation
│       │   ├── scopeFilter.js       # Base-scoped data isolation
│       │   ├── errorHandler.js
│       │   ├── requestId.js
│       │   └── offlineSyncHeader.js
│       ├── routes/                  # 17 route files
│       ├── controllers/             # 14 controller files
│       ├── services/                # 12 service files (business logic)
│       ├── queries/                 # 9 SQL query files (raw pg queries)
│       ├── validators/              # Joi schemas for all endpoints
│       ├── jobs/                    # 4 cron background jobs
│       ├── events/                  # Socket.io event emitters
│       └── utils/                  # Helpers: audit, QR, tokens, etc.
│
├── 🌐 web/
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   ├── .env.example
│   └── src/
│       ├── main.jsx                 # App entrypoint
│       ├── App.jsx                  # Router + protected routes
│       ├── pages/
│       │   ├── Dashboard.jsx
│       │   ├── LoginPage.jsx
│       │   ├── CheckoutProcess.jsx
│       │   ├── CheckInProcess.jsx
│       │   ├── OfficerSignup.jsx
│       │   ├── admin/               # Admin panels
│       │   ├── alerts/              # Alert management
│       │   ├── audit/               # Audit log viewer
│       │   ├── checkouts/           # Checkout management
│       │   ├── equipment/           # Equipment CRUD + QR
│       │   ├── incidents/           # Incident reporting
│       │   ├── maintenance/         # Maintenance tracking
│       │   ├── map/                 # Live GPS map
│       │   ├── officer/             # Officer dashboard
│       │   ├── personnel/           # Personnel management
│       │   ├── reports/             # Report generation
│       │   ├── sergeant/            # Sergeant dashboard
│       │   ├── soldier/             # Soldier view
│       │   ├── tracking/            # Asset tracking
│       │   └── transfers/           # Transfer management
│       ├── components/
│       │   ├── layout/              # Navbar, sidebar, layout wrapper
│       │   ├── equipment/           # Equipment-specific components
│       │   ├── incidents/           # Incident viewer components
│       │   ├── ui/                  # Reusable UI primitives
│       │   ├── HandoverQR.jsx       # QR handover component
│       │   ├── RequestEquipmentModal.jsx
│       │   └── ReleaseAssetModal.jsx
│       ├── config/                  # API client (axios), Firebase init
│       ├── services/                # API service layer functions
│       ├── store/                   # Zustand global state
│       └── assets/
│
└── 📱 mobile/
    ├── App.js                       # Navigation setup
    ├── index.js
    ├── app.json
    ├── package.json
    ├── .env.example
    └── src/
        ├── screens/
        │   ├── LoginScreen.js        # Auth with biometric option
        │   ├── HomeScreen.js         # Dashboard + equipment overview
        │   ├── ScannerScreen.js      # QR camera scanner
        │   ├── WeaponConfirmScreen.js # Multi-asset checkout confirmation
        │   ├── ActiveTrackingScreen.js # Live GPS and active equip list
        │   ├── RequestScreen.js      # Equipment request form
        │   ├── ApprovalScreen.js     # Sergeant approval queue
        │   ├── SyncStatusScreen.js   # Offline queue status
        │   └── ProfileScreen.js
        ├── context/
        │   └── OfflineQueueContext.js # Offline queue management
        ├── config/                   # API client, Firebase init
        └── services/                 # Mobile API service functions
```

---

## 👥 Roles & Permissions

The system implements **8 military roles** with strictly-scoped permissions:

| Role | Description | Key Capabilities |
|---|---|---|
| 🪖 **SOLDIER** | Front-line user | Scan QR, checkout/check-in equipment, view own assignments, request equipment |
| ⚔️ **SERGEANT** | Unit leader | Approve/reject checkout requests, view unit inventory, manage soldiers, flag maintenance |
| 🎖️ **OFFICER** | Base officer | Acknowledge stolen reports, view base equipment, approve transfers, access officer dashboard |
| 🏪 **QUARTERMASTER** | Supply officer | Full equipment CRUD, manage checkouts, process transfers, generate QR codes |
| 🔧 **TECHNICIAN** | Maintenance tech | View & update maintenance records, sign off completed maintenance tasks |
| 🔍 **AUDITOR** | Compliance auditor | Read-only access to audit logs, reports, and all records (no data mutation) |
| 🏛️ **BASE_ADMIN** | Base administrator | Full base-scoped control, user management, role assignment, base configuration |
| 👑 **SUPER_ADMIN** | System administrator | Unrestricted system access, multi-base management, global configuration |

### Permission Domains
The permission system covers **10 domains** with 40+ fine-grained permissions:

```
equipment:*     →  view / create / update / delete / export / import / qr_generate
checkout:*      →  view / create / checkin / approve / transfer / view_all
personnel:*     →  view / create / update / delete
maintenance:*   →  view / create / update / schedule / sign_off
transfer:*      →  view / request / approve / dispatch / receive
incident:*      →  view / report / investigate / close / witness_submit / co_acknowledge / resolve
alert:*         →  view / acknowledge / resolve / dismiss
audit:*         →  view / export
report:*        →  view / generate / export
admin:*         →  user_manage / role_assign / base_config / system_config
location:*      →  ping / view
search:*        →  ai
```

---

## 📡 API Reference

Base URL: `http://localhost:5000/api`

All endpoints (except `/auth/login`, `/auth/refresh`, `/auth/bases`, `/auth/units`, `/auth/officer-signup`) require `Authorization: Bearer <access_token>`.

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/auth/login` | Login with email + password |
| `POST` | `/auth/officer-signup` | Officer self-registration |
| `POST` | `/auth/refresh` | Rotate access token using refresh token |
| `POST` | `/auth/logout` | Invalidate session (requires auth) |
| `GET` | `/auth/me` | Get current user profile |
| `GET` | `/auth/bases` | List all bases (for signup form) |
| `GET` | `/auth/units` | List all units (for signup form) |

### Equipment
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/equipment` | List equipment (paginated, filtered) |
| `GET` | `/equipment/stats/dashboard` | Dashboard stats summary |
| `GET` | `/equipment/categories` | List equipment categories |
| `GET` | `/equipment/:id` | Get single equipment by ID |
| `GET` | `/equipment/serial/:serial` | Lookup by serial number |
| `GET` | `/equipment/:id/custody-chain` | Full custody chain history |
| `POST` | `/equipment` | Create new equipment |
| `PUT` | `/equipment/:id` | Update equipment |
| `DELETE` | `/equipment/:id` | Delete equipment |
| `POST` | `/equipment/:id/qr` | Generate QR code |

### Checkout
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/checkout` | List checkouts |
| `POST` | `/checkout` | Create checkout (QR scan → issuance) |
| `POST` | `/checkout/:id/checkin` | Check-in equipment |
| `POST` | `/checkout/:id/approve` | Approve checkout (Sergeant) |
| `POST` | `/checkout/transfer` | Transfer between personnel |

### Checkout Requests
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/checkout-requests` | List pending requests |
| `POST` | `/checkout-requests` | Submit equipment request |
| `PUT` | `/checkout-requests/:id/approve` | Approve request |
| `PUT` | `/checkout-requests/:id/reject` | Reject request |

### Incidents
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/incidents` | List incidents |
| `GET` | `/incidents/:id` | Get incident details |
| `POST` | `/incidents` | Report new incident |
| `POST` | `/incidents/:id/investigation-entry` | Add investigation log entry |
| `POST` | `/incidents/:id/witness-statement` | Record witness statement |
| `POST` | `/incidents/:id/co-acknowledge` | CO acknowledgment of stolen |
| `POST` | `/incidents/:id/evidence` | Upload evidence file |
| `POST` | `/incidents/:id/resolve` | Resolve incident |

### Maintenance
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/maintenance` | List maintenance records |
| `POST` | `/maintenance` | Schedule maintenance |
| `PUT` | `/maintenance/:id` | Update maintenance record |
| `POST` | `/maintenance/:id/sign-off` | Technician sign-off |

### Personnel
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/personnel` | List personnel |
| `POST` | `/personnel` | Create personnel record |
| `PUT` | `/personnel/:id` | Update personnel |
| `DELETE` | `/personnel/:id` | Remove personnel |

### Transfers, Alerts, Audit, Reports
| Route Prefix | Description |
|---|---|
| `/transfers` | Inter-base equipment transfers |
| `/alerts` | System alerts — view, acknowledge, resolve |
| `/audit` | Immutable audit log with export |
| `/reports` | Generate and export reports (PDF/Excel) |
| `/location` | GPS location pings and history |
| `/search` | AI-powered semantic equipment search |

### Role-Specific Dashboards
| Route Prefix | Role | Description |
|---|---|---|
| `/sergeant/*` | Sergeant | Soldier management, checkout approvals, unit inventory |
| `/officer/*` | Officer | Base overview, transfer approvals, CO acknowledgment |
| `/admin/*` | Base Admin / Super Admin | User management, base config, role assignment |

### Sync
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/sync` | Batch sync offline mobile queue |

---

## 🗄️ Database Schema

The PostgreSQL database (`db/init.sql`) defines **16 tables** with full referential integrity:

```
bases                    →  Military bases
units                    →  Units within a base
users                    →  All personnel (linked to role, base, unit)
equipment                →  All equipment items
equipment_categories     →  Equipment classification
checkout_records         →  Every checkout/check-in event
checkout_requests        →  Soldier requests awaiting approval
transfers                →  Inter-base transfer records
maintenance_records      →  Maintenance tasks and sign-offs
incidents                →  Incident reports
incident_investigation_log  →  Investigation entries
incident_witness_statements →  Witness statements
incident_evidence        →  Uploaded evidence files
alerts                   →  System-generated alerts
audit_logs               →  Immutable action audit trail
location_logs            →  GPS pings from mobile
```

All tables include `created_at` / `updated_at` timestamps and appropriate indexes for query performance.

---

## 🚀 Getting Started

### Prerequisites

Make sure you have these installed:

| Tool | Version | Download |
|---|---|---|
| Node.js | ≥ 20 LTS | https://nodejs.org |
| Docker Desktop | Latest | https://www.docker.com |
| Git | Latest | https://git-scm.com |
| Expo CLI | Latest | `npm install -g expo-cli` |

You also need:
- A **[Neon.tech](https://neon.tech)** PostgreSQL database (free tier is fine)
- A **[Firebase](https://console.firebase.google.com)** project with Realtime Database enabled

---

### Step 1 — Clone the Repository

```bash
git clone https://github.com/Ridham2808/BlackRabbit.git
cd BlackRabbit
```

### Step 2 — Configure Environment Variables

```bash
# Root env (used by docker-compose)
cp .env.example .env

# Backend env
cp backend/.env.example backend/.env    # or copy root .env → backend/.env

# Web env
cp web/.env.example web/.env

# Mobile env
cp mobile/.env.example mobile/.env
```

Fill in your actual values in each `.env` file. See [Environment Variables](#-environment-variables) section for details.

### Step 3 — Setup the Database

Run the schema and seed data on your Neon database:

```bash
# Using psql (install from https://www.postgresql.org/download/)
psql "$DATABASE_DIRECT_URL" -f db/init.sql
psql "$DATABASE_DIRECT_URL" -f db/seed.sql
```

Or paste the contents of `db/init.sql` and `db/seed.sql` directly in the Neon SQL Editor.

### Step 4 — Start Redis via Docker

```bash
docker run -d --name deas_redis --restart unless-stopped \
  -p 6380:6379 \
  -v deas_redis_data:/data \
  redis:7-alpine redis-server \
  --requirepass "${REDIS_PASSWORD}" \
  --maxmemory 256mb --maxmemory-policy allkeys-lru --save 60 1
```

### Step 5 — Run All Services

```bash
# Terminal 1 — Backend API
cd backend
npm install
npm run dev
# Running on http://localhost:5000

# Terminal 2 — Web Dashboard
cd web
npm install
npm run dev
# Running on http://localhost:3000

# Terminal 3 — Mobile App
cd mobile
npm install
npx expo start
# Scan QR with Expo Go app on your phone
```

---

## ⚙️ Environment Variables

Copy `.env.example` to `.env` and fill in the values:

### Core
| Variable | Description | Example |
|---|---|---|
| `NODE_ENV` | Environment mode | `development` |
| `BACKEND_PORT` | API server port | `5000` |

### Database (Neon.tech)
| Variable | Description |
|---|---|
| `DATABASE_URL` | Full connection string (pooled) |
| `DATABASE_DIRECT_URL` | Direct connection (for migrations) |
| `POSTGRES_USER` | Database username |
| `POSTGRES_PASSWORD` | Database password |
| `POSTGRES_DB` | Database name |

### Redis
| Variable | Description |
|---|---|
| `REDIS_HOST` | Redis host (`localhost` for local) |
| `REDIS_PORT` | Redis port (`6380` for local Docker) |
| `REDIS_PASSWORD` | Redis auth password |
| `REDIS_URL` | Full Redis connection URL |

### JWT (use long random strings in production!)
| Variable | Description |
|---|---|
| `JWT_ACCESS_SECRET` | Secret for signing access tokens |
| `JWT_REFRESH_SECRET` | Secret for signing refresh tokens |
| `JWT_ACCESS_EXPIRES_IN` | Access token TTL (e.g. `15m`) |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token TTL (e.g. `7d`) |

### Firebase (Real-time Location)
| Variable | Description |
|---|---|
| `VITE_FIREBASE_API_KEY` | Web Firebase API key |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID |
| `VITE_FIREBASE_DATABASE_URL` | Realtime Database URL |
| `EXPO_PUBLIC_FIREBASE_API_KEY` | Mobile Firebase API key |
| `EXPO_PUBLIC_FIREBASE_DATABASE_URL` | Mobile Realtime Database URL |

### Mobile
| Variable | Description |
|---|---|
| `EXPO_PUBLIC_API_URL` | Backend URL reachable from mobile — **use your machine's local IP**, not `localhost` |

> ⚠️ **Important:** For mobile, use your machine's actual local IP address (e.g. `http://192.168.1.100:5000/api`) — mobile devices cannot reach `localhost`.

---

## 🐳 Docker Setup

For a full containerized deployment:

```bash
# Copy and fill in your .env
cp .env.example .env

# Start all services
docker compose up -d

# View logs
docker compose logs -f backend

# Stop everything
docker compose down
```

### Services
| Container | Port | Description |
|---|---|---|
| `deas_redis` | `6380` | Redis 7 — sessions, cache, rate limiting |
| `deas_db` | `5432` | PostgreSQL 15 (local fallback) |
| `deas_backend` | `5000` | Node.js Express API |
| `deas_ai` | `8001` | Python FastAPI AI service |
| `deas_web` | `3000` | React Vite dev server |
| `deas_nginx` | `80/443` | Nginx reverse proxy **(production only)** |

> Note: Nginx only starts with `docker compose --profile production up`

---

## 🔐 Demo Credentials

Use these to log in to the web dashboard at `http://localhost:3000`:

| Role | Email | Password |
|---|---|---|
| 👑 Super Admin | `arjun.mehta@deas.mil` | `Deas@2024!` |
| 🏛️ Base Admin | `priya.sharma@deas.mil` | `Deas@2024!` |
| 🎖️ Officer | `vikram.singh@deas.mil` | `Deas@2024!` |
| 🏪 Quartermaster | `deepak.patel@deas.mil` | `Deas@2024!` |
| 🔍 Auditor | `suresh.iyer@deas.mil` | `Deas@2024!` |
| 🪖 Soldier | `karan.gupta@deas.mil` | `Deas@2024!` |

> These are demo accounts seeded by `db/seed.sql`. Change all passwords before any production deployment.

---

## 📱 Mobile App

### Running on your Device

1. Install **Expo Go** from the App Store / Google Play
2. Start the Expo dev server: `cd mobile && npx expo start`
3. Scan the QR code displayed in the terminal with your phone's camera

### Key Mobile Screens

| Screen | Description |
|---|---|
| **Login** | Email/password + biometric authentication |
| **Home** | Dashboard with assigned equipment & quick actions |
| **Scanner** | Camera QR code scanner for checkout/check-in |
| **Weapon Confirm** | Multi-asset checkout confirmation with signature |
| **Active Tracking** | Live list of checked-out equipment + GPS map |
| **Request** | Submit equipment request for sergeant approval |
| **Approval** | Sergeant approval queue for checkout requests |
| **Sync Status** | View and manage offline queue items |
| **Profile** | User profile and settings |

### Offline Mode

The mobile app is designed to work without internet:
- All API calls are queued in `OfflineQueueContext` when offline
- Equipment data is cached locally with `AsyncStorage`
- Credentials are encrypted with `expo-secure-store`
- On reconnection, queued actions sync automatically

---

## 🌐 Web Dashboard

Access at `http://localhost:3000` after starting the web service.

### Pages by Role

| Section | Available To | Description |
|---|---|---|
| **Dashboard** | All | Overview stats, alerts, recent activity |
| **Equipment** | QM, Admin | Full CRUD, QR generation, custody chain |
| **Checkouts** | All | Check-in/check-out management |
| **Live Map** | Officer, Admin | Real-time GPS tracking of all assets |
| **Incidents** | All | Report, investigate, resolve incidents |
| **Maintenance** | QM, Technician | Schedule and track maintenance |
| **Transfers** | QM, Officer | Inter-base equipment transfers |
| **Personnel** | Admin | Personnel management |
| **Alerts** | All | System alerts with acknowledge/resolve |
| **Audit Log** | Auditor, Admin | Full immutable audit trail |
| **Reports** | Auditor, Officer | Generate and export PDF/Excel reports |
| **Admin Panel** | Base Admin, Super Admin | User management, role assignment, base config |
| **Sergeant View** | Sergeant | Unit inventory, soldier list, checkout approvals |
| **Officer View** | Officer | Base status, CO acknowledgment, transfer approval |

---

## 🔒 Security

This project implements multiple layers of security:

- **JWT Tokens** — Short-lived access tokens (15 min) + long-lived refresh tokens stored in HTTP-only cookies
- **Password Hashing** — bcrypt with configurable salt rounds
- **Rate Limiting** — Login: 5 req/15 min · API: 100 req/15 min (Redis-backed)
- **HTTP Security Headers** — `helmet` sets CSP, HSTS, X-Frame-Options, etc.
- **CORS** — Strict origin allowlist via `CORS_ORIGINS` env var
- **RBAC** — Every route protected with role + permission checks
- **Base Scoping** — `scopeFilter` middleware ensures users only see their base's data
- **Input Validation** — All request bodies validated with Joi schemas
- **Audit Trail** — Every data mutation logged with actor, timestamp, IP, and before/after state
- **Encrypted Mobile Storage** — Credentials stored with `expo-secure-store` (device-level encryption)

### Production Checklist
- [ ] Change all default passwords in `.env`
- [ ] Generate strong random values for `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`
- [ ] Restrict `CORS_ORIGINS` to your production domain only
- [ ] Enable HTTPS via the Nginx service (`--profile production`)
- [ ] Set `NODE_ENV=production`
- [ ] Set `LOG_LEVEL=warn` or `error`
- [ ] Rotate Neon DB password and Firebase API key from development

---

## 📈 Implementation Status

- [x] **Phase 1** — DB Schema, Docker Compose, Environment Config
- [x] **Phase 2** — Node.js Backend API (all 17 route groups)
- [x] **Phase 3** — React Web Dashboard (all role-based pages)
- [x] **Phase 4** — React Native Mobile App (all screens)
- [x] **Phase 5** — Real-time GPS via Firebase + Socket.io
- [x] **Phase 6** — Offline-First Mobile Sync
- [x] **Phase 7** — Incident Reporting System (multi-asset, evidence, investigation)
- [x] **Phase 8** — QR Handover (Digital Tag Station)
- [ ] **Phase 9** — Python FastAPI AI Service (semantic search)
- [ ] **Phase 10** — Production Hardening + Nginx + SSL

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m 'feat: add your feature'`
4. Push to branch: `git push origin feature/your-feature-name`
5. Open a Pull Request

Please follow the existing code style and ensure all new endpoints have Joi validation and proper RBAC guards.

</div>