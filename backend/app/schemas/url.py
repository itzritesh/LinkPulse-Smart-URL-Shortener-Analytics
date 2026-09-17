from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel, Field, field_validator

from app.utils.code_generator import normalize_and_validate_url, is_valid_custom_code


class URLCreateRequest(BaseModel):
    original_url: str = Field(..., max_length=2048, description="Target long destination URL")
    custom_code: Optional[str] = Field(
        None,
        min_length=3,
        max_length=64,
        description="Optional custom vanity short slug (e.g. 'my-launch')",
    )
    title: Optional[str] = Field(
        None,
        max_length=255,
        description="Optional descriptive title for reference",
    )
    expires_at: Optional[datetime] = Field(
        None,
        description="Optional expiration date and time in UTC",
    )

    @field_validator("title")
    @classmethod
    def sanitize_title(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        trimmed = v.strip()
        # Remove unprintable control characters
        cleaned = "".join(ch for ch in trimmed if ch.isprintable())
        return cleaned[:255] if cleaned else None

    @field_validator("original_url")
    @classmethod
    def validate_original_url(cls, v: str) -> str:
        return normalize_and_validate_url(v)

    @field_validator("custom_code")
    @classmethod
    def validate_custom_slug(cls, v: Optional[str]) -> Optional[str]:
        if not v:
            return None
        trimmed = v.strip()
        if not is_valid_custom_code(trimmed):
            raise ValueError(
                "Custom short code must be 3-64 alphanumeric characters, hyphens, or underscores, and not a reserved keyword."
            )
        return trimmed

    @field_validator("expires_at")
    @classmethod
    def validate_expiration(cls, v: Optional[datetime]) -> Optional[datetime]:
        if v and v <= datetime.now(timezone.utc):
            raise ValueError("Expiration date must be in the future.")
        return v


class URLStatusUpdateRequest(BaseModel):
    is_active: bool = Field(..., description="Whether the short URL is active or paused")


class URLResponse(BaseModel):
    id: int
    user_id: int
    original_url: str
    short_code: str
    title: Optional[str] = None
    is_active: bool
    expires_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    click_count: int
    is_expired: bool = False

    class Config:
        from_attributes = True


class URLDetailResponse(URLResponse):
    short_url: str
