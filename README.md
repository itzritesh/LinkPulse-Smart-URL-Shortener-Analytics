# LinkPulse — Smart URL Shortener & Analytics SaaS

<div align="center">
  <h3>Next-generation URL shortener with real-time analytics, geolocation insights, and enterprise-grade performance.</h3>
</div>

---

## 🚀 Overview

**LinkPulse** is a modern, production-grade URL Shortener and Analytics SaaS platform built with high scalability, clean modular architecture, and developer experience in mind. 

This repository contains the fullstack initial foundation:
- **Frontend**: React 18 SPA powered by Vite, styled with Tailwind CSS, utilizing React Router, Axios, Lucide Icons, and Recharts.
- **Backend**: Asynchronous, typed FastAPI application with Pydantic v2 validation, CORS management, and lifespan management.
- **Database**: PostgreSQL with SQLAlchemy 2.0 ORM, connection pooling, and Alembic migrations.
- **Containerization**: Multi-stage Dockerfiles and Docker Compose orchestration for one-command deployment.

---

## 🛠 Tech Stack

| Layer | Technology | Description |
|---|---|---|
| **Frontend Framework** | React.js 18 + Vite | Blazing fast client-side rendering & HMR |
| **Frontend Routing** | React Router v6 | Declarative client routing |
| **HTTP Client** | Axios | Interceptor-driven client with latency tracking |
| **Styling** | Tailwind CSS v3 | Custom glassmorphism and responsive design tokens |
| **Icons & Charts** | Lucide React & Recharts | Modern UI icons & SVG chart primitives |
| **Backend Framework** | FastAPI (Python 3.12) | High-performance RESTful API framework |
| **Data Validation** | Pydantic v2 & Settings | Strict environment & request schema validation |
| **ORM & Database** | SQLAlchemy 2.0 & PostgreSQL 16 | Relational modeling with connection pooling |
| **Migrations** | Alembic | Schema version control and autogenerate |
| **Orchestration** | Docker & Docker Compose | Multi-container reproducible environments |

---

## 📁 Project Architecture

```text
LinkPulse/
├── frontend/
│   ├── public/
│   │   └── favicon.svg             # Web icon
│   ├── src/
│   │   ├── assets/                 # Brand assets & SVG logos
│   │   ├── components/
│   │   │   ├── common/             # Navbar, Footer, Card, Badge, Button
│   │   │   └── feedback/           # StatusIndicator, LoadingSpinner
│   │   ├── pages/                  # HomePage, NotFoundPage
│   │   ├── services/               # Axios apiClient & healthService
│   │   ├── context/                # AppContext provider
│   │   ├── utils/                  # formatters, constants
│   │   ├── App.jsx                 # Routing and root layout
│   │   ├── main.jsx                # DOM mount
│   │   └── index.css               # Tailwind & custom utilities
│   ├── index.html                  # HTML entry point
│   ├── vite.config.js              # Vite bundler config
│   ├── tailwind.config.js          # Tailwind styling tokens
│   ├── postcss.config.js           # PostCSS configuration
│   ├── package.json                # Dependencies & scripts
│   ├── .env                        # Local frontend environment
│   └── .env.example
├── backend/
│   ├── app/
│   │   ├── core/                   # config.py (Settings), database.py (SQLAlchemy)
│   │   ├── models/                 # base.py, url.py, analytics.py ORM models
│   │   ├── schemas/                # health.py, common.py, url.py, analytics.py
│   │   ├── routers/                # api.py, health.py, urls.py, analytics.py
│   │   ├── services/               # health_service.py, url_service.py, etc.
│   │   ├── utils/                  # logger.py, helpers
│   │   └── main.py                 # FastAPI application factory
│   ├── requirements.txt            # Python dependencies
│   ├── .env                        # Local backend environment
│   └── .env.example
├── database/
│   ├── migrations/                 # Alembic configuration & migration versions
│   └── seed.py                     # Database initialization script
├── tests/
│   ├── backend/                    # Pytest test suite (health, CORS)
│   └── frontend/                   # Frontend smoke tests
├── docker/
│   ├── backend.Dockerfile          # Backend container specification
│   └── frontend.Dockerfile         # Frontend container specification
├── docker-compose.yml              # Multi-container orchestration (DB + API + Web)
├── .gitignore                      # Git ignore rules
└── README.md                       # Documentation
```

---

## ⚡ Quick Start with Docker (Recommended)

To spin up the full stack (PostgreSQL, FastAPI Backend, and React Frontend) in one command:

```bash
docker-compose up --build
```

### Active Services:
- **Frontend Web UI**: [http://localhost:5173](http://localhost:5173)
- **FastAPI Backend**: [http://localhost:8000](http://localhost:8000)
- **Interactive Swagger Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Health Endpoint**: [http://localhost:8000/api/health](http://localhost:8000/api/health)
- **PostgreSQL**: `localhost:5432`

To tear down containers and volumes:
```bash
docker-compose down -v
```

---

## 💻 Local Development (Running Independently)

You can run the frontend and backend independently on your host machine.

### Prerequisites
- **Node.js**: v18.x or v20.x+
- **Python**: v3.10, v3.11, or v3.12+
- **PostgreSQL**: v14+ (or run PostgreSQL via Docker `docker run --name postgres -e POSTGRES_PASSWORD=linkpulse_secret -e POSTGRES_USER=linkpulse -e POSTGRES_DB=linkpulse_db -p 5432:5432 -d postgres:16-alpine`)

---

### 1. Backend Setup

1. Open a terminal in the project root:
   ```bash
   cd backend
   ```

2. Create and activate a Python virtual environment:
   ```bash
   # Windows (PowerShell)
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1

   # macOS / Linux
   python3 -m venv .venv
   source .venv/bin/activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Configure environment variables:
   ```bash
   cp .env.example .env
   ```
   *Edit `.env` if your PostgreSQL credentials differ from the defaults.*

5. Run the FastAPI development server:
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

6. Verify the server is running:
   - Root info: [http://localhost:8000/](http://localhost:8000/)
   - Health check: [http://localhost:8000/api/health](http://localhost:8000/api/health)
   - Interactive docs: [http://localhost:8000/docs](http://localhost:8000/docs)

---

### 2. Frontend Setup

1. Open a separate terminal:
   ```bash
   cd frontend
   ```

2. Install Node dependencies:
   ```bash
   npm install
   ```

3. Configure frontend environment variables:
   ```bash
   cp .env.example .env
   ```
   Verify that `VITE_API_BASE_URL="http://localhost:8000/api"`.

4. Start the Vite development server:
   ```bash
   npm run dev
   ```

5. Open your browser at [http://localhost:5173](http://localhost:5173). The dashboard will display the live connection monitor connected to your FastAPI backend.

---

## 🗄️ Database Setup & Migrations

### Initializing Tables directly
A standalone bootstrap script is provided in `database/seed.py`:
```bash
python database/seed.py
```

### Running Migrations with Alembic
To apply database migrations:
```bash
alembic -c database/migrations/alembic.ini upgrade head
```

To create a new migration after updating ORM models:
```bash
alembic -c database/migrations/alembic.ini revision --autogenerate -m "Add new fields"
```

---

## 🩺 Health Check Endpoint (`/api/health`)

The backend exposes a resilient health monitoring endpoint at `GET /api/health`.

### Sample Response:
```json
{
  "status": "healthy",
  "service": "LinkPulse",
  "version": "1.0.0",
  "environment": "development",
  "timestamp": "2026-09-12T06:50:00.000Z",
  "database": {
    "status": "connected",
    "latency_ms": 2.45,
    "error": null
  },
  "meta": {
    "debug": true,
    "api_prefix": "/api"
  }
}
```

*Note: If the PostgreSQL database is unreachable, the endpoint returns `"status": "degraded"` with diagnostic error details, without crashing the API server.*

---

## 🧪 Testing

### Backend Unit & Integration Tests
Run pytest with coverage:
```bash
pytest tests/backend/ -v
```

This verifies:
- Root `/` endpoint discovery
- `/api/health` schema compliance
- CORS allow-origin response headers

### Frontend Tests
```bash
cd frontend
npm test
```

---

## 🔒 Environment Variables Reference

### Backend (`backend/.env`)
| Variable | Default | Purpose |
|---|---|---|
| `PROJECT_NAME` | `LinkPulse` | Service identification |
| `ENVIRONMENT` | `development` | Runtime environment mode |
| `DEBUG` | `True` | FastAPI debug mode |
| `API_V1_STR` | `/api` | Root API route prefix |
| `CORS_ORIGINS` | `["http://localhost:5173", ...]` | Allowed CORS origins for frontend |
| `DATABASE_URL` | `postgresql://...` | PostgreSQL connection string |

### Frontend (`frontend/.env`)
| Variable | Default | Purpose |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:8000/api` | Base URL for Axios client |

---

## 🗺️ Next Steps & Roadmap

- **Phase 2**: High-throughput URL shortening service (Base62 encoding, custom aliases, collision handling).
- **Phase 3**: Real-time click tracking engine (IP parsing, User-Agent device/browser detection, GeoIP).
- **Phase 4**: Analytics Dashboard UI (Recharts time-series, referral distribution, world map insights).
- **Phase 5**: User Authentication (JWT tokens, OAuth2, multi-tenant link workspaces).
