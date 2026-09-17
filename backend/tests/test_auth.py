"""Tests for LinkPulse authentication, registration, login, and JWT validation."""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.user import User
from app.core.security import create_access_token
from datetime import timedelta


class TestRegistration:
    """Suite testing user registration endpoints and constraints."""

    def test_register_success(self, client: TestClient):
        payload = {
            "name": "Jane Doe",
            "email": "jane@example.com",
            "password": "Password123!",
        }
        response = client.post("/api/auth/register", json=payload)
        assert response.status_code == 201
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert data["user"]["email"] == "jane@example.com"
        assert data["user"]["name"] == "Jane Doe"
        assert "password" not in data["user"]
        assert "password_hash" not in data["user"]

    def test_register_duplicate_email_fails(self, client: TestClient, test_user: User):
        payload = {
            "name": "Duplicate User",
            "email": test_user.email,
            "password": "Password123!",
        }
        response = client.post("/api/auth/register", json=payload)
        assert response.status_code in [400, 409]
        assert "already registered" in response.json()["detail"].lower() or "already exists" in response.json()["detail"].lower()

    def test_register_weak_password_rejected(self, client: TestClient):
        # Passwords must be at least 8 characters
        payload = {
            "name": "Weak Pass User",
            "email": "weak@example.com",
            "password": "short",
        }
        response = client.post("/api/auth/register", json=payload)
        assert response.status_code == 422

    def test_register_invalid_email_rejected(self, client: TestClient):
        payload = {
            "name": "Invalid Email",
            "email": "not-an-email",
            "password": "Password123!",
        }
        response = client.post("/api/auth/register", json=payload)
        assert response.status_code == 422


class TestLogin:
    """Suite testing user login credentials and tokens."""

    def test_login_success(self, client: TestClient, test_user: User):
        payload = {
            "email": test_user.email,
            "password": "Password123!",
        }
        response = client.post("/api/auth/login", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert data["user"]["id"] == test_user.id
        assert data["user"]["email"] == test_user.email

    def test_login_wrong_password_fails(self, client: TestClient, test_user: User):
        payload = {
            "email": test_user.email,
            "password": "IncorrectPassword999!",
        }
        response = client.post("/api/auth/login", json=payload)
        assert response.status_code == 401
        assert "invalid" in response.json()["detail"].lower()

    def test_login_nonexistent_user_fails(self, client: TestClient):
        payload = {
            "email": "ghost@linkpulse.io",
            "password": "Password123!",
        }
        response = client.post("/api/auth/login", json=payload)
        assert response.status_code == 401


class TestAuthentication:
    """Suite testing JWT validation and protected route access."""

    def test_get_current_user_profile_success(self, client: TestClient, auth_headers: dict, test_user: User):
        response = client.get("/api/auth/me", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == test_user.id
        assert data["email"] == test_user.email
        assert data["name"] == test_user.name

    def test_missing_auth_header_fails(self, client: TestClient):
        response = client.get("/api/auth/me")
        assert response.status_code == 401

    def test_malformed_auth_header_fails(self, client: TestClient):
        response = client.get("/api/auth/me", headers={"Authorization": "NotBearer someToken"})
        assert response.status_code == 401

    def test_expired_token_fails(self, client: TestClient, test_user: User):
        # Create token already expired 1 hour ago
        expired_token = create_access_token(
            subject=str(test_user.id),
            expires_delta=timedelta(hours=-1),
        )
        response = client.get("/api/auth/me", headers={"Authorization": f"Bearer {expired_token}"})
        assert response.status_code == 401
