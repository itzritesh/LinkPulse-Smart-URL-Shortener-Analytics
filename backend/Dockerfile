# ==========================================
# LinkPulse FastAPI Backend - Production Image
# ==========================================
FROM python:3.12-slim AS base

# Python runtime configuration
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PORT=8000

WORKDIR /app

# Install minimal OS dependencies: curl for container healthcheck & libpq for postgres
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    libpq5 \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python application dependencies
COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt \
    && apt-get purge -y --auto-remove gcc libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy backend application code
COPY app /app/app

# Security: Run as dedicated non-root user (UID 10001)
RUN groupadd -g 10001 linkpulse && \
    useradd -u 10001 -g linkpulse -s /bin/bash -m linkpulse && \
    chown -R linkpulse:linkpulse /app

USER linkpulse

# Expose FastAPI ASGI port
EXPOSE 8000

# Container Healthcheck targeting the /api/health endpoint
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:8000/api/health || exit 1

# Production ASGI server with proxy header support and worker scaling
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2", "--proxy-headers", "--forwarded-allow-ips=*"]
