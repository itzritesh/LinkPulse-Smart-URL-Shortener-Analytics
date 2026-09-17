"""Analytics API Router for LinkPulse.

Exposes protected, privacy-safe analytics queries for user short links
and aggregated account overviews.
"""
from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, Depends, Query, status, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_active_user
from app.models.user import User
from app.schemas.analytics import (
    ComprehensiveAnalyticsResponse,
    ClicksListResponse,
    DeviceAnalyticsResponse,
    ReferralAnalyticsResponse,
    LocationAnalyticsResponse,
    TimelineAnalyticsResponse,
    OverviewAnalyticsResponse,
    ClickRecordRequest,
    ClickEventItem,
    TopLinkItem,
    FilteredAnalyticsResponse,
    FilterOptions,
)
from app.services.analytics_service import AnalyticsService

router = APIRouter(prefix="/analytics", tags=["Analytics"])


# -----------------------------------------------------------------------------
# Static Endpoints (Must precede dynamic /{url_id} routes)
# -----------------------------------------------------------------------------

@router.get(
    "/filter",
    response_model=FilteredAnalyticsResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Filtered Analytics with Period Comparison",
    description="Executes multi-criteria telemetry filtering and comparative analytics directly at database level.",
)
def get_filtered_analytics(
    period: str = Query("30d", description="Period preset: 'today', '7d', '30d', '90d', or 'custom'"),
    start_date: Optional[str] = Query(None, description="Start date for custom range (YYYY-MM-DD or ISO)"),
    end_date: Optional[str] = Query(None, description="End date for custom range (YYYY-MM-DD or ISO)"),
    url_id: Optional[int] = Query(None, description="Optional short link ID to filter"),
    device: Optional[str] = Query(None, description="Device filter (Desktop, Mobile, Tablet)"),
    country: Optional[str] = Query(None, description="Country filter"),
    region: Optional[str] = Query(None, description="Region/state filter"),
    referrer: Optional[str] = Query(None, description="Referral source filter"),
    compare: bool = Query(True, description="Whether to include previous period comparison"),
    page: int = Query(1, ge=1, description="Page number for event list"),
    limit: int = Query(50, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> FilteredAnalyticsResponse:
    data = AnalyticsService.get_filtered_analytics(
        db=db,
        user_id=current_user.id,
        period=period,
        start_date=start_date,
        end_date=end_date,
        url_id=url_id,
        device=device,
        country=country,
        region=region,
        referrer=referrer,
        compare=compare,
        page=page,
        limit=limit,
    )
    return FilteredAnalyticsResponse(**data)


@router.get(
    "/filter-options",
    response_model=FilterOptions,
    status_code=status.HTTP_200_OK,
    summary="Get Available Filter Options",
    description="Returns available distinct devices, countries, regions, referrers, and URLs for dropdown menus.",
)
def get_filter_options(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> FilterOptions:
    data = AnalyticsService.get_filter_options(
        db=db,
        user_id=current_user.id,
    )
    return FilterOptions(**data)


@router.get(
    "/export",
    status_code=status.HTTP_200_OK,
    summary="Export Filtered Analytics Dataset",
    description="Streams the filtered telemetry dataset as a downloadable CSV attachment or JSON.",
)
def export_filtered_dataset(
    period: str = Query("30d", description="Period preset: 'today', '7d', '30d', '90d', or 'custom'"),
    start_date: Optional[str] = Query(None, description="Start date for custom range (YYYY-MM-DD or ISO)"),
    end_date: Optional[str] = Query(None, description="End date for custom range (YYYY-MM-DD or ISO)"),
    url_id: Optional[int] = Query(None, description="Optional short link ID to filter"),
    device: Optional[str] = Query(None, description="Device filter"),
    country: Optional[str] = Query(None, description="Country filter"),
    region: Optional[str] = Query(None, description="Region/state filter"),
    referrer: Optional[str] = Query(None, description="Referral source filter"),
    format: str = Query("csv", description="Export format: 'csv' or 'json'"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    result = AnalyticsService.export_filtered_analytics(
        db=db,
        user_id=current_user.id,
        period=period,
        start_date=start_date,
        end_date=end_date,
        url_id=url_id,
        device=device,
        country=country,
        region=region,
        referrer=referrer,
        export_format=format,
    )
    if format.lower() == "json":
        return result

    filename = f"linkpulse_analytics_{period}_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}.csv"
    return Response(
        content=result,
        media_type="text/csv",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Access-Control-Expose-Headers": "Content-Disposition",
        },
    )


@router.get(
    "/overview",
    response_model=OverviewAnalyticsResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Account-wide Analytics Overview",
    description="Aggregates click performance across all links created by the authenticated user.",
)
def get_overview_analytics(
    days: int = Query(30, ge=1, le=365, description="Historical analysis window in days"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> OverviewAnalyticsResponse:
    data = AnalyticsService.get_overview_analytics(
        db=db,
        user_id=current_user.id,
        days=days,
    )
    return OverviewAnalyticsResponse(**data)


@router.post(
    "/record",
    status_code=status.HTTP_201_CREATED,
    summary="Record Click Event",
    description="Internal endpoint to record a click event with modular telemetry parsing.",
)
def record_click_event(
    payload: ClickRecordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    # Verify the current user owns the URL being tracked to prevent click spoofing
    AnalyticsService.verify_url_ownership(db, current_user.id, payload.url_id)
    event = AnalyticsService.record_click(
        url_id=payload.url_id,
        ip_address=payload.ip_address,
        user_agent=payload.user_agent,
        referrer=payload.referrer,
        db=db,
    )
    return {"status": "success", "event_id": event.id if event else None}


@router.get(
    "/recent-clicks",
    response_model=List[ClickEventItem],
    status_code=status.HTTP_200_OK,
    summary="Get Recent Account Clicks",
    description="Returns the latest visitor click events across all short links owned by the user, without raw IP addresses.",
)
def get_recent_account_clicks(
    limit: int = Query(10, ge=1, le=50, description="Max click events to return"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> List[ClickEventItem]:
    return AnalyticsService.get_recent_account_clicks(
        db=db,
        user_id=current_user.id,
        limit=limit,
    )


@router.get(
    "/top-links",
    response_model=List[TopLinkItem],
    status_code=status.HTTP_200_OK,
    summary="Get Top Performing Links",
    description="Returns top performing short links owned by the user ordered by total click volume.",
)
def get_top_performing_links(
    limit: int = Query(5, ge=1, le=20, description="Number of top links to return"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> List[TopLinkItem]:
    return AnalyticsService.get_top_performing_links(
        db=db,
        user_id=current_user.id,
        limit=limit,
    )


# -----------------------------------------------------------------------------
# Dynamic URL Analytics Endpoints
# -----------------------------------------------------------------------------

@router.get(
    "/{url_id}",
    response_model=ComprehensiveAnalyticsResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Comprehensive URL Analytics",
    description="Returns lifetime and period KPIs, timeline, and category breakdowns for a user short link.",
)
def get_url_summary(
    url_id: int,
    period: str = Query("30d", description="Filter preset: 'today', '7d', '30d', or 'custom'"),
    start_date: Optional[str] = Query(None, description="Start date for custom range (YYYY-MM-DD or ISO)"),
    end_date: Optional[str] = Query(None, description="End date for custom range (YYYY-MM-DD or ISO)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> ComprehensiveAnalyticsResponse:
    data = AnalyticsService.get_url_summary(
        db=db,
        user_id=current_user.id,
        url_id=url_id,
        period=period,
        start_date=start_date,
        end_date=end_date,
    )
    return ComprehensiveAnalyticsResponse(**data)


@router.get(
    "/{url_id}/clicks",
    response_model=ClicksListResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Click Statistics and Paginated Event Log",
    description="Returns high-level click counters (total, today, week, month) and recent click events without raw IP addresses.",
)
def get_url_clicks(
    url_id: int,
    period: str = Query("30d", description="Filter preset: 'today', '7d', '30d', or 'custom'"),
    start_date: Optional[str] = Query(None, description="Start date for custom range (YYYY-MM-DD or ISO)"),
    end_date: Optional[str] = Query(None, description="End date for custom range (YYYY-MM-DD or ISO)"),
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    limit: int = Query(20, ge=1, le=100, description="Items per page (max 100)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> ClicksListResponse:
    data = AnalyticsService.get_url_clicks(
        db=db,
        user_id=current_user.id,
        url_id=url_id,
        period=period,
        start_date=start_date,
        end_date=end_date,
        page=page,
        limit=limit,
    )
    return ClicksListResponse(**data)


@router.get(
    "/{url_id}/devices",
    response_model=DeviceAnalyticsResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Device, Browser, and OS Breakdown",
    description="Returns aggregated visitor device types, web browsers, and operating systems.",
)
def get_url_devices(
    url_id: int,
    period: str = Query("30d", description="Filter preset: 'today', '7d', '30d', or 'custom'"),
    start_date: Optional[str] = Query(None, description="Start date for custom range (YYYY-MM-DD or ISO)"),
    end_date: Optional[str] = Query(None, description="End date for custom range (YYYY-MM-DD or ISO)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> DeviceAnalyticsResponse:
    data = AnalyticsService.get_url_devices(
        db=db,
        user_id=current_user.id,
        url_id=url_id,
        period=period,
        start_date=start_date,
        end_date=end_date,
    )
    return DeviceAnalyticsResponse(**data)


@router.get(
    "/{url_id}/referrals",
    response_model=ReferralAnalyticsResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Referral Sources Breakdown",
    description="Returns aggregated referring websites, search engines, and social media sources.",
)
def get_url_referrals(
    url_id: int,
    period: str = Query("30d", description="Filter preset: 'today', '7d', '30d', or 'custom'"),
    start_date: Optional[str] = Query(None, description="Start date for custom range (YYYY-MM-DD or ISO)"),
    end_date: Optional[str] = Query(None, description="End date for custom range (YYYY-MM-DD or ISO)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> ReferralAnalyticsResponse:
    data = AnalyticsService.get_url_referrals(
        db=db,
        user_id=current_user.id,
        url_id=url_id,
        period=period,
        start_date=start_date,
        end_date=end_date,
    )
    return ReferralAnalyticsResponse(**data)


@router.get(
    "/{url_id}/locations",
    response_model=LocationAnalyticsResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Geographic Location Breakdown",
    description="Returns approximate geographic distribution broken down by country, region/state, and city.",
)
def get_url_locations(
    url_id: int,
    period: str = Query("30d", description="Filter preset: 'today', '7d', '30d', or 'custom'"),
    start_date: Optional[str] = Query(None, description="Start date for custom range (YYYY-MM-DD or ISO)"),
    end_date: Optional[str] = Query(None, description="End date for custom range (YYYY-MM-DD or ISO)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> LocationAnalyticsResponse:
    data = AnalyticsService.get_url_locations(
        db=db,
        user_id=current_user.id,
        url_id=url_id,
        period=period,
        start_date=start_date,
        end_date=end_date,
    )
    return LocationAnalyticsResponse(**data)


@router.get(
    "/{url_id}/timeline",
    response_model=TimelineAnalyticsResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Click Timeline and Trends",
    description="Returns time-series click events (grouped by day or hour), peak click date, and daily averages.",
)
def get_url_timeline(
    url_id: int,
    period: str = Query("30d", description="Filter preset: 'today', '7d', '30d', or 'custom'"),
    start_date: Optional[str] = Query(None, description="Start date for custom range (YYYY-MM-DD or ISO)"),
    end_date: Optional[str] = Query(None, description="End date for custom range (YYYY-MM-DD or ISO)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> TimelineAnalyticsResponse:
    data = AnalyticsService.get_url_timeline(
        db=db,
        user_id=current_user.id,
        url_id=url_id,
        period=period,
        start_date=start_date,
        end_date=end_date,
    )
    return TimelineAnalyticsResponse(**data)


# -----------------------------------------------------------------------------
# Backwards-Compatibility Alias
# -----------------------------------------------------------------------------

@router.get(
    "/urls/{url_id}",
    response_model=ComprehensiveAnalyticsResponse,
    status_code=status.HTTP_200_OK,
    summary="Get URL Click Analytics (Legacy Route)",
    include_in_schema=False,
)
def get_url_analytics_legacy(
    url_id: int,
    days: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> ComprehensiveAnalyticsResponse:
    period = f"{days}d" if days in (7, 30) else "30d"
    data = AnalyticsService.get_url_summary(
        db=db,
        user_id=current_user.id,
        url_id=url_id,
        period=period,
    )
    return ComprehensiveAnalyticsResponse(**data)
