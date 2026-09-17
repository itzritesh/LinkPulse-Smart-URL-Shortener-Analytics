from fastapi import APIRouter, status
from app.schemas.health import HealthResponse
from app.services.health_service import HealthService

router = APIRouter(prefix="/health", tags=["Health"])


@router.get(
    "",
    response_model=HealthResponse,
    status_code=status.HTTP_200_OK,
    summary="System and Database Health Check",
    description="Returns the operational status of the LinkPulse API service and its PostgreSQL database connection.",
)
def get_health() -> HealthResponse:
    return HealthService.get_health_status()
