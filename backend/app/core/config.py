from pathlib import Path
from typing import List, Union, Optional
import json
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "LinkPulse"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    API_V1_STR: str = "/api"

    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # CORS settings: Can accept a JSON string or a python list
    CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ]

    # Database Configuration (PostgreSQL)
    DATABASE_URL: str = "postgresql://linkpulse:linkpulse_secret@localhost:5432/linkpulse_db"

    # Redis Cache Configuration
    REDIS_ENABLED: bool = True
    REDIS_URL: Optional[str] = "redis://localhost:6379/0"
    REDIS_CACHE_TTL_SECONDS: int = 3600  # 1 hour
    REDIS_SOCKET_TIMEOUT: float = 1.0   # Fast fail 1 second socket timeout

    # JWT Authentication Configuration
    JWT_SECRET_KEY: str = "linkpulse-production-super-secret-jwt-key-change-in-prod-2025"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            if v.startswith("[") and v.endswith("]"):
                try:
                    return json.loads(v)
                except Exception:
                    pass
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, (list, set)):
            return list(v)
        return []

    @field_validator("JWT_SECRET_KEY")
    @classmethod
    def validate_jwt_secret(cls, v: str) -> str:
        if not v or len(v) < 32:
            import warnings
            warnings.warn("JWT_SECRET_KEY is too short (recommended >= 32 characters) for production security.")
        return v

    model_config = SettingsConfigDict(
        env_file=(
            str(Path(__file__).resolve().parent.parent.parent / ".env"),
            ".env",
        ),
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


settings = Settings()
