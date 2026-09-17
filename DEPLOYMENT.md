# LinkPulse — Production Deployment & Operations Guide

This comprehensive guide details the complete deployment lifecycle for **LinkPulse**, a sub-20ms edge-redirect URL shortener and real-time click analytics platform. It covers local development, containerized Docker Compose stacks, production cloud deployments, database management, Redis caching, SSL/HTTPS termination, domain configuration, and security hardening.

---

## Architecture Overview

```
                      +---------------------------------------+
                      |   Cloudflare / Route53 / DNS Provider |
                      +-------------------+-------------------+
                                          | HTTPS (Port 443)
                                          v
                      +---------------------------------------+
                      |     Reverse Proxy / Nginx / ALB       |
                      |   (SSL Termination & Rate Limiting)   |
                      +---------+-------------------+---------+
                                |                   |
             Static Assets & SPA|                   | Reverse Proxy (/api/*, /r/*)
             Fallback           v                   v
      +----------------------------+      +----------------------------+
      |      Frontend Service      |      |      Backend Service       |
      |   (Nginx 1.27 + React SPA) |      | (FastAPI 0.115 + Uvicorn)  |
      |   Internal Port 80         |      | Internal Port 8000         |
      +----------------------------+      +-------------+--------------+
                                                        |
                                +-----------------------+-----------------------+
                                |                                               |
                                v                                               v
                 +----------------------------+                  +----------------------------+
                 |     PostgreSQL Service     |                  |       Redis Service        |
                 |  (PostgreSQL 16 Engine)    |                  |   (Redis 7 LRU Cache)      |
                 |  Persistent Storage Volume |                  |   Sub-millisecond Lookups  |
                 +----------------------------+                  +----------------------------+
```

---

## 1. Local Development

Running LinkPulse locally without Docker allows rapid debugging with hot module replacement (HMR) and backend auto-reload.

### Prerequisites
- **Python**: 3.11 or 3.12 (`python --version`)
- **Node.js**: 20+ and npm (`node -v`, `npm -v`)
- **PostgreSQL**: 15+ running locally on port 5432 (or remote Neon/Supabase DB)
- **Redis** *(optional)*: Running on port 6379 (if offline, LinkPulse falls back to in-memory + DB automatically)

### Backend Setup (FastAPI)
```bash
# 1. Navigate to backend directory
cd backend

# 2. Create and activate a Python virtual environment
python -m venv .venv
# On Linux/macOS:
source .venv/bin/activate
# On Windows (PowerShell):
.\.venv\Scripts\Activate.ps1

# 3. Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# 4. Configure local environment variables
cp ../.env.example .env
# Edit .env to verify your local DATABASE_URL:
# DATABASE_URL=postgresql://linkpulse:linkpulse_secret@localhost:5432/linkpulse_db

# 5. Start the FastAPI ASGI server with auto-reload
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
The interactive API documentation is available at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
- Health Endpoint: `http://localhost:8000/api/health`

### Frontend Setup (Vite + React)
```bash
# 1. Open a new terminal and navigate to frontend
cd frontend

# 2. Install dependencies
npm install

# 3. Run development server with HMR
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 2. Docker Development

The entire 4-tier stack (`frontend`, `backend`, `postgres`, `redis`) can be spun up with a single command using Docker Compose.

### Quick Start
```bash
# 1. Copy the environment configuration template
cp .env.example .env

# 2. Build and start all 4 services in detached mode
docker compose up --build -d

# 3. Verify all services are running and healthy
docker compose ps
```

### Expected Output
```
NAME                 IMAGE                  COMMAND                  SERVICE    STATUS
linkpulse-postgres   postgres:16-alpine     "docker-entrypoint.s…"   postgres   Up (healthy)
linkpulse-redis      redis:7-alpine         "docker-entrypoint.s…"   redis      Up (healthy)
linkpulse-backend    linkpulse-backend      "uvicorn app.main:ap…"   backend    Up (healthy)
linkpulse-frontend   linkpulse-frontend     "/docker-entrypoint.…"   frontend   Up (healthy)
```

### Accessing the Stack
| Component | Public URL | Description |
|---|---|---|
| **Web Application** | `http://localhost` (Port 80) | Production-bundled SPA served via Nginx |
| **Backend API** | `http://localhost:8000/api` | Direct FastAPI endpoints |
| **API Health Check** | `http://localhost:8000/api/health` | Service & DB connectivity check |
| **Short Redirection** | `http://localhost:8000/{code}` or `http://localhost/r/{code}` | Edge 307 temporary redirect |
| **PostgreSQL** | `localhost:5432` | Exposed for local DB inspection tools |
| **Redis** | `localhost:6379` | In-memory key-value cache |

### Managing the Container Stack
```bash
# View live aggregated container logs
docker compose logs -f

# View backend logs only
docker compose logs -f backend

# Stop the containers without losing data
docker compose stop

# Restart the stack
docker compose start

# Tear down the stack and remove network (data volumes preserved)
docker compose down

# Wipe everything including persistent database & cache volumes (Caution!)
docker compose down -v
```

---

## 3. Environment Variables Reference

LinkPulse uses strict typed configuration validated at startup with Pydantic (`backend/app/core/config.py`).

| Variable Name | Type | Default Value | Production Recommendation | Description |
|---|---|---|---|---|
| `PROJECT_NAME` | String | `LinkPulse` | `LinkPulse` | Application branding identifier |
| `ENVIRONMENT` | String | `development` | `production` | Enables/disables debug logs and API docs |
| `DEBUG` | Boolean | `False` | `False` | Must be `False` in production to prevent stack trace leaks |
| `POSTGRES_USER` | String | `linkpulse` | Custom username | Database user account name |
| `POSTGRES_PASSWORD` | String | `linkpulse_secret` | Strong random secret | Minimum 24 characters random string |
| `POSTGRES_DB` | String | `linkpulse_db` | `linkpulse_production` | PostgreSQL database catalog name |
| `POSTGRES_PORT` | Integer | `5432` | `5432` | Host port mapped to Postgres container |
| `DATABASE_URL` | String | See `.env.example` | Managed DB URL with SSL | SQLAlchemy connection URI (`postgresql://...`) |
| `REDIS_ENABLED` | Boolean | `True` | `True` | Enables high-performance lookup caching |
| `REDIS_URL` | String | `redis://redis:6379/0` | `rediss://...` (TLS) | Redis connection URL with db index |
| `REDIS_PORT` | Integer | `6379` | `6379` | Host port mapped to Redis container |
| `REDIS_CACHE_TTL_SECONDS` | Integer | `3600` | `3600` to `86400` | Expiration time for cached short codes |
| `REDIS_SOCKET_TIMEOUT` | Float | `1.0` | `1.0` | Fast-fail connection timeout before fallback |
| `JWT_SECRET_KEY` | String | *Dev default* | 64+ char random string | Secret key for signing HS256 auth tokens |
| `JWT_ALGORITHM` | String | `HS256` | `HS256` | Token signing algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Integer | `10080` (7 days) | `1440` to `10080` | Lifespan of access tokens before re-login |
| `CORS_ORIGINS` | CSV / List | `http://localhost`... | Exact production domains | Allowed origins for cross-origin requests |
| `BACKEND_PORT` | Integer | `8000` | `8000` | Internal/host port for FastAPI backend |
| `FRONTEND_PORT` | Integer | `80` | `80` or `443` | Host port for Nginx web frontend |
| `VITE_API_BASE_URL` | String | `/api` | `/api` | Base URL used by browser Axios client |
| `VITE_BACKEND_URL` | String | `""` | `https://yourdomain.com` | Root URL for generating full short link URLs |

---

## 4. Database Setup & Migrations

LinkPulse relies on PostgreSQL for persistent relational storage with ACID transactions.

### Database Schema
The database consists of three primary tables:
1. `users`: Authentication credentials (bcrypt-hashed), email addresses, timestamps.
2. `urls`: Shortened vanity URLs, original destinations, owners, click counters, active flags, expiration dates.
3. `clicks`: High-throughput analytics stream (timestamp, country, city, OS, browser, device type, referrer, hashed IP).

### Automatic Startup Bootstrap
During container initialization, `backend/app/main.py` runs a lifespan handler that:
1. Executes `Base.metadata.create_all(bind=engine)` to create any missing tables.
2. Applies non-destructive schema migrations (e.g. `ALTER TABLE urls ADD COLUMN IF NOT EXISTS ...`).
3. Creates compound B-Tree indexes for fast aggregation:
   - `ix_clicks_url_id_clicked_at ON clicks(url_id, clicked_at)`
   - `ix_urls_short_code ON urls(short_code)`
   - `ix_urls_user_id ON urls(user_id)`

### Manual Migration & Schema Inspection
```bash
# Enter the running PostgreSQL container
docker compose exec postgres psql -U linkpulse -d linkpulse_db

# Inside psql prompt:
\dt                  # List all tables
\d urls              # View columns and indexes on urls table
\d clicks            # View columns and indexes on clicks table
SELECT count(*) FROM urls;
```

### Automated Backup Strategy
Set up a daily cron job to dump the database to compressed archives:
```bash
#!/usr/bin/env bash
# backup_db.sh - Run via cron at 02:00 UTC daily
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/var/backups/linkpulse"
mkdir -p "$BACKUP_DIR"

docker compose exec -T postgres pg_dump -U linkpulse -d linkpulse_db -F c \
  > "$BACKUP_DIR/linkpulse_backup_${TIMESTAMP}.dump"

# Prune backups older than 14 days
find "$BACKUP_DIR" -type f -name "*.dump" -mtime +14 -exec rm {} +
```

### Restoring a Backup
```bash
docker compose exec -T postgres pg_restore -U linkpulse -d linkpulse_db --clean \
  < /var/backups/linkpulse/linkpulse_backup_20260917.dump
```

---

## 5. Frontend Build Optimization

The LinkPulse frontend is built using Vite, React 18, Tailwind CSS, and Recharts.

### Production Multi-Stage Dockerfile (`frontend/Dockerfile`)
1. **Build Stage (`node:20-alpine`)**:
   - Injects `VITE_API_BASE_URL` at build time.
   - Tree-shakes unused Lucide icons and Recharts modules.
   - Compresses CSS and generates hash-versioned chunk files in `dist/assets/`.
2. **Runtime Stage (`nginx:1.27-alpine`)**:
   - Copies static assets into `/usr/share/nginx/html`.
   - Utilizes custom `nginx.conf` with:
     - Gzip compression on all static assets (`gzip_comp_level 6`).
     - 1-Year cache headers on immutable assets (`/assets/*`).
     - SPA client-side routing fallback (`try_files $uri $uri/ /index.html;`).
     - Built-in reverse proxy routing for `/api/` and `/r/`.

### Manual Frontend Build Verification
```bash
cd frontend
npm install
npm run build
# Built files output to frontend/dist/
```

---

## 6. Backend Deployment (FastAPI & ASGI)

### Process Management with Uvicorn
In production containers, Uvicorn runs with:
- `--workers 2` (or calculated as `(2 * CPU_CORES) + 1`)
- `--proxy-headers` (respects `X-Forwarded-For` and `X-Forwarded-Proto` from Nginx/ALB)
- `--forwarded-allow-ips="*"` (allows reverse proxies to pass client IP addresses)
- Non-root security user `linkpulse` (UID 10001)

### Bare-Metal / Systemd Unit File (Alternative to Docker)
If running directly on a Linux VM:
```ini
# /etc/systemd/system/linkpulse-backend.service
[Unit]
Description=LinkPulse FastAPI Backend Service
After=network.target postgresql.service redis.service

[Service]
User=www-data
Group=www-data
WorkingDirectory=/var/www/linkpulse/backend
EnvironmentFile=/var/www/linkpulse/.env
ExecStart=/var/www/linkpulse/backend/.venv/bin/uvicorn app.main:app \
  --host 0.0.0.0 \
  --port 8000 \
  --workers 4 \
  --proxy-headers \
  --forwarded-allow-ips="*"
Restart=always
RestartSec=5s
LimitNOFILE=65535

[Install]
WantedBy=multi-user.target
```
Enable and start the service:
```bash
sudo systemctl daemon-reload
sudo systemctl enable linkpulse-backend
sudo systemctl start linkpulse-backend
sudo systemctl status linkpulse-backend
```

---

## 7. PostgreSQL Deployment (Self-Hosted vs Managed Cloud)

### Option A: Self-Hosted Docker Volume (Included in Compose)
- Uses the `postgres_data` persistent volume.
- Configuration parameters tuned for durability:
  - `wal_level = replica`
  - `max_connections = 100`
  - `shared_buffers = 512MB`

### Option B: Managed Cloud PostgreSQL (Recommended for Enterprise)
For high availability, automatic point-in-time recovery, and multi-region replication, use a managed database:
- **AWS RDS / Aurora PostgreSQL**
- **Google Cloud SQL for PostgreSQL**
- **Neon Serverless PostgreSQL**
- **Supabase**

To switch to a managed cloud database:
1. Set `DATABASE_URL` in your `.env`:
   ```bash
   DATABASE_URL="postgresql://linkpulse_user:SuperSecretPassword@ep-cool-cloud-12345.us-east-1.aws.neon.tech/linkpulse?sslmode=require"
   ```
2. In `docker-compose.yml`, you can comment out the `postgres` service and remove its `depends_on` requirement in `backend`.

---

## 8. Redis Deployment (Cache Strategy & Eviction)

LinkPulse utilizes Redis as a write-through / read-through caching tier for sub-20ms URL redirection.

### Architecture Flow
1. Visitor navigates to short link `https://linkpulse.io/r/{short_code}`.
2. Backend queries Redis key `url:code:{short_code}`.
3. **Cache Hit**: Instant redirect response (latency < 2ms).
4. **Cache Miss**: Query PostgreSQL, write result into Redis with a 1-hour TTL, and redirect.
5. **Cache Invalidation**: When a link is updated, paused, or deleted, the corresponding Redis key is proactively purged.
6. **Resilience**: If Redis crashes or times out, the backend gracefully degrades to direct database queries without user disruption.

### Production Redis Configuration
Configured in `docker-compose.yml`:
```yaml
command: >
  redis-server
  --appendonly yes
  --maxmemory 256mb
  --maxmemory-policy allkeys-lru
```
- `--appendonly yes`: Writes an append-only log (`appendonly.aof`) to the `redis_data` volume for crash resilience.
- `--maxmemory 256mb`: Caps memory usage to prevent Out-Of-Memory (OOM) killer events.
- `--maxmemory-policy allkeys-lru`: Automatically evicts the least recently accessed short codes when RAM limit is reached.

---

## 9. HTTPS & SSL/TLS Configuration

All production traffic must be served over HTTPS with TLS 1.2 or TLS 1.3.

### Method A: Cloudflare SSL / Edge Termination (Recommended)
1. Point your domain DNS records to Cloudflare.
2. Under **SSL/TLS**, select **Full (Strict)**.
3. Deploy LinkPulse Docker Compose on your server.
4. Nginx serves port 80 internally or receives traffic from Cloudflare Origin CA certificate.

### Method B: Let's Encrypt / Certbot Automated SSL
To terminate SSL directly on the host using Let's Encrypt:
```bash
# 1. Install Certbot on the host
sudo apt-get update && sudo apt-get install -y certbot

# 2. Issue certificates using standalone authenticator
sudo certbot certonly --standalone -d linkpulse.io -d www.linkpulse.io -d app.linkpulse.io

# Certificates will be stored in:
# /etc/letsencrypt/live/linkpulse.io/fullchain.pem
# /etc/letsencrypt/live/linkpulse.io/privkey.pem
```

### Production Host Nginx SSL Reverse Proxy
```nginx
# /etc/nginx/sites-available/linkpulse
server {
    listen 80;
    listen [::]:80;
    server_name linkpulse.io www.linkpulse.io app.linkpulse.io;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name linkpulse.io www.linkpulse.io app.linkpulse.io;

    ssl_certificate /etc/letsencrypt/live/linkpulse.io/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/linkpulse.io/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # HSTS (Strict-Transport-Security)
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;

    location / {
        proxy_pass http://127.0.0.1:80;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
    }
}
```

---

## 10. Domain & DNS Configuration

### Recommended DNS Architecture
| Hostname Record | Type | Target | Purpose |
|---|---|---|---|
| `@` (apex: `linkpulse.io`) | `A` | Server Public IPv4 (e.g. `203.0.113.10`) | Main Landing & Redirect Engine |
| `www` | `CNAME` | `linkpulse.io` | Canonical WWW redirect |
| `app` (`app.linkpulse.io`) | `CNAME` | `linkpulse.io` | Authenticated Dashboard |
| `api` *(optional)* | `CNAME` | `linkpulse.io` | Direct API endpoint (if not using path `/api`) |

### Dedicated Vanity Redirection Domains
If using a short domain (e.g. `pulse.to`) distinct from your primary application domain (`linkpulse.io`):
1. Point `pulse.to` `A` record to the same LinkPulse server IP.
2. In `docker/nginx.conf`, any incoming request on `pulse.to/{code}` is proxied to `backend:8000/{code}`.
3. In backend `CORS_ORIGINS`, add `https://pulse.to`.

---

## 11. Production Security Checklist

Before exposing LinkPulse to public internet traffic, verify every item in this checklist:

- [ ] **1. Disable Debug Mode**: Confirm `DEBUG=False` in production `.env`.
- [ ] **2. Rotate JWT Secret**: Ensure `JWT_SECRET_KEY` is a cryptographically generated string of at least 64 characters (`openssl rand -base64 48`).
- [ ] **3. Rotate Database Credentials**: Change default PostgreSQL user and password from `linkpulse_secret`.
- [ ] **4. Restrict CORS Origins**: Ensure `CORS_ORIGINS` does not contain `*`. List only your exact production domains (`https://linkpulse.io,https://app.linkpulse.io`).
- [ ] **5. Run as Non-Root**: Verify backend container runs under the dedicated `linkpulse` user (UID 10001).
- [ ] **6. Enforce SSL / TLS**: Verify all HTTP traffic is redirected to HTTPS (301 Moved Permanently) and HSTS is active.
- [ ] **7. Prevent SSRF & Internal IP Redirects**: Verified in `backend/app/services/url_service.py` (rejects loopback `127.0.0.1`, AWS metadata `169.254.169.254`, `0.0.0.0`, and non-HTTP protocols).
- [ ] **8. Privacy Compliance (Zero Raw IP Leaks)**: Confirm raw client IP addresses are hashed/anonymized and never returned in public analytics API responses.
- [ ] **9. Rate Limiting Active**: In-memory rate limiting configured on authentication (`/api/auth/*`) and short link creation (`/api/urls`).
- [ ] **10. SQL Injection Prevention**: All queries use SQLAlchemy parameterized queries and ORM abstractions.
- [ ] **11. Security Headers Active**:
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: geolocation=(), camera=(), microphone=()`
- [ ] **12. Error Sanitization**: Verify backend does not return internal stack traces or database schema exceptions (handled via `global_unhandled_exception_handler` in `app/main.py`).
- [ ] **13. Container Resource Limits**: Set CPU and memory bounds in Docker Compose to prevent denial-of-service resource starvation:
  ```yaml
  deploy:
    resources:
      limits:
        cpus: '1.5'
        memory: 1024M
  ```
- [ ] **14. Healthchecks Enabled**: All 4 services have active Docker healthchecks with automatic restart on failure (`restart: unless-stopped`).
- [ ] **15. Automated Database Backups**: Verified daily cron job executing `pg_dump` to offsite or encrypted storage.

---

## 12. Troubleshooting & Diagnostics

### Common Issues & Quick Fixes

#### 1. Backend Fails to Connect to Database (`psycopg2.OperationalError`)
- Check PostgreSQL container status: `docker compose ps postgres`
- Verify `DATABASE_URL` matches the service name in docker-compose: `postgresql://user:pass@postgres:5432/dbname` (use `postgres`, NOT `localhost`, inside containers).
- Check postgres logs: `docker compose logs postgres`

#### 2. Redis Connection Failed
- LinkPulse is designed to fail open and will log:
  `[Cache] Redis unavailable (...). Gracefully falling back to local memory and PostgreSQL.`
- To troubleshoot Redis:
  ```bash
  docker compose exec redis redis-cli ping
  # Should return: PONG
  ```

#### 3. Frontend Displays "Network Error" on API Calls
- Check Nginx reverse proxy configuration in `docker/nginx.conf`.
- Ensure `VITE_API_BASE_URL` is set to `/api`.
- Inspect browser DevTools Network tab to verify whether the request targets `/api/...` or an unreachable origin.
- Check backend CORS logs to confirm your domain is listed in `CORS_ORIGINS`.

---

© 2026 LinkPulse Inc. All rights reserved.
