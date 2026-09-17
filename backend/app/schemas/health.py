from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field


class DatabaseHealth(BaseModel):
    status: str = Field(..., description="'connected' or 'disconnected'")
    latency_ms: Optional[float] = Field(None, description="Database ping latency in milliseconds")
    error: Optional[str] = Field(None, description="Error message if disconnected")


class HealthResponse(BaseModel):
    status: str = Field(..., description="Overall health status: 'healthy' or 'degraded'")
    service: str = Field("LinkPulse API", description="Service name")
    version: str = Field("1.0.0", description="API version")
    environment: str = Field(..., description="Runtime environment")
    timestamp: datetime = Field(..., description="Server timestamp in UTC")
    database: DatabaseHealth = Field(..., description="Database connection status")
    meta: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Diagnostic metadata")
