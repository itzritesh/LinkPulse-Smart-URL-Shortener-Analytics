"""Tests for LinkPulse short URL redirection engine, status checks, and error responses."""
import pytest
from datetime import datetime, timezone, timedelta
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.url import ShortURL
from app.models.user import User
from app.services.cache_service import CacheService


class TestRedirectEngine:
    """Suite testing public HTTP 307 redirection behavior and headers."""

    def test_redirect_active_url_success(self, client: TestClient, db_session: Session, test_user: User):
        # Create an active link
        short_url = ShortURL(
            user_id=test_user.id,
            original_url="https://docs.python.org/3/",
            short_code="py3docs",
            is_active=True,
        )
        db_session.add(short_url)
        db_session.commit()

        # Request redirect without following redirects
        response = client.get("/py3docs", follow_redirects=False)
        assert response.status_code == 307
        assert response.headers["location"] == "https://docs.python.org/3/"
        assert "no-cache" in response.headers.get("cache-control", "").lower()

    def test_redirect_invalid_code_returns_404(self, client: TestClient):
        response = client.get("/nonexistent-slug-xyz", headers={"Accept": "application/json"})
        assert response.status_code == 404
        data = response.json()
        assert data["error"] == "not_found"

    def test_redirect_reserved_code_returns_404(self, client: TestClient):
        response = client.get("/favicon.ico")
        assert response.status_code == 404

    def test_redirect_paused_url_returns_410(self, client: TestClient, db_session: Session, test_user: User):
        short_url = ShortURL(
            user_id=test_user.id,
            original_url="https://example.com/paused",
            short_code="pausedlink",
            is_active=False,
        )
        db_session.add(short_url)
        db_session.commit()

        response = client.get("/pausedlink", headers={"Accept": "application/json"})
        assert response.status_code == 410
        data = response.json()
        assert data["error"] == "link_inactive"

    def test_redirect_expired_url_returns_410(self, client: TestClient, db_session: Session, test_user: User):
        past_date = datetime.now(timezone.utc) - timedelta(days=2)
        short_url = ShortURL(
            user_id=test_user.id,
            original_url="https://example.com/expired",
            short_code="expiredlink",
            expires_at=past_date,
            is_active=True,
        )
        db_session.add(short_url)
        db_session.commit()

        response = client.get("/expiredlink", headers={"Accept": "application/json"})
        assert response.status_code == 410
        data = response.json()
        assert data["error"] == "link_expired"

    def test_redirect_alias_route_works(self, client: TestClient, db_session: Session, test_user: User):
        short_url = ShortURL(
            user_id=test_user.id,
            original_url="https://linear.app",
            short_code="linearapp",
            is_active=True,
        )
        db_session.add(short_url)
        db_session.commit()

        response = client.get("/r/linearapp", follow_redirects=False)
        assert response.status_code == 307
        assert response.headers["location"] == "https://linear.app"
