from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, Request, Response, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_active_user
from app.core.rate_limit import create_url_rate_limiter
from app.models.user import User
from app.models.url import ShortURL
from app.schemas.url import (
    URLCreateRequest,
    URLStatusUpdateRequest,
    URLResponse,
    URLDetailResponse,
)
from app.services.url_service import URLService

# Router mounted under /api/urls
router = APIRouter(prefix="/urls", tags=["URLs"])


def to_detail_response(url: ShortURL, request: Request) -> URLDetailResponse:
    """Helper to convert model to schema with computed short_url and is_expired flag."""
    base_url = str(request.base_url).rstrip("/")
    short_url = f"{base_url}/{url.short_code}"


    now = datetime.now(timezone.utc)
    is_expired = False
    if url.expires_at:
        exp = url.expires_at if url.expires_at.tzinfo else url.expires_at.replace(tzinfo=timezone.utc)
        is_expired = exp < now

    return URLDetailResponse(
        id=url.id,
        user_id=url.user_id,
        original_url=url.original_url,
        short_code=url.short_code,
        short_url=short_url,
        title=url.title,
        is_active=url.is_active,
        expires_at=url.expires_at,
        created_at=url.created_at,
        updated_at=url.updated_at,
        click_count=url.click_count,
        is_expired=is_expired,
    )


@router.post(
    "",
    response_model=URLDetailResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Short URL",
    description="Validates destination URL, generates unique or custom short code, and associates with current user.",
    dependencies=[Depends(create_url_rate_limiter)],
)
def create_url(
    payload: URLCreateRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> URLDetailResponse:
    url_obj = URLService.create_url(db, current_user.id, payload)
    return to_detail_response(url_obj, request)


@router.get(
    "",
    response_model=List[URLDetailResponse],
    status_code=status.HTTP_200_OK,
    summary="List User Short URLs",
    description="Retrieves all short URLs created by the currently authenticated user.",
)
def list_urls(
    request: Request,
    search: Optional[str] = None,
    is_active: Optional[bool] = None,
    skip: int = Query(0, ge=0, description="Offset for pagination"),
    limit: int = Query(50, ge=1, le=100, description="Max items per page"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> List[URLDetailResponse]:
    urls = URLService.list_user_urls(
        db=db,
        user_id=current_user.id,
        search=search,
        is_active=is_active,
        skip=skip,
        limit=limit,
    )
    return [to_detail_response(u, request) for u in urls]


@router.get(
    "/{url_id}",
    response_model=URLDetailResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Short URL Details",
    description="Fetches details for a single URL owned by the current user.",
)
def get_url(
    url_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> URLDetailResponse:
    url_obj = URLService.get_user_url(db, current_user.id, url_id)
    return to_detail_response(url_obj, request)


@router.delete(
    "/{url_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete Short URL",
    description="Deletes a short URL owned by the current user.",
)
def delete_url(
    url_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    URLService.delete_user_url(db, current_user.id, url_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.patch(
    "/{url_id}/status",
    response_model=URLDetailResponse,
    status_code=status.HTTP_200_OK,
    summary="Update Short URL Active Status",
    description="Activates or deactivates a short URL.",
)
def update_status(
    url_id: int,
    payload: URLStatusUpdateRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> URLDetailResponse:
    updated = URLService.update_url_status(db, current_user.id, url_id, payload.is_active)
    return to_detail_response(updated, request)

