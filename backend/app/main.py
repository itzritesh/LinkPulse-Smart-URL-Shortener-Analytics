from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.routers.api import api_router
from app.routers.redirect import redirect_router
from app.utils.logger import logger


from app.core.database import engine, Base, check_database_connection
import app.models  # Ensures all models are registered with Base.metadata


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager for initialization and graceful shutdown."""
    logger.info(f"Starting {settings.PROJECT_NAME} in [{settings.ENVIRONMENT}] mode...")
    # Automatically bootstrap missing tables if database is connected
    try:
        connected, _ = check_database_connection()
        if connected:
            Base.metadata.create_all(bind=engine)
            # Ensure schema columns added in subsequent updates exist
            from sqlalchemy import text
            with engine.connect() as conn:
                conn.execute(text("""
                    ALTER TABLE urls ADD COLUMN IF NOT EXISTS title VARCHAR(255);
                    ALTER TABLE urls ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
                    ALTER TABLE urls ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
                    ALTER TABLE urls ADD COLUMN IF NOT EXISTS click_count INTEGER DEFAULT 0;
                    CREATE INDEX IF NOT EXISTS ix_clicks_url_id_clicked_at ON clicks(url_id, clicked_at);
                """))
                conn.commit()
            logger.info("Database schema tables, columns, and indexes verified/initialized.")
    except Exception as exc:
        logger.warning(f"Could not auto-create database tables on startup: {exc}")

    yield
    logger.info(f"Shutting down {settings.PROJECT_NAME}...")


import uuid
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException


def create_application() -> FastAPI:
    """FastAPI application factory with production-grade security hardening."""
    # Hide interactive documentation in strict production mode if desired
    is_prod = settings.ENVIRONMENT.lower() == "production"
    
    application = FastAPI(
        title=f"{settings.PROJECT_NAME} API",
        description="Production-grade API for LinkPulse - Smart URL Shortener & Analytics SaaS.",
        version="1.0.0",
        docs_url=None if is_prod else "/docs",
        redoc_url=None if is_prod else "/redoc",
        openapi_url=None if is_prod else f"{settings.API_V1_STR}/openapi.json",
        lifespan=lifespan,
    )

    # 1. Security Headers Middleware
    @application.middleware("http")
    async def add_security_headers(request, call_next):
        response = await call_next(request)
        if request.method != "OPTIONS":
            response.headers["X-Content-Type-Options"] = "nosniff"
            response.headers["X-Frame-Options"] = "DENY"
            response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
            response.headers["X-XSS-Protection"] = "1; mode=block"
            response.headers["Permissions-Policy"] = "geolocation=(), camera=(), microphone=()"
        return response

    # 2. Configure CORS Middleware (Supports localhost, 127.0.0.1, and private LAN/WSL2 IPs like 172.x, 192.168.x, 10.x)
    allowed_origins = [o for o in settings.CORS_ORIGINS if o != "*"] if is_prod else settings.CORS_ORIGINS
    local_network_regex = r"https?://(localhost|127\.0\.0\.1|172\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+)(:\d+)?"
    application.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_origin_regex=None if is_prod else local_network_regex,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["*"],
    )

    # 3. Global Exception Handlers (Do not leak internal exception details)
    @application.exception_handler(Exception)
    async def global_unhandled_exception_handler(request, exc: Exception):
        trace_id = uuid.uuid4().hex[:12]
        logger.error(f"[Unhandled Exception] trace_id={trace_id} path={request.url.path} error={str(exc)}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={
                "error": "internal_server_error",
                "detail": "An unexpected error occurred. Please contact support or try again.",
                "trace_id": trace_id,
            },
        )

    @application.exception_handler(RequestValidationError)
    async def validation_exception_handler(request, exc: RequestValidationError):
        # Format validation errors cleanly without exposing internal model names or code paths
        errors = []
        for err in exc.errors():
            loc = " -> ".join(str(l) for l in err.get("loc", []) if l != "body")
            msg = err.get("msg", "Invalid value")
            errors.append(f"{loc}: {msg}" if loc else msg)
        return JSONResponse(
            status_code=422,
            content={
                "error": "validation_error",
                "detail": errors[0] if len(errors) == 1 else errors,
            },
        )

    @application.exception_handler(StarletteHTTPException)
    async def http_exception_handler(request, exc: StarletteHTTPException):
        headers = getattr(exc, "headers", None) or {}
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error": "http_error",
                "detail": exc.detail,
            },
            headers=headers,
        )

    # Mount API routes
    application.include_router(api_router)

    # Root route
    @application.get("/", tags=["Root"])
    def root():
        return {
            "name": settings.PROJECT_NAME,
            "version": "1.0.0",
            "status": "online",
            "docs": "/docs" if not is_prod else "disabled",
            "health": f"{settings.API_V1_STR}/health",
        }

    # Public redirection engine (mounted last so exact paths take precedence)
    application.include_router(redirect_router)

    return application


app = create_application()

