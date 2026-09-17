"""Pydantic schemas for LinkPulse Analytics.

Enforces strict privacy by design: raw visitor IP addresses are never
exposed in dashboard response schemas.
"""
from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict, Field


class ClickKPIStats(BaseModel):
    total_clicks: int = Field(0, description="Lifetime total clicks recorded for this URL")
    clicks_today: int = Field(0, description="Clicks recorded today since 00:00 UTC")
    clicks_this_week: int = Field(0, description="Clicks recorded in the current week")
    clicks_this_month: int = Field(0, description="Clicks recorded in the current calendar month")
    unique_visitors: int = Field(0, description="Unique visitor count in period")

    model_config = ConfigDict(from_attributes=True)


class ClickBreakdownItem(BaseModel):
    name: str = Field(..., description="Category label, e.g. 'Chrome', 'Desktop', 'United States'")
    count: int = Field(..., description="Total click occurrences")
    percentage: float = Field(..., description="Percentage share of total clicks in period")

    model_config = ConfigDict(from_attributes=True)


class ClickTimeSeriesItem(BaseModel):
    date: str = Field(..., description="Date or hour interval formatted string (e.g. YYYY-MM-DD)")
    clicks: int = Field(..., description="Number of clicks recorded in that interval")

    model_config = ConfigDict(from_attributes=True)


class ClickEventItem(BaseModel):
    id: int
    url_id: Optional[int] = None
    short_code: Optional[str] = None
    url_title: Optional[str] = None
    device_type: Optional[str] = None
    browser: Optional[str] = None
    operating_system: Optional[str] = None
    country: Optional[str] = None
    region: Optional[str] = None
    city: Optional[str] = None
    referrer: Optional[str] = None
    clicked_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TopLinkItem(BaseModel):
    id: int
    short_code: str
    original_url: str
    title: Optional[str] = None
    clicks: int = 0
    is_active: bool = True
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ComprehensiveAnalyticsResponse(BaseModel):
    url_id: int
    short_code: str
    title: Optional[str] = None
    original_url: str
    is_active: bool = True
    created_at: Optional[datetime] = None
    period: str
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    kpis: ClickKPIStats
    total_clicks: int = 0
    total_in_period: int = 0
    unique_visitors: int = 0
    peak_date: Optional[str] = None
    peak_clicks: int = 0
    average_clicks_per_day: float = 0.0
    timeline: List[ClickTimeSeriesItem] = Field(default_factory=list)
    devices: List[ClickBreakdownItem] = Field(default_factory=list)
    browsers: List[ClickBreakdownItem] = Field(default_factory=list)
    operating_systems: List[ClickBreakdownItem] = Field(default_factory=list)
    referrals: List[ClickBreakdownItem] = Field(default_factory=list)
    countries: List[ClickBreakdownItem] = Field(default_factory=list)
    regions: List[ClickBreakdownItem] = Field(default_factory=list)
    cities: List[ClickBreakdownItem] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


# Backwards compatibility alias
URLAnalyticsResponse = ComprehensiveAnalyticsResponse


class ClicksListResponse(BaseModel):
    url_id: int
    short_code: str
    period: str
    kpis: ClickKPIStats
    total_in_period: int
    page: int
    limit: int
    total_pages: int
    events: List[ClickEventItem] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class DeviceAnalyticsResponse(BaseModel):
    url_id: int
    short_code: str
    period: str
    total_clicks: int
    devices: List[ClickBreakdownItem] = Field(default_factory=list)
    browsers: List[ClickBreakdownItem] = Field(default_factory=list)
    operating_systems: List[ClickBreakdownItem] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class ReferralAnalyticsResponse(BaseModel):
    url_id: int
    short_code: str
    period: str
    total_clicks: int
    referrals: List[ClickBreakdownItem] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class LocationAnalyticsResponse(BaseModel):
    url_id: int
    short_code: str
    period: str
    total_clicks: int
    countries: List[ClickBreakdownItem] = Field(default_factory=list)
    regions: List[ClickBreakdownItem] = Field(default_factory=list)
    cities: List[ClickBreakdownItem] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class TimelineAnalyticsResponse(BaseModel):
    url_id: int
    short_code: str
    period: str
    interval: str = "day"
    total_clicks: int
    timeline: List[ClickTimeSeriesItem] = Field(default_factory=list)
    peak_date: Optional[str] = None
    peak_clicks: int = 0
    average_clicks_per_day: float = 0.0

    model_config = ConfigDict(from_attributes=True)


class OverviewAnalyticsResponse(BaseModel):
    total_links: int
    active_links: int
    total_clicks: int
    period_days: int
    clicks_over_time: List[ClickTimeSeriesItem] = Field(default_factory=list)
    devices: List[ClickBreakdownItem] = Field(default_factory=list)
    countries: List[ClickBreakdownItem] = Field(default_factory=list)
    browsers: List[ClickBreakdownItem] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class ClickRecordRequest(BaseModel):
    url_id: int
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    referrer: Optional[str] = None


class MetricComparison(BaseModel):
    current: int = 0
    previous: int = 0
    change_pct: float = 0.0
    trend: str = "neutral"  # "up", "down", "neutral"

    model_config = ConfigDict(from_attributes=True)


class PeriodComparison(BaseModel):
    current_period: str
    previous_period: str
    clicks: MetricComparison
    visitors: MetricComparison
    mobile_traffic: MetricComparison
    referral_traffic: MetricComparison

    model_config = ConfigDict(from_attributes=True)


class FilterOptions(BaseModel):
    devices: List[str] = Field(default_factory=list)
    countries: List[str] = Field(default_factory=list)
    regions: List[str] = Field(default_factory=list)
    referrers: List[str] = Field(default_factory=list)
    urls: List[Dict[str, Any]] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class FilteredAnalyticsResponse(BaseModel):
    applied_filters: Dict[str, Any]
    kpis: Dict[str, Any]
    comparison: Optional[PeriodComparison] = None
    timeline: List[ClickTimeSeriesItem] = Field(default_factory=list)
    devices: List[ClickBreakdownItem] = Field(default_factory=list)
    browsers: List[ClickBreakdownItem] = Field(default_factory=list)
    operating_systems: List[ClickBreakdownItem] = Field(default_factory=list)
    referrals: List[ClickBreakdownItem] = Field(default_factory=list)
    countries: List[ClickBreakdownItem] = Field(default_factory=list)
    regions: List[ClickBreakdownItem] = Field(default_factory=list)
    cities: List[ClickBreakdownItem] = Field(default_factory=list)
    events: List[ClickEventItem] = Field(default_factory=list)
    total_events: int = 0
    filter_options: Optional[FilterOptions] = None

    model_config = ConfigDict(from_attributes=True)

