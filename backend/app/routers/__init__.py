from app.routers.api import api_router
from app.routers.health import router as health_router
from app.routers.redirect import redirect_router

__all__ = ["api_router", "health_router", "redirect_router"]

