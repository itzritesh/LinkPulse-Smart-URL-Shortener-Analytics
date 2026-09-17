from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Request, BackgroundTasks, status
from fastapi.responses import RedirectResponse, JSONResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.rate_limit import redirect_rate_limiter
from app.services.cache_service import CacheService
from app.services.url_service import (
    URLService,
    URLNotFoundException,
    URLInactiveException,
    URLExpiredException,
)
from app.services.analytics_service import AnalyticsService
from app.utils.code_generator import RESERVED_CODES
from app.utils.html_responses import render_error_page

redirect_router = APIRouter(tags=["Redirect Engine"])


def _respond_error(request: Request, status_code: int, error_type: str, message: str, badge_variant: str, short_code: str):
    """Returns a branded HTML page for browser visitors or clean JSON for API callers."""
    accept_header = request.headers.get("accept", "")
    is_browser = "text/html" in accept_header

    if is_browser:
        labels = {
            "not_found": ("404 Not Found", "Link Not Found"),
            "link_inactive": ("410 Paused", "Link Deactivated"),
            "link_expired": ("410 Expired", "Link Has Expired"),
        }
        badge_label, heading = labels.get(error_type, (f"{status_code} Error", "Notice"))
        return render_error_page(
            status_code=status_code,
            badge_label=badge_label,
            badge_variant=badge_variant,
            title=heading,
            heading=heading,
            description=message,
            short_code=short_code,
        )

    return JSONResponse(
        status_code=status_code,
        content={"error": error_type, "detail": message, "short_code": short_code},
    )


def process_redirect(
    short_code: str,
    request: Request,
    background_tasks: BackgroundTasks,
    db: Session,
):
    """Core redirect processor decoupled from analytics writes."""
    trimmed_code = short_code.strip()

    # 1. Guard against system reserved paths and static file requests
    if trimmed_code.lower() in RESERVED_CODES or trimmed_code in ["favicon.ico", "robots.txt", "sitemap.xml"]:
        return _respond_error(
            request=request,
            status_code=status.HTTP_404_NOT_FOUND,
            error_type="not_found",
            message=f"The requested link '{trimmed_code}' does not exist.",
            badge_variant="violet",
            short_code=trimmed_code,
        )

    # 2. Check Redis / Memory Cache first for high-performance zero-DB lookup
    cached = CacheService.get_url(trimmed_code)
    url_id: int
    dest_url: str

    if cached:
        # Check active status from cache
        if not cached.get("is_active", True):
            return _respond_error(
                request=request,
                status_code=status.HTTP_410_GONE,
                error_type="link_inactive",
                message="This short link has been paused or temporarily deactivated by its creator.",
                badge_variant="amber",
                short_code=trimmed_code,
            )

        # Check expiration from cache
        expires_at_str = cached.get("expires_at")
        if expires_at_str:
            try:
                expires_at = datetime.fromisoformat(expires_at_str)
                if expires_at < datetime.now(timezone.utc):
                    CacheService.delete_url(trimmed_code)
                    return _respond_error(
                        request=request,
                        status_code=status.HTTP_410_GONE,
                        error_type="link_expired",
                        message="This short link reached its expiration date and is no longer available.",
                        badge_variant="rose",
                        short_code=trimmed_code,
                    )
            except Exception:
                pass

        url_id = cached["id"]
        dest_url = cached["original_url"]
    else:
        # 3. Cache miss or Redis offline: Query PostgreSQL directly
        try:
            url_record = URLService.resolve_url(db, trimmed_code)
        except URLNotFoundException:
            return _respond_error(
                request=request,
                status_code=status.HTTP_404_NOT_FOUND,
                error_type="not_found",
                message="The short link you followed does not exist or may have been deleted.",
                badge_variant="violet",
                short_code=trimmed_code,
            )
        except URLInactiveException:
            return _respond_error(
                request=request,
                status_code=status.HTTP_410_GONE,
                error_type="link_inactive",
                message="This short link has been paused or temporarily deactivated by its creator.",
                badge_variant="amber",
                short_code=trimmed_code,
            )
        except URLExpiredException:
            return _respond_error(
                request=request,
                status_code=status.HTTP_410_GONE,
                error_type="link_expired",
                message="This short link reached its expiration date and is no longer available.",
                badge_variant="rose",
                short_code=trimmed_code,
            )

        url_id = url_record.id
        dest_url = url_record.original_url

        # Store validated URL in cache for subsequent visitors
        CacheService.set_url(
            trimmed_code,
            {
                "id": url_record.id,
                "original_url": url_record.original_url,
                "is_active": url_record.is_active,
                "expires_at": url_record.expires_at.isoformat() if url_record.expires_at else None,
            },
        )

    # 4. Extract request network telemetry (zero delay before redirect)
    forwarded_for = request.headers.get("x-forwarded-for")
    ip_address = forwarded_for.split(",")[0].strip() if forwarded_for else (request.client.host if request.client else None)
    user_agent = request.headers.get("user-agent")
    referrer = request.headers.get("referer") or request.headers.get("referrer")

    # 5. Schedule modular analytics persistence in background task
    background_tasks.add_task(
        AnalyticsService.record_click,
        url_id=url_id,
        ip_address=ip_address,
        user_agent=user_agent,
        referrer=referrer,
        headers=dict(request.headers),
    )

    # 6. Sanitize destination URL and perform HTTP 307 Temporary Redirect
    dest_url = dest_url.strip()
    if "\r" in dest_url or "\n" in dest_url:
        return _respond_error(
            request=request,
            status_code=status.HTTP_400_BAD_REQUEST,
            error_type="malformed_url",
            message="The destination URL is corrupted or invalid.",
            badge_variant="rose",
            short_code=trimmed_code,
        )

    return RedirectResponse(
        url=dest_url,
        status_code=status.HTTP_307_TEMPORARY_REDIRECT,
        headers={
            "Cache-Control": "no-cache, no-store, max-age=0, must-revalidate",
            "Pragma": "no-cache",
            "X-Content-Type-Options": "nosniff",
        },
    )


@redirect_router.get(
    "/{short_code}",
    summary="Public Short Link Redirection",
    description="Resolves short_code, validates status & expiration, records telemetry, and redirects to destination.",
    response_class=RedirectResponse,
    dependencies=[Depends(redirect_rate_limiter)],
)
def redirect_short_url(
    short_code: str,
    request: Request,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    return process_redirect(short_code, request, background_tasks, db)


@redirect_router.get(
    "/r/{short_code}",
    include_in_schema=False,
    dependencies=[Depends(redirect_rate_limiter)],
)
def redirect_short_url_alias(
    short_code: str,
    request: Request,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    return process_redirect(short_code, request, background_tasks, db)
