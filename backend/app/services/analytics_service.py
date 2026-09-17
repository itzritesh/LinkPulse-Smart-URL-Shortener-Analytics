"""Analytics Service for LinkPulse.

Coordinates modular telemetry processing (User-Agent detection, approximate geolocation),
click event persistence, and privacy-preserving dashboard aggregations.
"""
import math
import io
import csv
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any, List, Tuple
from urllib.parse import urlparse
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, case

from app.core.database import SessionLocal
from app.models.analytics import Click
from app.models.url import ShortURL
from app.services.user_agent_service import UserAgentService
from app.services.geo_service import GeoService
from app.utils.logger import logger


class AnalyticsService:
    @staticmethod
    def sanitize_referrer(raw_referrer: Optional[str]) -> Optional[str]:
        """Sanitizes referrer to domain/hostname only, avoiding leaking visitor private query parameters."""
        if not raw_referrer or not raw_referrer.strip():
            return "Direct / Unknown"
        trimmed = raw_referrer.strip()
        try:
            parsed = urlparse(trimmed)
            if parsed.netloc:
                return parsed.netloc.lower()
            return trimmed[:255]
        except Exception:
            return trimmed[:255]

    @classmethod
    def record_click(
        cls,
        url_id: int,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        referrer: Optional[str] = None,
        headers: Optional[Dict[str, str]] = None,
        clicked_at: Optional[datetime] = None,
        db: Optional[Session] = None,
    ) -> Optional[Click]:
        """Records a granular click event in the 'clicks' table and increments URL click count.

        Safe to run synchronously or asynchronously inside FastAPI BackgroundTasks.
        """
        session_created = False
        if db is None:
            db = SessionLocal()
            session_created = True

        try:
            # 1. Parse User-Agent for device, browser, and OS
            ua_data = UserAgentService.parse(user_agent or "")

            # 2. Approximate geolocation (Country, Region, City)
            geo_data = GeoService.lookup_approximate_location(ip_address, headers)

            # 3. Sanitize referrer
            clean_referrer = cls.sanitize_referrer(referrer)

            # 4. Insert Click record
            click_event = Click(
                url_id=url_id,
                ip_address=ip_address,  # Stored securely in backend only; never exposed via API
                country=geo_data.get("country"),
                region=geo_data.get("region"),
                city=geo_data.get("city"),
                device_type=ua_data.get("device_type"),
                browser=ua_data.get("browser"),
                operating_system=ua_data.get("operating_system"),
                referrer=clean_referrer,
                clicked_at=clicked_at or datetime.now(timezone.utc),
            )
            db.add(click_event)

            # 5. Increment ShortURL click counter
            url_obj = db.query(ShortURL).filter(ShortURL.id == url_id).first()
            if url_obj:
                url_obj.click_count = (url_obj.click_count or 0) + 1

            db.commit()
            db.refresh(click_event)
            return click_event
        except Exception as exc:
            db.rollback()
            logger.error(f"Failed to record click for url_id={url_id}: {exc}")
            return None
        finally:
            if session_created:
                db.close()

    @staticmethod
    def _compute_breakdown(items: List[tuple], total: int) -> List[Dict[str, Any]]:
        """Utility to format categorical query results with count and percentage."""
        breakdown = []
        for name, count in items:
            percentage = round((count / total) * 100, 1) if total > 0 else 0.0
            breakdown.append({
                "name": name or "Unknown",
                "count": count,
                "percentage": percentage,
            })
        return breakdown

    @staticmethod
    def verify_url_ownership(db: Session, user_id: int, url_id: int) -> ShortURL:
        """Verifies that the target short link exists and belongs to the authenticated user."""
        url = db.query(ShortURL).filter(ShortURL.id == url_id, ShortURL.user_id == user_id).first()
        if not url:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Short link not found or you do not have permission to view its analytics.",
            )
        return url

    @staticmethod
    def resolve_date_range(
        period: str = "30d",
        start_date_str: Optional[str] = None,
        end_date_str: Optional[str] = None,
    ) -> Tuple[datetime, datetime, str]:
        """Resolves date boundaries for query filtering based on preset or custom date range."""
        now = datetime.now(timezone.utc)
        p = (period or "30d").lower().strip()

        if p == "today":
            start = now.replace(hour=0, minute=0, second=0, microsecond=0)
            end = now
            return start, end, "today"

        elif p == "7d":
            start = now - timedelta(days=7)
            end = now
            return start, end, "7d"

        elif p == "30d":
            start = now - timedelta(days=30)
            end = now
            return start, end, "30d"

        elif p == "90d":
            start = now - timedelta(days=90)
            end = now
            return start, end, "90d"

        elif p == "custom":
            if not start_date_str or not end_date_str:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Both start_date and end_date query parameters are required when period='custom'.",
                )

            try:
                if "T" in start_date_str:
                    start = datetime.fromisoformat(start_date_str.replace("Z", "+00:00"))
                else:
                    start = datetime.strptime(start_date_str, "%Y-%m-%d")
                if start.tzinfo is None:
                    start = start.replace(tzinfo=timezone.utc)
            except Exception:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid start_date format. Expected YYYY-MM-DD or ISO-8601 string.",
                )

            try:
                if "T" in end_date_str:
                    end = datetime.fromisoformat(end_date_str.replace("Z", "+00:00"))
                else:
                    end = datetime.strptime(end_date_str, "%Y-%m-%d").replace(
                        hour=23, minute=59, second=59, microsecond=999999
                    )
                if end.tzinfo is None:
                    end = end.replace(tzinfo=timezone.utc)
            except Exception:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid end_date format. Expected YYYY-MM-DD or ISO-8601 string.",
                )

            if start > end:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="start_date must be earlier than or equal to end_date.",
                )

            return start, end, "custom"

        else:
            # Fallback to 30 days
            start = now - timedelta(days=30)
            end = now
            return start, end, "30d"

    @staticmethod
    def resolve_comparison_range(
        start_dt: datetime,
        end_dt: datetime,
        period: str = "30d",
    ) -> Tuple[datetime, datetime, str]:
        """Calculates identical preceding period window for side-by-side comparison."""
        p = (period or "").lower().strip()
        if p == "today":
            prev_start = start_dt - timedelta(days=1)
            prev_end = end_dt - timedelta(days=1)
            return prev_start, prev_end, "Yesterday"

        delta = end_dt - start_dt
        prev_start = start_dt - delta
        prev_end = start_dt
        if p == "7d":
            label = "Previous 7 days"
        elif p == "30d":
            label = "Previous 30 days"
        elif p == "90d":
            label = "Previous 90 days"
        else:
            days_count = max(1, delta.days)
            label = f"Previous {days_count} days"
        return prev_start, prev_end, label

    @classmethod
    def get_kpi_stats(cls, db: Session, url_id: int) -> Dict[str, int]:
        """Calculates high-level click counters (lifetime, today, this week, this month) in a single fast query."""
        now = datetime.now(timezone.utc)
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        monday_start = today_start - timedelta(days=now.weekday())
        month_start = today_start.replace(day=1)

        row = db.query(
            func.count(Click.id).label("total_clicks"),
            func.count(case((Click.clicked_at >= today_start, Click.id), else_=None)).label("clicks_today"),
            func.count(case((Click.clicked_at >= monday_start, Click.id), else_=None)).label("clicks_this_week"),
            func.count(case((Click.clicked_at >= month_start, Click.id), else_=None)).label("clicks_this_month"),
        ).filter(Click.url_id == url_id).first()

        return {
            "total_clicks": row.total_clicks if row and row.total_clicks else 0,
            "clicks_today": row.clicks_today if row and row.clicks_today else 0,
            "clicks_this_week": row.clicks_this_week if row and row.clicks_this_week else 0,
            "clicks_this_month": row.clicks_this_month if row and row.clicks_this_month else 0,
        }

    @classmethod
    def get_timeline_data(
        cls,
        db: Session,
        url_id: int,
        start_dt: datetime,
        end_dt: datetime,
        period: str,
    ) -> Tuple[List[Dict[str, Any]], Optional[str], int, float]:
        """Computes timeline aggregation points, peak dates, and daily averages."""
        dialect_name = db.bind.dialect.name if db.bind else "postgresql"
        is_hourly = (period == "today")

        if dialect_name == "sqlite":
            date_expr = (
                func.strftime("%Y-%m-%d %H:00", Click.clicked_at)
                if is_hourly
                else func.strftime("%Y-%m-%d", Click.clicked_at)
            )
        else:
            date_expr = (
                func.to_char(Click.clicked_at, "YYYY-MM-DD HH24:00")
                if is_hourly
                else func.to_char(Click.clicked_at, "YYYY-MM-DD")
            )

        rows = (
            db.query(date_expr.label("date_label"), func.count(Click.id).label("count"))
            .filter(Click.url_id == url_id, Click.clicked_at >= start_dt, Click.clicked_at <= end_dt)
            .group_by("date_label")
            .order_by("date_label")
            .all()
        )

        timeline = [{"date": r.date_label, "clicks": r.count} for r in rows]
        peak_date = None
        peak_clicks = 0
        total_in_timeline = 0

        for item in timeline:
            total_in_timeline += item["clicks"]
            if item["clicks"] > peak_clicks:
                peak_clicks = item["clicks"]
                peak_date = item["date"]

        days_count = max(1, (end_dt.date() - start_dt.date()).days + 1)
        average_clicks_per_day = round(total_in_timeline / days_count, 1)

        return timeline, peak_date, peak_clicks, average_clicks_per_day

    @classmethod
    def get_breakdown(
        cls,
        db: Session,
        url_id: int,
        field,
        start_dt: datetime,
        end_dt: datetime,
        total_in_period: int,
        limit: Optional[int] = None,
    ) -> List[Dict[str, Any]]:
        """Categorical breakdown query utility with count and percentage calculation."""
        query = (
            db.query(field, func.count(Click.id))
            .filter(Click.url_id == url_id, Click.clicked_at >= start_dt, Click.clicked_at <= end_dt)
            .group_by(field)
            .order_by(desc(func.count(Click.id)))
        )
        if limit:
            query = query.limit(limit)
        items = query.all()
        return cls._compute_breakdown(items, total_in_period)

    # -------------------------------------------------------------------------
    # Core Endpoint Service Methods
    # -------------------------------------------------------------------------

    @classmethod
    def get_url_summary(
        cls,
        db: Session,
        user_id: int,
        url_id: int,
        period: str = "30d",
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Comprehensive summary for GET /api/analytics/{url_id}."""
        url = cls.verify_url_ownership(db, user_id, url_id)
        start_dt, end_dt, period_label = cls.resolve_date_range(period, start_date, end_date)

        kpis = cls.get_kpi_stats(db, url_id)
        total_in_period = (
            db.query(func.count(Click.id))
            .filter(Click.url_id == url_id, Click.clicked_at >= start_dt, Click.clicked_at <= end_dt)
            .scalar()
            or 0
        )

        # Calculate unique visitors (distinct visitor IPs within window)
        unique_visitors = (
            db.query(func.count(func.distinct(Click.ip_address)))
            .filter(Click.url_id == url_id, Click.clicked_at >= start_dt, Click.clicked_at <= end_dt)
            .scalar()
            or 0
        )
        kpis["unique_visitors"] = unique_visitors

        timeline, peak_date, peak_clicks, average_clicks_per_day = cls.get_timeline_data(
            db, url_id, start_dt, end_dt, period_label
        )

        devices = cls.get_breakdown(db, url_id, Click.device_type, start_dt, end_dt, total_in_period)
        browsers = cls.get_breakdown(db, url_id, Click.browser, start_dt, end_dt, total_in_period)
        operating_systems = cls.get_breakdown(db, url_id, Click.operating_system, start_dt, end_dt, total_in_period)
        referrals = cls.get_breakdown(db, url_id, Click.referrer, start_dt, end_dt, total_in_period, limit=10)
        countries = cls.get_breakdown(db, url_id, Click.country, start_dt, end_dt, total_in_period, limit=10)
        regions = cls.get_breakdown(db, url_id, Click.region, start_dt, end_dt, total_in_period, limit=10)
        cities = cls.get_breakdown(db, url_id, Click.city, start_dt, end_dt, total_in_period, limit=10)

        return {
            "url_id": url.id,
            "short_code": url.short_code,
            "title": url.title,
            "original_url": url.original_url,
            "is_active": url.is_active,
            "created_at": url.created_at,
            "period": period_label,
            "start_date": start_dt.isoformat(),
            "end_date": end_dt.isoformat(),
            "kpis": kpis,
            "total_clicks": kpis["total_clicks"],
            "total_in_period": total_in_period,
            "unique_visitors": unique_visitors,
            "peak_date": peak_date,
            "peak_clicks": peak_clicks,
            "average_clicks_per_day": average_clicks_per_day,
            "timeline": timeline,
            "devices": devices,
            "browsers": browsers,
            "operating_systems": operating_systems,
            "referrals": referrals,
            "countries": countries,
            "regions": regions,
            "cities": cities,
        }

    @classmethod
    def get_url_clicks(
        cls,
        db: Session,
        user_id: int,
        url_id: int,
        period: str = "30d",
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        page: int = 1,
        limit: int = 20,
    ) -> Dict[str, Any]:
        """Paginated click events and KPIs for GET /api/analytics/{url_id}/clicks."""
        url = cls.verify_url_ownership(db, user_id, url_id)
        start_dt, end_dt, period_label = cls.resolve_date_range(period, start_date, end_date)

        kpis = cls.get_kpi_stats(db, url_id)

        base_query = db.query(Click).filter(
            Click.url_id == url_id,
            Click.clicked_at >= start_dt,
            Click.clicked_at <= end_dt,
        )
        total_in_period = base_query.count()
        total_pages = max(1, math.ceil(total_in_period / limit))

        events_rows = (
            base_query.order_by(Click.clicked_at.desc())
            .offset((page - 1) * limit)
            .limit(limit)
            .all()
        )

        # Strictly exclude raw IP address
        events = [
            {
                "id": ev.id,
                "device_type": ev.device_type,
                "browser": ev.browser,
                "operating_system": ev.operating_system,
                "country": ev.country,
                "region": ev.region,
                "city": ev.city,
                "referrer": ev.referrer,
                "clicked_at": ev.clicked_at,
            }
            for ev in events_rows
        ]

        return {
            "url_id": url.id,
            "short_code": url.short_code,
            "period": period_label,
            "kpis": kpis,
            "total_in_period": total_in_period,
            "page": page,
            "limit": limit,
            "total_pages": total_pages,
            "events": events,
        }

    @classmethod
    def get_url_devices(
        cls,
        db: Session,
        user_id: int,
        url_id: int,
        period: str = "30d",
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Device, browser, and OS breakdowns for GET /api/analytics/{url_id}/devices."""
        url = cls.verify_url_ownership(db, user_id, url_id)
        start_dt, end_dt, period_label = cls.resolve_date_range(period, start_date, end_date)

        total_in_period = (
            db.query(func.count(Click.id))
            .filter(Click.url_id == url_id, Click.clicked_at >= start_dt, Click.clicked_at <= end_dt)
            .scalar()
            or 0
        )

        devices = cls.get_breakdown(db, url_id, Click.device_type, start_dt, end_dt, total_in_period)
        browsers = cls.get_breakdown(db, url_id, Click.browser, start_dt, end_dt, total_in_period)
        operating_systems = cls.get_breakdown(db, url_id, Click.operating_system, start_dt, end_dt, total_in_period)

        return {
            "url_id": url.id,
            "short_code": url.short_code,
            "period": period_label,
            "total_clicks": total_in_period,
            "devices": devices,
            "browsers": browsers,
            "operating_systems": operating_systems,
        }

    @classmethod
    def get_url_referrals(
        cls,
        db: Session,
        user_id: int,
        url_id: int,
        period: str = "30d",
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Referral source breakdown for GET /api/analytics/{url_id}/referrals."""
        url = cls.verify_url_ownership(db, user_id, url_id)
        start_dt, end_dt, period_label = cls.resolve_date_range(period, start_date, end_date)

        total_in_period = (
            db.query(func.count(Click.id))
            .filter(Click.url_id == url_id, Click.clicked_at >= start_dt, Click.clicked_at <= end_dt)
            .scalar()
            or 0
        )

        referrals = cls.get_breakdown(db, url_id, Click.referrer, start_dt, end_dt, total_in_period, limit=20)

        return {
            "url_id": url.id,
            "short_code": url.short_code,
            "period": period_label,
            "total_clicks": total_in_period,
            "referrals": referrals,
        }

    @classmethod
    def get_url_locations(
        cls,
        db: Session,
        user_id: int,
        url_id: int,
        period: str = "30d",
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Country, region/state, and city breakdown for GET /api/analytics/{url_id}/locations."""
        url = cls.verify_url_ownership(db, user_id, url_id)
        start_dt, end_dt, period_label = cls.resolve_date_range(period, start_date, end_date)

        total_in_period = (
            db.query(func.count(Click.id))
            .filter(Click.url_id == url_id, Click.clicked_at >= start_dt, Click.clicked_at <= end_dt)
            .scalar()
            or 0
        )

        countries = cls.get_breakdown(db, url_id, Click.country, start_dt, end_dt, total_in_period, limit=20)
        regions = cls.get_breakdown(db, url_id, Click.region, start_dt, end_dt, total_in_period, limit=20)
        cities = cls.get_breakdown(db, url_id, Click.city, start_dt, end_dt, total_in_period, limit=20)

        return {
            "url_id": url.id,
            "short_code": url.short_code,
            "period": period_label,
            "total_clicks": total_in_period,
            "countries": countries,
            "regions": regions,
            "cities": cities,
        }

    @classmethod
    def get_url_timeline(
        cls,
        db: Session,
        user_id: int,
        url_id: int,
        period: str = "30d",
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Timeline series and peak metrics for GET /api/analytics/{url_id}/timeline."""
        url = cls.verify_url_ownership(db, user_id, url_id)
        start_dt, end_dt, period_label = cls.resolve_date_range(period, start_date, end_date)

        timeline, peak_date, peak_clicks, avg_per_day = cls.get_timeline_data(
            db, url_id, start_dt, end_dt, period_label
        )
        total_in_period = (
            db.query(func.count(Click.id))
            .filter(Click.url_id == url_id, Click.clicked_at >= start_dt, Click.clicked_at <= end_dt)
            .scalar()
            or 0
        )

        return {
            "url_id": url.id,
            "short_code": url.short_code,
            "period": period_label,
            "interval": "hour" if period_label == "today" else "day",
            "total_clicks": total_in_period,
            "timeline": timeline,
            "peak_date": peak_date,
            "peak_clicks": peak_clicks,
            "average_clicks_per_day": avg_per_day,
        }

    # -------------------------------------------------------------------------
    # Backward Compatibility & Overview Methods
    # -------------------------------------------------------------------------

    @classmethod
    def get_url_analytics(
        cls,
        db: Session,
        user_id: int,
        url_id: int,
        days: int = 30,
    ) -> Dict[str, Any]:
        """Legacy compatibility method mapping to get_url_summary."""
        period = f"{days}d" if days in (7, 30) else "30d"
        return cls.get_url_summary(db, user_id, url_id, period=period)

    @classmethod
    def get_overview_analytics(
        cls,
        db: Session,
        user_id: int,
        days: int = 30,
    ) -> Dict[str, Any]:
        """Retrieves aggregated analytics across all short links owned by the authenticated user."""
        start_date = datetime.now(timezone.utc) - timedelta(days=days)

        # Base query joined with user's URLs
        base_query = (
            db.query(Click)
            .join(ShortURL, ShortURL.id == Click.url_id)
            .filter(ShortURL.user_id == user_id, Click.clicked_at >= start_date)
        )

        total_clicks = base_query.count()
        total_links = db.query(ShortURL).filter(ShortURL.user_id == user_id).count()
        active_links = db.query(ShortURL).filter(ShortURL.user_id == user_id, ShortURL.is_active == True).count()

        dialect_name = db.bind.dialect.name if db.bind else "postgresql"
        date_expr = (
            func.strftime("%Y-%m-%d", Click.clicked_at)
            if dialect_name == "sqlite"
            else func.to_char(Click.clicked_at, "YYYY-MM-DD")
        )

        time_series_query = (
            db.query(
                date_expr.label("date"),
                func.count(Click.id).label("count"),
            )
            .join(ShortURL, ShortURL.id == Click.url_id)
            .filter(ShortURL.user_id == user_id, Click.clicked_at >= start_date)
            .group_by("date")
            .order_by("date")
            .all()
        )
        clicks_over_time = [{"date": r.date, "clicks": r.count} for r in time_series_query]

        devices = cls._compute_breakdown(
            db.query(Click.device_type, func.count(Click.id))
            .join(ShortURL, ShortURL.id == Click.url_id)
            .filter(ShortURL.user_id == user_id, Click.clicked_at >= start_date)
            .group_by(Click.device_type)
            .order_by(desc(func.count(Click.id)))
            .all(),
            total_clicks,
        )

        countries = cls._compute_breakdown(
            db.query(Click.country, func.count(Click.id))
            .join(ShortURL, ShortURL.id == Click.url_id)
            .filter(ShortURL.user_id == user_id, Click.clicked_at >= start_date)
            .group_by(Click.country)
            .order_by(desc(func.count(Click.id)))
            .limit(10)
            .all(),
            total_clicks,
        )

        browsers = cls._compute_breakdown(
            db.query(Click.browser, func.count(Click.id))
            .join(ShortURL, ShortURL.id == Click.url_id)
            .filter(ShortURL.user_id == user_id, Click.clicked_at >= start_date)
            .group_by(Click.browser)
            .order_by(desc(func.count(Click.id)))
            .limit(10)
            .all(),
            total_clicks,
        )

        return {
            "total_links": total_links,
            "active_links": active_links,
            "total_clicks": total_clicks,
            "period_days": days,
            "clicks_over_time": clicks_over_time,
            "devices": devices,
            "countries": countries,
            "browsers": browsers,
        }

    @classmethod
    def get_recent_account_clicks(
        cls,
        db: Session,
        user_id: int,
        limit: int = 10,
    ) -> List[Dict[str, Any]]:
        """Fetches the latest click events across all short links owned by the user."""
        rows = (
            db.query(Click, ShortURL.short_code, ShortURL.title)
            .join(ShortURL, ShortURL.id == Click.url_id)
            .filter(ShortURL.user_id == user_id)
            .order_by(Click.clicked_at.desc())
            .limit(limit)
            .all()
        )

        return [
            {
                "id": click.id,
                "url_id": click.url_id,
                "short_code": short_code,
                "url_title": title or short_code,
                "device_type": click.device_type,
                "browser": click.browser,
                "operating_system": click.operating_system,
                "country": click.country,
                "region": click.region,
                "city": click.city,
                "referrer": click.referrer,
                "clicked_at": click.clicked_at,
            }
            for click, short_code, title in rows
        ]

    @classmethod
    def get_top_performing_links(
        cls,
        db: Session,
        user_id: int,
        limit: int = 5,
    ) -> List[Dict[str, Any]]:
        """Retrieves top converting links owned by the user ordered by click volume."""
        urls = (
            db.query(ShortURL)
            .filter(ShortURL.user_id == user_id)
            .order_by(desc(ShortURL.click_count), desc(ShortURL.created_at))
            .limit(limit)
            .all()
        )

        return [
            {
                "id": u.id,
                "short_code": u.short_code,
                "original_url": u.original_url,
                "title": u.title or u.short_code,
                "clicks": u.click_count or 0,
                "is_active": u.is_active,
                "created_at": u.created_at,
            }
            for u in urls
        ]

    # -------------------------------------------------------------------------
    # Advanced Filtering, Period Comparison & Export Engine
    # -------------------------------------------------------------------------

    @classmethod
    def get_filter_options(cls, db: Session, user_id: int) -> Dict[str, Any]:
        """Gathers available distinct filter options from historical telemetry for user."""
        distinct_devices = [
            r[0]
            for r in db.query(Click.device_type)
            .join(ShortURL, ShortURL.id == Click.url_id)
            .filter(ShortURL.user_id == user_id, Click.device_type.isnot(None), Click.device_type != "")
            .distinct()
            .order_by(Click.device_type)
            .all()
            if r[0]
        ]
        distinct_countries = [
            r[0]
            for r in db.query(Click.country)
            .join(ShortURL, ShortURL.id == Click.url_id)
            .filter(ShortURL.user_id == user_id, Click.country.isnot(None), Click.country != "")
            .distinct()
            .order_by(Click.country)
            .all()
            if r[0]
        ]
        distinct_regions = [
            r[0]
            for r in db.query(Click.region)
            .join(ShortURL, ShortURL.id == Click.url_id)
            .filter(ShortURL.user_id == user_id, Click.region.isnot(None), Click.region != "")
            .distinct()
            .order_by(Click.region)
            .all()
            if r[0]
        ]
        distinct_referrers = [
            r[0]
            for r in db.query(Click.referrer)
            .join(ShortURL, ShortURL.id == Click.url_id)
            .filter(ShortURL.user_id == user_id, Click.referrer.isnot(None), Click.referrer != "")
            .distinct()
            .order_by(Click.referrer)
            .all()
            if r[0]
        ]
        urls = [
            {
                "id": u.id,
                "short_code": u.short_code,
                "title": u.title or u.short_code,
                "original_url": u.original_url,
            }
            for u in db.query(ShortURL)
            .filter(ShortURL.user_id == user_id)
            .order_by(desc(ShortURL.click_count), desc(ShortURL.created_at))
            .all()
        ]
        return {
            "devices": distinct_devices,
            "countries": distinct_countries,
            "regions": distinct_regions,
            "referrers": distinct_referrers,
            "urls": urls,
        }

    @classmethod
    def get_filtered_analytics(
        cls,
        db: Session,
        user_id: int,
        period: str = "30d",
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        url_id: Optional[int] = None,
        device: Optional[str] = None,
        country: Optional[str] = None,
        region: Optional[str] = None,
        referrer: Optional[str] = None,
        compare: bool = True,
        page: int = 1,
        limit: int = 50,
    ) -> Dict[str, Any]:
        """Performs database-level multi-criteria analytics filtering and period comparison."""
        # 1. Resolve date boundaries
        start_dt, end_dt, period_label = cls.resolve_date_range(period, start_date, end_date)
        prev_start_dt, prev_end_dt, prev_period_label = cls.resolve_comparison_range(start_dt, end_dt, period_label)

        # 2. Verify URL ownership if url_id specified
        url_obj = None
        if url_id is not None:
            url_obj = cls.verify_url_ownership(db, user_id, url_id)

        # 3. Helper to apply criteria
        def apply_criteria(q):
            if url_id is not None:
                q = q.filter(Click.url_id == url_id)
            if device:
                q = q.filter(func.lower(Click.device_type) == device.lower().strip())
            if country:
                q = q.filter(func.lower(Click.country) == country.lower().strip())
            if region:
                q = q.filter(func.lower(Click.region) == region.lower().strip())
            if referrer:
                ref_clean = referrer.lower().strip()
                if ref_clean in ("direct", "direct / unknown", "unknown", "none"):
                    q = q.filter((Click.referrer.is_(None)) | (func.lower(Click.referrer) == "direct / unknown"))
                else:
                    q = q.filter(func.lower(Click.referrer).contains(ref_clean))
            return q

        # 4. Compute Current Period KPIs
        curr_kpi_query = apply_criteria(
            db.query(
                func.count(Click.id).label("total_clicks"),
                func.count(func.distinct(Click.ip_address)).label("unique_visitors"),
                func.count(case((func.lower(Click.device_type) == "mobile", Click.id), else_=None)).label("mobile_clicks"),
                func.count(
                    case(
                        (
                            Click.referrer.isnot(None)
                            & (func.lower(Click.referrer) != "direct / unknown")
                            & (Click.referrer != ""),
                            Click.id,
                        ),
                        else_=None,
                    )
                ).label("referral_clicks"),
            )
            .join(ShortURL, ShortURL.id == Click.url_id)
            .filter(ShortURL.user_id == user_id)
        ).filter(Click.clicked_at >= start_dt, Click.clicked_at <= end_dt)

        curr_row = curr_kpi_query.first()
        curr_clicks = curr_row.total_clicks if curr_row and curr_row.total_clicks else 0
        curr_visitors = curr_row.unique_visitors if curr_row and curr_row.unique_visitors else 0
        curr_mobile = curr_row.mobile_clicks if curr_row and curr_row.mobile_clicks else 0
        curr_referrals = curr_row.referral_clicks if curr_row and curr_row.referral_clicks else 0

        # 5. Compute Previous Period KPIs for Comparison
        comparison = None
        if compare:
            prev_kpi_query = apply_criteria(
                db.query(
                    func.count(Click.id).label("total_clicks"),
                    func.count(func.distinct(Click.ip_address)).label("unique_visitors"),
                    func.count(case((func.lower(Click.device_type) == "mobile", Click.id), else_=None)).label("mobile_clicks"),
                    func.count(
                        case(
                            (
                                Click.referrer.isnot(None)
                                & (func.lower(Click.referrer) != "direct / unknown")
                                & (Click.referrer != ""),
                                Click.id,
                            ),
                            else_=None,
                        )
                    ).label("referral_clicks"),
                )
                .join(ShortURL, ShortURL.id == Click.url_id)
                .filter(ShortURL.user_id == user_id)
            ).filter(Click.clicked_at >= prev_start_dt, Click.clicked_at < prev_end_dt)

            prev_row = prev_kpi_query.first()
            prev_clicks = prev_row.total_clicks if prev_row and prev_row.total_clicks else 0
            prev_visitors = prev_row.unique_visitors if prev_row and prev_row.unique_visitors else 0
            prev_mobile = prev_row.mobile_clicks if prev_row and prev_row.mobile_clicks else 0
            prev_referrals = prev_row.referral_clicks if prev_row and prev_row.referral_clicks else 0

            def calc_metric(curr_val: int, prev_val: int) -> Dict[str, Any]:
                if prev_val == 0:
                    pct = 100.0 if curr_val > 0 else 0.0
                    trend = "up" if curr_val > 0 else "neutral"
                else:
                    diff = curr_val - prev_val
                    pct = round((diff / prev_val) * 100, 1)
                    trend = "up" if diff > 0 else ("down" if diff < 0 else "neutral")
                return {
                    "current": curr_val,
                    "previous": prev_val,
                    "change_pct": pct,
                    "trend": trend,
                }

            comparison = {
                "current_period": period_label,
                "previous_period": prev_period_label,
                "clicks": calc_metric(curr_clicks, prev_clicks),
                "visitors": calc_metric(curr_visitors, prev_visitors),
                "mobile_traffic": calc_metric(curr_mobile, prev_mobile),
                "referral_traffic": calc_metric(curr_referrals, prev_referrals),
            }

        # 6. Timeline Series
        dialect_name = db.bind.dialect.name if db.bind else "postgresql"
        is_hourly = (period_label == "today")
        if dialect_name == "sqlite":
            date_expr = (
                func.strftime("%Y-%m-%d %H:00", Click.clicked_at)
                if is_hourly
                else func.strftime("%Y-%m-%d", Click.clicked_at)
            )
        else:
            date_expr = (
                func.to_char(Click.clicked_at, "YYYY-MM-DD HH24:00")
                if is_hourly
                else func.to_char(Click.clicked_at, "YYYY-MM-DD")
            )

        timeline_rows = (
            apply_criteria(
                db.query(date_expr.label("date_label"), func.count(Click.id).label("count"))
                .join(ShortURL, ShortURL.id == Click.url_id)
                .filter(ShortURL.user_id == user_id)
            )
            .filter(Click.clicked_at >= start_dt, Click.clicked_at <= end_dt)
            .group_by("date_label")
            .order_by("date_label")
            .all()
        )
        timeline = [{"date": r.date_label, "clicks": r.count} for r in timeline_rows]

        # 7. Category Breakdowns with Active Filters Applied
        def get_category_breakdown(column, limit_count=15):
            items = (
                apply_criteria(
                    db.query(column, func.count(Click.id).label("cnt"))
                    .join(ShortURL, ShortURL.id == Click.url_id)
                    .filter(ShortURL.user_id == user_id)
                )
                .filter(Click.clicked_at >= start_dt, Click.clicked_at <= end_dt)
                .group_by(column)
                .order_by(desc("cnt"))
                .limit(limit_count)
                .all()
            )
            return cls._compute_breakdown(items, curr_clicks)

        devices = get_category_breakdown(Click.device_type, 10)
        browsers = get_category_breakdown(Click.browser, 10)
        operating_systems = get_category_breakdown(Click.operating_system, 10)
        countries = get_category_breakdown(Click.country, 20)
        regions = get_category_breakdown(Click.region, 20)
        cities = get_category_breakdown(Click.city, 20)
        referrals = get_category_breakdown(Click.referrer, 20)

        # 8. Filtered Events Log (Privacy-safe)
        events_query = (
            apply_criteria(
                db.query(Click, ShortURL.short_code, ShortURL.title)
                .join(ShortURL, ShortURL.id == Click.url_id)
                .filter(ShortURL.user_id == user_id)
            )
            .filter(Click.clicked_at >= start_dt, Click.clicked_at <= end_dt)
            .order_by(Click.clicked_at.desc())
        )
        total_events = events_query.count()
        event_rows = events_query.offset((page - 1) * limit).limit(limit).all()

        events = [
            {
                "id": click.id,
                "url_id": click.url_id,
                "short_code": short_code,
                "url_title": title or short_code,
                "device_type": click.device_type,
                "browser": click.browser,
                "operating_system": click.operating_system,
                "country": click.country,
                "region": click.region,
                "city": click.city,
                "referrer": click.referrer,
                "clicked_at": click.clicked_at,
            }
            for click, short_code, title in event_rows
        ]

        # 9. Distinct filter options
        filter_options = cls.get_filter_options(db, user_id)

        return {
            "applied_filters": {
                "period": period_label,
                "start_date": start_date or start_dt.strftime("%Y-%m-%d"),
                "end_date": end_date or end_dt.strftime("%Y-%m-%d"),
                "url_id": url_id,
                "url_code": url_obj.short_code if url_obj else None,
                "url_title": url_obj.title if url_obj else None,
                "device": device,
                "country": country,
                "region": region,
                "referrer": referrer,
                "compare": compare,
            },
            "kpis": {
                "total_clicks": curr_clicks,
                "unique_visitors": curr_visitors,
                "mobile_clicks": curr_mobile,
                "referral_clicks": curr_referrals,
                "mobile_share_pct": round((curr_mobile / curr_clicks) * 100, 1) if curr_clicks > 0 else 0.0,
                "referral_share_pct": round((curr_referrals / curr_clicks) * 100, 1) if curr_clicks > 0 else 0.0,
            },
            "comparison": comparison,
            "timeline": timeline,
            "devices": devices,
            "browsers": browsers,
            "operating_systems": operating_systems,
            "referrals": referrals,
            "countries": countries,
            "regions": regions,
            "cities": cities,
            "events": events,
            "total_events": total_events,
            "filter_options": filter_options,
        }

    @classmethod
    def export_filtered_analytics(
        cls,
        db: Session,
        user_id: int,
        period: str = "30d",
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        url_id: Optional[int] = None,
        device: Optional[str] = None,
        country: Optional[str] = None,
        region: Optional[str] = None,
        referrer: Optional[str] = None,
        export_format: str = "csv",
    ) -> Any:
        """Exports the matching filtered telemetry dataset as CSV string or JSON list."""
        start_dt, end_dt, _ = cls.resolve_date_range(period, start_date, end_date)

        def apply_criteria(q):
            if url_id is not None:
                q = q.filter(Click.url_id == url_id)
            if device:
                q = q.filter(func.lower(Click.device_type) == device.lower().strip())
            if country:
                q = q.filter(func.lower(Click.country) == country.lower().strip())
            if region:
                q = q.filter(func.lower(Click.region) == region.lower().strip())
            if referrer:
                ref_clean = referrer.lower().strip()
                if ref_clean in ("direct", "direct / unknown", "unknown", "none"):
                    q = q.filter((Click.referrer.is_(None)) | (func.lower(Click.referrer) == "direct / unknown"))
                else:
                    q = q.filter(func.lower(Click.referrer).contains(ref_clean))
            return q

        rows = (
            apply_criteria(
                db.query(Click, ShortURL.short_code, ShortURL.title, ShortURL.original_url)
                .join(ShortURL, ShortURL.id == Click.url_id)
                .filter(ShortURL.user_id == user_id)
            )
            .filter(Click.clicked_at >= start_dt, Click.clicked_at <= end_dt)
            .order_by(Click.clicked_at.desc())
            .all()
        )

        if export_format.lower() == "json":
            return [
                {
                    "clicked_at": click.clicked_at.isoformat() if click.clicked_at else None,
                    "short_code": short_code,
                    "title": title or short_code,
                    "original_url": original_url,
                    "device_type": click.device_type,
                    "browser": click.browser,
                    "operating_system": click.operating_system,
                    "country": click.country,
                    "region": click.region,
                    "city": click.city,
                    "referrer": click.referrer,
                }
                for click, short_code, title, original_url in rows
            ]

        # Default CSV export
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow([
            "Clicked At (UTC)",
            "Short Code",
            "Link Title",
            "Original URL",
            "Device Type",
            "Browser",
            "Operating System",
            "Country",
            "Region",
            "City",
            "Referral Source",
        ])
        for click, short_code, title, original_url in rows:
            writer.writerow([
                click.clicked_at.strftime("%Y-%m-%d %H:%M:%S") if click.clicked_at else "",
                short_code,
                title or short_code,
                original_url,
                click.device_type or "Unknown",
                click.browser or "Unknown",
                click.operating_system or "Unknown",
                click.country or "Unknown",
                click.region or "Unknown",
                click.city or "Unknown",
                click.referrer or "Direct / Unknown",
            ])
        return output.getvalue()


