"""Tests for edge cases, rate limiting, SQL injection defense, and Redis cache failover."""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.url import ShortURL
from app.models.user import User
from app.services.cache_service import CacheService
from app.core.rate_limit import RateLimiter


class TestRateLimiting:
    """Suite testing rate limit thresholds and 429 status codes."""

    def test_auth_rate_limit_exceeded_triggers_429(self, client: TestClient):
        # Default auth limiter has request_limit=10 per 60s
        for _ in range(10):
            res = client.post("/api/auth/login", json={"email": "ratelimit@example.com", "password": "pass"})
            assert res.status_code in [401, 422]

        # 11th request should be blocked by rate limiter
        blocked_res = client.post("/api/auth/login", json={"email": "ratelimit@example.com", "password": "pass"})
        assert blocked_res.status_code == 429
        assert "Retry-After" in blocked_res.headers
        assert "rate limit exceeded" in blocked_res.json()["detail"].lower()


class TestSecurityPayloadsAndValidation:
    """Suite testing malicious input handling, SQL injection, and XSS payloads."""

    def test_sql_injection_in_search_query_safe(self, client: TestClient, auth_headers: dict):
        # Attempt standard SQL injection payload
        sqli_query = "'; DROP TABLE urls; --"
        response = client.get(f"/api/urls?search={sqli_query}", headers=auth_headers)
        assert response.status_code == 200
        # Table must still exist and return empty list
        assert isinstance(response.json(), list)

    def test_xss_in_title_stored_safely(self, client: TestClient, auth_headers: dict):
        xss_title = "<script>alert('pwned')</script>"
        payload = {
            "original_url": "https://example.com/safe",
            "title": xss_title,
        }
        response = client.post("/api/urls", json=payload, headers=auth_headers)
        assert response.status_code == 201
        data = response.json()
        assert data["title"] == xss_title

    def test_malformed_json_body_returns_422(self, client: TestClient, auth_headers: dict):
        response = client.post(
            "/api/urls",
            content="not a json string",
            headers={**auth_headers, "Content-Type": "application/json"},
        )
        assert response.status_code in [400, 422]


class TestCacheGracefulFallback:
    """Suite testing Redis failover when Redis is unavailable."""

    def test_cache_fallback_to_database(self, client: TestClient, db_session: Session, test_user: User):
        # Create a URL in DB
        short_url = ShortURL(
            user_id=test_user.id,
            original_url="https://kubernetes.io",
            short_code="k8sdocs",
            is_active=True,
        )
        db_session.add(short_url)
        db_session.commit()

        # Explicitly ensure Redis is marked unavailable
        CacheService._redis_available = False
        CacheService._memory_cache.clear()

        # The redirect should transparently query PostgreSQL and succeed with 307
        response = client.get("/k8sdocs", follow_redirects=False)
        assert response.status_code == 307
        assert response.headers["location"] == "https://kubernetes.io"
