import time
from datetime import datetime, timezone
from app.core.config import settings
from app.core.database import check_database_connection
from app.schemas.health import HealthResponse, DatabaseHealth


class HealthService:
    @staticmethod
    def get_health_status() -> HealthResponse:
        """Evaluates server health and checks live database connectivity."""
        start_time = time.perf_counter()
        db_connected, db_error = check_database_connection()
        latency_ms = round((time.perf_counter() - start_time) * 1000, 2)

        overall_status = "healthy" if db_connected else "degraded"

        db_health = DatabaseHealth(
            status="connected" if db_connected else "disconnected",
            latency_ms=latency_ms if db_connected else None,
            error=db_error if not db_connected else None,
        )

        return HealthResponse(
            status=overall_status,
            service=settings.PROJECT_NAME,
            version="1.0.0",
            environment=settings.ENVIRONMENT,
            timestamp=datetime.now(timezone.utc),
            database=db_health,
            meta={
                "debug": settings.DEBUG,
                "api_prefix": settings.API_V1_STR,
            },
        )
