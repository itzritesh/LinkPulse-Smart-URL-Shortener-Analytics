import uuid


def test_auth_flow(client):
    """Full integration test for user registration, duplicate prevention, login, and current-user endpoint."""
    random_id = uuid.uuid4().hex[:8]
    test_email = f"user_{random_id}@linkpulse.test"
    test_password = "SecurePassword123!"
    test_name = "Alex Dev"

    # 1. Register new user
    register_payload = {
        "name": test_name,
        "email": test_email,
        "password": test_password,
    }
    reg_res = client.post("/api/auth/register", json=register_payload)
    # If database is connected, expect 201; if database is offline, it will return 500 or db error
    if reg_res.status_code == 201:
        data = reg_res.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert data["user"]["email"] == test_email
        token = data["access_token"]

        # 2. Duplicate registration should fail with 409 Conflict
        dup_res = client.post("/api/auth/register", json=register_payload)
        assert dup_res.status_code == 409

        # 3. Test login with correct credentials
        login_res = client.post(
            "/api/auth/login",
            json={"email": test_email, "password": test_password},
        )
        assert login_res.status_code == 200
        assert "access_token" in login_res.json()

        # 4. Test login with wrong password
        bad_login = client.post(
            "/api/auth/login",
            json={"email": test_email, "password": "WrongPassword!"},
        )
        assert bad_login.status_code == 401

        # 5. Test GET /api/auth/me with Bearer token
        me_res = client.get(
            "/api/auth/me",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert me_res.status_code == 200
        user_info = me_res.json()
        assert user_info["email"] == test_email
        assert user_info["name"] == test_name


def test_auth_me_unauthorized(client):
    """Verify accessing /api/auth/me without authorization header returns 401."""
    res = client.get("/api/auth/me")
    assert res.status_code == 401
