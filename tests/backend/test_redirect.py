import uuid
from datetime import datetime, timezone, timedelta


def register_user(client, prefix="redir_user"):
    """Helper to register an authenticated test user."""
    uid = uuid.uuid4().hex[:8]
    email = f"{prefix}_{uid}@linkpulse.test"
    password = "SecurePassword123!"
    res = client.post(
        "/api/auth/register",
        json={"name": f"User {prefix}", "email": email, "password": password},
    )
    if res.status_code != 201:
        login_res = client.post("/api/auth/login", json={"email": email, "password": password})
        return login_res.json()["access_token"], login_res.json()["user"]
    return res.json()["access_token"], res.json()["user"]


def test_public_redirect_success(client):
    """Verifies that GET /{short_code} resolves and returns HTTP 307 temporary redirect."""
    token, _ = register_user(client, "valid")
    headers = {"Authorization": f"Bearer {token}"}

    # Create short link
    dest_url = "https://news.ycombinator.com/item?id=123456"
    res = client.post(
        "/api/urls",
        json={"original_url": dest_url, "title": "Hacker News Post"},
        headers=headers,
    )
    assert res.status_code == 201
    url_data = res.json()
    short_code = url_data["short_code"]
    url_id = url_data["id"]

    # Visitor opens GET /{short_code}
    redirect_res = client.get(
        f"/{short_code}",
        headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"},
        follow_redirects=False,
    )
    assert redirect_res.status_code == 307
    assert redirect_res.headers["location"] == dest_url

    # Check that click_count was incremented
    detail_res = client.get(f"/api/urls/{url_id}", headers=headers)
    assert detail_res.status_code == 200
    assert detail_res.json()["click_count"] >= 1


def test_public_redirect_backward_compatibility_alias(client):
    """Verifies that GET /r/{short_code} continues to work seamlessly as an alias."""
    token, _ = register_user(client, "alias")
    headers = {"Authorization": f"Bearer {token}"}

    dest_url = "https://fastapi.tiangolo.com/"
    res = client.post(
        "/api/urls",
        json={"original_url": dest_url, "title": "FastAPI Docs"},
        headers=headers,
    )
    assert res.status_code == 201
    short_code = res.json()["short_code"]

    alias_res = client.get(f"/r/{short_code}", follow_redirects=False)
    assert alias_res.status_code == 307
    assert alias_res.headers["location"] == dest_url


def test_public_redirect_unknown_code_404(client):
    """Verifies unknown short code returns 404 with JSON or branded HTML."""
    fake_code = "nonExistent999"

    # API / JSON request
    json_res = client.get(f"/{fake_code}", headers={"Accept": "application/json"}, follow_redirects=False)
    assert json_res.status_code == 404
    data = json_res.json()
    assert data["error"] == "not_found"

    # Browser HTML request
    html_res = client.get(f"/{fake_code}", headers={"Accept": "text/html,application/xhtml+xml"}, follow_redirects=False)
    assert html_res.status_code == 404
    assert "text/html" in html_res.headers["content-type"]
    assert "Link Not Found" in html_res.text
    assert "LinkPulse" in html_res.text


def test_public_redirect_inactive_code_410(client):
    """Verifies disabled/paused short link returns 410 with appropriate response."""
    token, _ = register_user(client, "inactive")
    headers = {"Authorization": f"Bearer {token}"}

    # Create link
    res = client.post(
        "/api/urls",
        json={"original_url": "https://github.com", "title": "GitHub"},
        headers=headers,
    )
    assert res.status_code == 201
    url_id = res.json()["id"]
    short_code = res.json()["short_code"]

    # Pause the link
    patch_res = client.patch(f"/api/urls/{url_id}/status", json={"is_active": False}, headers=headers)
    assert patch_res.status_code == 200
    assert patch_res.json()["is_active"] is False

    # Visitor opens inactive link (JSON)
    json_res = client.get(f"/{short_code}", headers={"Accept": "application/json"}, follow_redirects=False)
    assert json_res.status_code == 410
    data = json_res.json()
    assert data["error"] == "link_inactive"

    # Visitor opens inactive link (Browser)
    html_res = client.get(f"/{short_code}", headers={"Accept": "text/html"}, follow_redirects=False)
    assert html_res.status_code == 410
    assert "text/html" in html_res.headers["content-type"]
    assert "Link Deactivated" in html_res.text or "Link Inactive" in html_res.text


def test_public_redirect_expired_code_410(client):
    """Verifies expired short link returns 410."""
    token, _ = register_user(client, "expired")
    headers = {"Authorization": f"Bearer {token}"}

    # Create link with valid future expiry
    future_date = (datetime.now(timezone.utc) + timedelta(days=2)).isoformat()
    res = client.post(
        "/api/urls",
        json={
            "original_url": "https://developer.mozilla.org",
            "title": "MDN Web Docs",
            "expires_at": future_date,
        },
        headers=headers,
    )
    assert res.status_code == 201
    url_id = res.json()["id"]
    short_code = res.json()["short_code"]

    # Directly adjust expiration date into the past to simulate elapsed time
    from app.core.database import SessionLocal
    from app.models.url import ShortURL
    with SessionLocal() as db:
        url_obj = db.query(ShortURL).filter(ShortURL.id == url_id).first()
        url_obj.expires_at = datetime.now(timezone.utc) - timedelta(hours=2)
        db.commit()

    # Visitor opens expired link (JSON)
    json_res = client.get(f"/{short_code}", headers={"Accept": "application/json"}, follow_redirects=False)
    assert json_res.status_code == 410
    data = json_res.json()
    assert data["error"] == "link_expired"

    # Visitor opens expired link (Browser)
    html_res = client.get(f"/{short_code}", headers={"Accept": "text/html"}, follow_redirects=False)
    assert html_res.status_code == 410
    assert "text/html" in html_res.headers["content-type"]
    assert "Link Has Expired" in html_res.text


def test_reserved_codes_not_treated_as_short_links(client):
    """Verifies reserved paths like /api, /docs, /health are protected."""
    # Direct requests to system paths shouldn't be handled by the redirect engine
    health_res = client.get("/api/health")
    assert health_res.status_code == 200
    assert health_res.json()["status"] == "healthy"

    root_res = client.get("/")
    assert root_res.status_code == 200
    assert root_res.json()["status"] == "online"

    # If someone tries to open /{reserved_code} directly as a short link
    docs_fake = client.get("/api", headers={"Accept": "application/json"}, follow_redirects=False)
    assert docs_fake.status_code in (404, 405)


def test_no_database_ids_exposed_in_short_urls(client):
    """Verifies that short codes are used and internal database IDs are not exposed."""
    token, _ = register_user(client, "leak_check")
    headers = {"Authorization": f"Bearer {token}"}

    res = client.post(
        "/api/urls",
        json={"original_url": "https://example.com/sensitive-path", "title": "Example"},
        headers=headers,
    )
    assert res.status_code == 201
    data = res.json()
    short_code = data["short_code"]
    url_id = data["id"]

    # The short code must not be just the database ID
    assert short_code != str(url_id)
    assert not short_code.startswith("id_")
    # Public short URL should end with /{short_code}
    assert data["short_url"].endswith(f"/{short_code}")
