from datetime import datetime, timezone
from typing import Optional, List
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.models.url import ShortURL
from app.schemas.url import URLCreateRequest
from app.utils.code_generator import generate_short_code
from app.services.cache_service import CacheService


class ShortLinkException(Exception):
    """Base exception for short link resolution errors."""
    pass


class URLNotFoundException(ShortLinkException):
    """Raised when a short code does not exist."""
    pass


class URLInactiveException(ShortLinkException):
    """Raised when a short link exists but is currently deactivated/paused."""
    pass


class URLExpiredException(ShortLinkException):
    """Raised when a short link has exceeded its expiration timestamp."""
    def __init__(self, expires_at: Optional[datetime] = None):
        self.expires_at = expires_at
        super().__init__("This short link has expired.")


class URLService:
    @staticmethod
    def create_url(db: Session, user_id: int, req: URLCreateRequest) -> ShortURL:
        """Creates a validated short URL for the authenticated user."""
        short_code: str

        if req.custom_code:
            # Check if custom slug already taken
            existing = db.query(ShortURL).filter(ShortURL.short_code == req.custom_code).first()
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Custom code '{req.custom_code}' is already in use. Please select another.",
                )
            short_code = req.custom_code
        else:
            # Generate collision-resistant unique short code
            max_attempts = 5
            code_length = 7
            short_code = None

            for attempt in range(max_attempts):
                candidate = generate_short_code(length=code_length)
                if not db.query(ShortURL).filter(ShortURL.short_code == candidate).first():
                    short_code = candidate
                    break

            if not short_code:
                # Fallback to longer code if collision persists
                short_code = generate_short_code(length=9)

        # Derive a title if none provided
        title = req.title.strip() if req.title else req.original_url.split("//")[-1].split("/")[0]

        short_url_obj = ShortURL(
            user_id=user_id,
            original_url=req.original_url,
            short_code=short_code,
            title=title,
            expires_at=req.expires_at,
            is_active=True,
            click_count=0,
        )

        db.add(short_url_obj)
        db.commit()
        db.refresh(short_url_obj)
        return short_url_obj

    @staticmethod
    def list_user_urls(
        db: Session,
        user_id: int,
        search: Optional[str] = None,
        is_active: Optional[bool] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> List[ShortURL]:
        """Lists only the links belonging to the authenticated user."""
        query = db.query(ShortURL).filter(ShortURL.user_id == user_id)

        if search:
            search_term = f"%{search.strip()}%"
            query = query.filter(
                or_(
                    ShortURL.original_url.ilike(search_term),
                    ShortURL.short_code.ilike(search_term),
                    ShortURL.title.ilike(search_term),
                )
            )

        if is_active is not None:
            query = query.filter(ShortURL.is_active == is_active)

        return query.order_by(ShortURL.created_at.desc()).offset(skip).limit(limit).all()

    @staticmethod
    def get_user_url(db: Session, user_id: int, url_id: int) -> ShortURL:
        """Fetches a single link, strictly ensuring user ownership."""
        url = db.query(ShortURL).filter(
            ShortURL.id == url_id,
            ShortURL.user_id == user_id,
        ).first()

        if not url:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Short URL not found or you do not have permission to view it.",
            )
        return url

    @staticmethod
    def delete_user_url(db: Session, user_id: int, url_id: int) -> None:
        """Deletes a short URL owned by the authenticated user and invalidates cache."""
        url = URLService.get_user_url(db, user_id, url_id)
        short_code = url.short_code
        db.delete(url)
        db.commit()
        # Invalidate cached short code lookup
        CacheService.delete_url(short_code)

    @staticmethod
    def update_url_status(db: Session, user_id: int, url_id: int, is_active: bool) -> ShortURL:
        """Activates or deactivates a short URL owned by the authenticated user and invalidates cache."""
        url = URLService.get_user_url(db, user_id, url_id)
        url.is_active = is_active
        db.commit()
        db.refresh(url)
        # Invalidate cached short code lookup so visitors reflect new status immediately
        CacheService.delete_url(url.short_code)
        return url

    @staticmethod
    def resolve_url(db: Session, short_code: str) -> ShortURL:
        """Resolves short code to ShortURL model, validating existence, status, and expiration.

        Maintains strict separation of concerns by not performing analytics writes or tracking.
        """
        url = db.query(ShortURL).filter(ShortURL.short_code == short_code).first()

        if not url:
            raise URLNotFoundException(f"No link found for short code '{short_code}'.")

        if not url.is_active:
            raise URLInactiveException("This short link has been deactivated by its owner.")

        now = datetime.now(timezone.utc)
        if url.expires_at:
            exp = url.expires_at if url.expires_at.tzinfo else url.expires_at.replace(tzinfo=timezone.utc)
            if exp < now:
                raise URLExpiredException(expires_at=url.expires_at)

        return url

    @staticmethod
    def resolve_and_track_url(db: Session, short_code: str) -> str:
        """Resolves short code to destination URL, validates status/expiration, and counts click."""
        try:
            url = URLService.resolve_url(db, short_code)
        except URLNotFoundException:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Link not found.",
            )
        except (URLInactiveException, URLExpiredException) as exc:
            raise HTTPException(
                status_code=status.HTTP_410_GONE,
                detail=str(exc),
            )

        # Increment click count
        url.click_count += 1
        db.commit()

        return url.original_url

