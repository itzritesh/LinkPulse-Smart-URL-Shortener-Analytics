"""Tests for multi-tenant isolation and authorization boundaries in LinkPulse."""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.url import ShortURL
from app.models.user import User


class TestMultiTenantAuthorization:
    """Ensures strict access control: User A cannot read, modify, or delete User B's resources."""

    @pytest.fixture
    def user_b_url(self, db_session: Session, other_user: User) -> ShortURL:
        url = ShortURL(
            user_id=other_user.id,
            original_url="https://private-dashboard.tenant-b.com",
            short_code="tenant-b-link",
            title="Tenant B Confidential",
            is_active=True,
            click_count=5,
        )
        db_session.add(url)
        db_session.commit()
        db_session.refresh(url)
        return url

    def test_user_a_cannot_see_user_b_in_url_list(
        self, client: TestClient, auth_headers: dict, user_b_url: ShortURL
    ):
        response = client.get("/api/urls", headers=auth_headers)
        assert response.status_code == 200
        urls = response.json()
        # User A's list must not contain User B's URL ID or code
        assert not any(u["id"] == user_b_url.id for u in urls)
        assert not any(u["short_code"] == user_b_url.short_code for u in urls)

    def test_user_a_cannot_get_user_b_url_detail(
        self, client: TestClient, auth_headers: dict, user_b_url: ShortURL
    ):
        response = client.get(f"/api/urls/{user_b_url.id}", headers=auth_headers)
        assert response.status_code in [403, 404]

    def test_user_a_cannot_modify_user_b_url_status(
        self, client: TestClient, auth_headers: dict, user_b_url: ShortURL
    ):
        response = client.patch(
            f"/api/urls/{user_b_url.id}/status",
            json={"is_active": False},
            headers=auth_headers,
        )
        assert response.status_code in [403, 404]

    def test_user_a_cannot_delete_user_b_url(
        self, client: TestClient, auth_headers: dict, user_b_url: ShortURL
    ):
        response = client.delete(f"/api/urls/{user_b_url.id}", headers=auth_headers)
        assert response.status_code in [403, 404]

    def test_user_a_cannot_access_user_b_analytics(
        self, client: TestClient, auth_headers: dict, user_b_url: ShortURL
    ):
        # Comprehensive analytics
        res1 = client.get(f"/api/analytics/{user_b_url.id}", headers=auth_headers)
        assert res1.status_code in [403, 404]

        # Click event log
        res2 = client.get(f"/api/analytics/{user_b_url.id}/clicks", headers=auth_headers)
        assert res2.status_code in [403, 404]

        # Device analytics
        res3 = client.get(f"/api/v1/analytics/{user_b_url.id}/devices", headers=auth_headers)
        assert res3.status_code in [403, 404]
