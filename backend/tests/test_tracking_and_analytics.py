"""Tests for LinkPulse click tracking engine, device/browser detection, geo parsing, and analytics aggregation."""
import pytest
from datetime import datetime, timezone, timedelta
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.url import ShortURL
from app.models.analytics import Click
from app.models.user import User
from app.services.user_agent_service import UserAgentService
from app.services.geo_service import GeoService
from app.services.analytics_service import AnalyticsService


class TestDeviceAndUserAgentDetection:
    """Suite testing granular client environment detection."""

    def test_detect_mobile_device(self):
        iphone_ua = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1"
        parsed = UserAgentService.parse(iphone_ua)
        assert parsed["device_type"] == "Mobile"
        assert parsed["operating_system"] == "iOS"
        assert parsed["browser"] == "Safari"

    def test_detect_tablet_device(self):
        ipad_ua = "Mozilla/5.0 (iPad; CPU OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1"
        parsed = UserAgentService.parse(ipad_ua)
        assert parsed["device_type"] == "Tablet"
        assert parsed["operating_system"] == "iOS"

    def test_detect_desktop_device(self):
        windows_ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
        parsed = UserAgentService.parse(windows_ua)
        assert parsed["device_type"] == "Desktop"
        assert parsed["operating_system"] == "Windows"
        assert parsed["browser"] == "Chrome"

    def test_detect_bot(self):
        bot_ua = "Googlebot/2.1 (+http://www.google.com/bot.html)"
        parsed = UserAgentService.parse(bot_ua)
        assert parsed["device_type"] == "Bot"
        assert parsed["browser"] == "Bot/Crawler"


class TestGeographicDataService:
    """Suite testing privacy-preserving coarse location resolution."""

    def test_geo_from_cdn_edge_headers(self):
        headers = {
            "cf-ipcountry": "US",
            "cf-region": "California",
            "cf-ipcity": "San Francisco",
        }
        loc = GeoService.lookup_approximate_location("203.0.113.195", headers=headers)
        assert loc["country"] == "United States"
        assert loc["region"] == "California"
        assert loc["city"] == "San Francisco"

    def test_geo_private_loopback_ip(self):
        loc = GeoService.lookup_approximate_location("127.0.0.1")
        assert loc["country"] == "Local / Development"
        assert loc["city"] == "Localhost"


class TestClickTrackingAndAggregation:
    """Suite testing click persistence, privacy protection, and aggregated queries."""

    def test_click_tracking_persistence_and_privacy(
        self, client: TestClient, db_session: Session, test_user: User, auth_headers: dict
    ):
        # 1. Create short URL
        short_url = ShortURL(
            user_id=test_user.id,
            original_url="https://github.com/fastapi/fastapi",
            short_code="fastapi-repo",
            is_active=True,
            click_count=0,
        )
        db_session.add(short_url)
        db_session.commit()
        db_session.refresh(short_url)

        # 2. Record simulated clicks
        iphone_ua = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1"
        headers = {
            "cf-ipcountry": "US",
            "cf-region": "New York",
            "cf-ipcity": "New York City",
        }
        AnalyticsService.record_click(
            url_id=short_url.id,
            ip_address="198.51.100.42",
            user_agent=iphone_ua,
            referrer="https://twitter.com/t.co",
            headers=headers,
            db=db_session,
        )

        db_session.refresh(short_url)
        assert short_url.click_count == 1

        # 3. Query click list API endpoint and verify PRIVACY: raw IP MUST NOT be returned
        response = client.get(f"/api/analytics/{short_url.id}/clicks", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data["events"]) == 1
        event = data["events"][0]
        assert event["country"] == "United States"
        assert event["city"] == "New York City"
        assert event["device_type"] == "Mobile"
        assert event["browser"] == "Safari"
        assert "ip_address" not in event, "Raw IP address must never be exposed in public/analytics API"

    def test_analytics_breakdowns(
        self, client: TestClient, db_session: Session, test_user: User, auth_headers: dict
    ):
        short_url = ShortURL(
            user_id=test_user.id,
            original_url="https://news.ycombinator.com",
            short_code="hn-analytics",
            is_active=True,
            click_count=2,
        )
        db_session.add(short_url)
        db_session.commit()

        # Add 2 clicks
        click1 = Click(
            url_id=short_url.id,
            country="United States",
            region="California",
            city="San Francisco",
            device_type="Desktop",
            browser="Chrome",
            operating_system="macOS",
            referrer="https://google.com",
        )
        click2 = Click(
            url_id=short_url.id,
            country="Germany",
            region="Bavaria",
            city="Munich",
            device_type="Mobile",
            browser="Safari",
            operating_system="iOS",
            referrer="https://linkedin.com",
        )
        db_session.add_all([click1, click2])
        db_session.commit()

        # Test Device breakdown endpoint
        res_dev = client.get(f"/api/analytics/{short_url.id}/devices", headers=auth_headers)
        assert res_dev.status_code == 200
        dev_data = res_dev.json()
        assert any(d["name"] == "Desktop" for d in dev_data["devices"])
        assert any(d["name"] == "Mobile" for d in dev_data["devices"])

        # Test Location breakdown endpoint
        res_loc = client.get(f"/api/analytics/{short_url.id}/locations", headers=auth_headers)
        assert res_loc.status_code == 200
        loc_data = res_loc.json()
        assert any(c["name"] == "United States" for c in loc_data["countries"])
        assert any(c["name"] == "Germany" for c in loc_data["countries"])

        # Test Comprehensive analytics endpoint
        res_all = client.get(f"/api/analytics/{short_url.id}?period=30d", headers=auth_headers)
        assert res_all.status_code == 200
        all_data = res_all.json()
        assert all_data["total_clicks"] >= 2
        assert len(all_data["devices"]) > 0

    def test_overview_analytics(
        self, client: TestClient, db_session: Session, test_user: User, auth_headers: dict
    ):
        res = client.get("/api/analytics/overview", headers=auth_headers)
        assert res.status_code == 200
        data = res.json()
        assert "total_links" in data
        assert "total_clicks" in data
        assert "active_links" in data
