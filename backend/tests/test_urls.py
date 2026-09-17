"""Tests for LinkPulse URL shortener operations, validation, SSRF defense, and lifecycle."""
import pytest
from datetime import datetime, timezone, timedelta
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.url import ShortURL
from app.models.user import User


class TestUrlCreation:
    """Suite testing URL creation and alias logic."""

    def test_create_url_success(self, client: TestClient, auth_headers: dict):
        payload = {
            "original_url": "https://stripe.com/docs/api",
            "title": "Stripe API Documentation",
        }
        response = client.post("/api/urls", json=payload, headers=auth_headers)
        assert response.status_code == 201
        data = response.json()
        assert data["original_url"] == "https://stripe.com/docs/api"
        assert data["title"] == "Stripe API Documentation"
        assert len(data["short_code"]) > 0
        assert data["is_active"] is True
        assert data["click_count"] == 0
        assert data["is_expired"] is False

    def test_create_url_with_custom_code(self, client: TestClient, auth_headers: dict):
        payload = {
            "original_url": "https://news.ycombinator.com",
            "custom_code": "hn-frontpage",
            "title": "Hacker News",
        }
        response = client.post("/api/urls", json=payload, headers=auth_headers)
        assert response.status_code == 201
        data = response.json()
        assert data["short_code"] == "hn-frontpage"

    def test_create_url_with_expiration(self, client: TestClient, auth_headers: dict):
        future_date = (datetime.now(timezone.utc) + timedelta(days=7)).isoformat()
        payload = {
            "original_url": "https://github.com",
            "expires_at": future_date,
        }
        response = client.post("/api/urls", json=payload, headers=auth_headers)
        assert response.status_code == 201
        data = response.json()
        assert data["expires_at"] is not None
        assert data["is_expired"] is False


class TestUrlValidationAndSecurity:
    """Suite testing security hardening, protocol validation, and SSRF prevention."""

    @pytest.mark.parametrize("unsafe_url", [
        "javascript:alert('XSS')",
        "data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==",
        "file:///etc/passwd",
        "vbscript:msgbox(1)",
    ])
    def test_reject_unsafe_protocols(self, client: TestClient, auth_headers: dict, unsafe_url: str):
        payload = {"original_url": unsafe_url}
        response = client.post("/api/urls", json=payload, headers=auth_headers)
        assert response.status_code in [400, 422]

    @pytest.mark.parametrize("ssrf_target", [
        "http://127.0.0.1/secret",
        "http://localhost:8000/internal",
        "http://169.254.169.254/latest/meta-data",
        "http://0.0.0.0:80/admin",
    ])
    def test_reject_private_internal_ssrf(self, client: TestClient, auth_headers: dict, ssrf_target: str):
        payload = {"original_url": ssrf_target}
        response = client.post("/api/urls", json=payload, headers=auth_headers)
        assert response.status_code in [400, 422]
        detail = str(response.json()["detail"]).lower()
        assert any(word in detail for word in ["internal", "private", "invalid", "loopback", "not permitted"])

    def test_reject_malformed_url(self, client: TestClient, auth_headers: dict):
        payload = {"original_url": "not-a-valid-web-address"}
        response = client.post("/api/urls", json=payload, headers=auth_headers)
        assert response.status_code in [400, 422]


class TestShortCodeUniqueness:
    """Suite testing unique slug constraints."""

    def test_duplicate_custom_code_returns_409(self, client: TestClient, auth_headers: dict):
        payload1 = {
            "original_url": "https://example.com/one",
            "custom_code": "unique-slug-test",
        }
        res1 = client.post("/api/urls", json=payload1, headers=auth_headers)
        assert res1.status_code == 201

        # Attempt to create identical custom code
        payload2 = {
            "original_url": "https://example.com/two",
            "custom_code": "unique-slug-test",
        }
        res2 = client.post("/api/urls", json=payload2, headers=auth_headers)
        assert res2.status_code == 409
        detail = str(res2.json()["detail"]).lower()
        assert any(word in detail for word in ["already taken", "conflict", "already in use"])


class TestUrlManagementLifecycle:
    """Suite testing URL listing, search, status toggling, and deletion."""

    def test_list_and_search_urls(self, client: TestClient, auth_headers: dict):
        client.post("/api/urls", json={"original_url": "https://apple.com", "title": "Apple Website"}, headers=auth_headers)
        client.post("/api/urls", json={"original_url": "https://google.com", "title": "Google Search"}, headers=auth_headers)

        # List all
        res = client.get("/api/urls", headers=auth_headers)
        assert res.status_code == 200
        urls = res.json()
        assert len(urls) >= 2

        # Search by keyword
        res_search = client.get("/api/urls?search=Apple", headers=auth_headers)
        assert res_search.status_code == 200
        search_results = res_search.json()
        assert len(search_results) == 1
        assert "Apple" in search_results[0]["title"]

    def test_toggle_url_status(self, client: TestClient, auth_headers: dict):
        create_res = client.post("/api/urls", json={"original_url": "https://react.dev"}, headers=auth_headers)
        url_id = create_res.json()["id"]

        # Pause link
        patch_res = client.patch(f"/api/urls/{url_id}/status", json={"is_active": False}, headers=auth_headers)
        assert patch_res.status_code == 200
        assert patch_res.json()["is_active"] is False

        # Reactivate link
        reactivate_res = client.patch(f"/api/urls/{url_id}/status", json={"is_active": True}, headers=auth_headers)
        assert reactivate_res.status_code == 200
        assert reactivate_res.json()["is_active"] is True

    def test_delete_url(self, client: TestClient, auth_headers: dict):
        create_res = client.post("/api/urls", json={"original_url": "https://fastapi.tiangolo.com"}, headers=auth_headers)
        url_id = create_res.json()["id"]

        del_res = client.delete(f"/api/urls/{url_id}", headers=auth_headers)
        assert del_res.status_code == 204

        # Verify not found after delete
        get_res = client.get(f"/api/urls/{url_id}", headers=auth_headers)
        assert get_res.status_code == 404
