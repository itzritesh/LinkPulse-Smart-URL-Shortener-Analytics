import uuid
from datetime import datetime, timezone, timedelta
from app.services.user_agent_service import UserAgentService


def register_test_user(client, prefix="adv_filter"):
    """Helper to create and authenticate a distinct test user."""
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


def test_advanced_filtering_and_comparison(client):
    """Verifies backend database-level filtering, period comparison, and options endpoint."""
    token, user = register_test_user(client, "filter_user")
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Create two short links
    res1 = client.post(
        "/api/urls",
        json={"original_url": "https://fastapi.tiangolo.com/", "title": "FastAPI Docs"},
        headers=headers,
    )
    assert res1.status_code == 201
    url1_id = res1.json()["id"]
    code1 = res1.json()["short_code"]

    res2 = client.post(
        "/api/urls",
        json={"original_url": "https://react.dev/", "title": "React Docs"},
        headers=headers,
    )
    assert res2.status_code == 201
    url2_id = res2.json()["id"]
    code2 = res2.json()["short_code"]

    # 2. Record simulated clicks with varying attributes on both links
    # Link 1: Mobile from US (Twitter)
    client.get(
        f"/{code1}",
        headers={
            "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Safari/604.1",
            "Referer": "https://twitter.com/dev/post",
            "cf-ipcountry": "US",
            "cf-region": "California",
            "cf-ipcity": "San Francisco",
        },
        follow_redirects=False,
    )
    # Link 1: Desktop from US (Google)
    client.get(
        f"/{code1}",
        headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
            "Referer": "https://google.com/search",
            "cf-ipcountry": "US",
            "cf-region": "California",
            "cf-ipcity": "Los Angeles",
        },
        follow_redirects=False,
    )
    # Link 2: Mobile from Germany (LinkedIn)
    client.get(
        f"/{code2}",
        headers={
            "User-Agent": "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36",
            "Referer": "https://linkedin.com/feed",
            "cf-ipcountry": "DE",
            "cf-region": "Bavaria",
            "cf-ipcity": "Munich",
        },
        follow_redirects=False,
    )
    # Link 2: Desktop from Germany (Direct)
    client.get(
        f"/{code2}",
        headers={
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
            "cf-ipcountry": "DE",
            "cf-region": "Berlin",
            "cf-ipcity": "Berlin",
        },
        follow_redirects=False,
    )

    # 3. Test Filter Options Endpoint
    opts_res = client.get("/api/analytics/filter-options", headers=headers)
    assert opts_res.status_code == 200
    options = opts_res.json()
    assert "Desktop" in options["devices"]
    assert "Mobile" in options["devices"]
    assert "United States" in options["countries"] or "Germany" in options["countries"]
    assert len(options["urls"]) >= 2

    # 4. Test Filter by Device = Mobile
    mobile_res = client.get("/api/analytics/filter?device=Mobile&period=today", headers=headers)
    assert mobile_res.status_code == 200
    mob_data = mobile_res.json()
    assert mob_data["kpis"]["total_clicks"] == 2
    assert mob_data["kpis"]["mobile_clicks"] == 2
    # Verify all returned events have Mobile device
    for ev in mob_data["events"]:
        assert ev["device_type"] == "Mobile"

    # 5. Test Filter by Country = United States
    us_res = client.get("/api/analytics/filter?country=United States&period=today", headers=headers)
    assert us_res.status_code == 200
    us_data = us_res.json()
    assert us_data["kpis"]["total_clicks"] == 2
    for ev in us_data["events"]:
        assert ev["country"] == "United States"

    # 6. Test Multi-criteria Filter: url_id = url1_id AND device = Desktop
    combo_res = client.get(
        f"/api/analytics/filter?url_id={url1_id}&device=Desktop&period=today",
        headers=headers,
    )
    assert combo_res.status_code == 200
    combo_data = combo_res.json()
    assert combo_data["kpis"]["total_clicks"] == 1
    assert combo_data["events"][0]["short_code"] == code1
    assert combo_data["events"][0]["device_type"] == "Desktop"

    # 7. Test Period Comparison (Current vs Previous)
    comp_res = client.get("/api/analytics/filter?period=7d&compare=true", headers=headers)
    assert comp_res.status_code == 200
    comp_data = comp_res.json()
    assert comp_data["comparison"] is not None
    comparison = comp_data["comparison"]
    assert "clicks" in comparison
    assert "visitors" in comparison
    assert "mobile_traffic" in comparison
    assert "referral_traffic" in comparison
    assert comparison["clicks"]["current"] == 4
    assert comparison["clicks"]["trend"] in ("up", "neutral", "down")
    assert comparison["visitors"]["current"] >= 1
    assert comparison["mobile_traffic"]["current"] == 2
    assert comparison["referral_traffic"]["current"] >= 1

    # 8. Test Export CSV
    csv_res = client.get("/api/analytics/export?period=today&format=csv", headers=headers)
    assert csv_res.status_code == 200
    assert csv_res.headers["content-type"].startswith("text/csv")
    csv_text = csv_res.text
    assert "Clicked At (UTC)" in csv_text
    assert "Short Code" in csv_text
    assert code1 in csv_text or code2 in csv_text

    # 9. Test Export JSON
    json_res = client.get("/api/analytics/export?period=today&format=json", headers=headers)
    assert json_res.status_code == 200
    json_data = json_res.json()
    assert isinstance(json_data, list)
    assert len(json_data) == 4
    assert "device_type" in json_data[0]
