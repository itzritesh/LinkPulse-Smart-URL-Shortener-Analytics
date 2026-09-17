from fastapi import APIRouter
from app.routers import health, urls, analytics, auth

api_router = APIRouter(prefix="/api")

# Register feature sub-routers
api_router.include_router(auth.router)
api_router.include_router(health.router)
api_router.include_router(urls.router)
api_router.include_router(analytics.router)
