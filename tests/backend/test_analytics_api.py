import uuid
from datetime import datetime, timezone, timedelta
from app.services.user_agent_service import UserAgentService


def register_test_user(client, prefix="analytics_api"):
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


def test_complete_analytics_api_suite(client):
    """Verifies all 6 analytics endpoints, aggregations, privacy rules, and date filters."""
    token_a, user_a = register_test_user(client, "alice")
    headers_a = {"Authorization": f"Bearer {token_a}"}

    # 1. Create a short URL for user A
    create_res = client.post(
        "/api/urls",
        json={"original_url": "https://fastapi.tiangolo.com/", "title": "FastAPI Framework"},
        headers=headers_a,
    )
    assert create_res.status_code == 201
    url_id = create_res.json()["id"]
    short_code = create_res.json()["short_code"]

    # 2. Simulate multi-device, multi-location visitor clicks
    visitors = [
        {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
            "Referer": "https://twitter.com/dev/status/12345",
            "cf-ipcountry": "US",
            "cf-region": "California",
            "cf-ipcity": "San Francisco",
        },
        {
            "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Safari/604.1",
            "Referer": "https://linkedin.com/feed/update",
            "cf-ipcountry": "GB",
            "cf-region": "England",
            "cf-ipcity": "London",
        },
        {
            "User-Agent": "Mozilla/5.0 (iPad; CPU OS 16_5 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1",
            "Referer": "https://news.ycombinator.com/",
            "cf-ipcountry": "DE",
            "cf-region": "Bavaria",
            "cf-ipcity": "Munich",
        },
        {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
            "Referer": "https://github.com/trending",
            "cf-ipcountry": "US",
            "cf-region": "New York",
            "cf-ipcity": "New York",
        },
    ]

    for v in visitors:
        resp = client.get(f"/{short_code}", headers=v, follow_redirects=False)
        assert resp.status_code == 307

    # -------------------------------------------------------------------------
    # 3. Test GET /api/analytics/{url_id} (Comprehensive Summary)
    # -------------------------------------------------------------------------
    res_summary = client.get(f"/api/analytics/{url_id}", headers=headers_a)
    assert res_summary.status_code == 200
    summary_data = res_summary.json()

    assert summary_data["url_id"] == url_id
    assert summary_data["short_code"] == short_code
    assert summary_data["total_in_period"] == 4
    assert summary_data["kpis"]["total_clicks"] == 4
    assert summary_data["kpis"]["clicks_today"] == 4
    assert summary_data["kpis"]["clicks_this_week"] == 4
    assert summary_data["kpis"]["clicks_this_month"] == 4

    # Check breakdowns exist
    assert len(summary_data["devices"]) >= 2
    assert len(summary_data["browsers"]) >= 2
    assert len(summary_data["operating_systems"]) >= 2
    assert len(summary_data["referrals"]) >= 2
    assert len(summary_data["countries"]) >= 2
    assert len(summary_data["regions"]) >= 2
    assert len(summary_data["cities"]) >= 2
    assert len(summary_data["timeline"]) >= 1

    # Strict Privacy Check: No raw IP in summary
    assert "ip_address" not in res_summary.text.lower()

    # -------------------------------------------------------------------------
    # 4. Test GET /api/analytics/{url_id}/clicks (KPIs + Paginated Events)
    # -------------------------------------------------------------------------
    res_clicks = client.get(f"/api/analytics/{url_id}/clicks?page=1&limit=2", headers=headers_a)
    assert res_clicks.status_code == 200
    clicks_data = res_clicks.json()

    assert clicks_data["url_id"] == url_id
    assert clicks_data["kpis"]["total_clicks"] == 4
    assert clicks_data["page"] == 1
    assert clicks_data["limit"] == 2
    assert clicks_data["total_pages"] == 2
    assert len(clicks_data["events"]) == 2

    first_event = clicks_data["events"][0]
    assert "id" in first_event
    assert "device_type" in first_event
    assert "browser" in first_event
    assert "operating_system" in first_event
    assert "country" in first_event
    assert "region" in first_event
    assert "city" in first_event
    assert "referrer" in first_event
    assert "clicked_at" in first_event
    # Strict Privacy Check: No raw IP in event list
    assert "ip_address" not in first_event
    assert "ip_address" not in res_clicks.text.lower()

    # -------------------------------------------------------------------------
    # 5. Test GET /api/analytics/{url_id}/devices (Device, Browser, OS Breakdown)
    # -------------------------------------------------------------------------
    res_devices = client.get(f"/api/analytics/{url_id}/devices", headers=headers_a)
    assert res_devices.status_code == 200
    devices_data = res_devices.json()

    assert devices_data["total_clicks"] == 4
    device_names = [d["name"] for d in devices_data["devices"]]
    assert "Desktop" in device_names
    assert "Mobile" in device_names or "Tablet" in device_names

    browser_names = [b["name"] for b in devices_data["browsers"]]
    assert "Chrome" in browser_names
    assert "Safari" in browser_names

    os_names = [o["name"] for o in devices_data["operating_systems"]]
    assert any(os in os_names for os in ["Windows", "macOS", "iOS"])

    # -------------------------------------------------------------------------
    # 6. Test GET /api/analytics/{url_id}/referrals (Referral Breakdown)
    # -------------------------------------------------------------------------
    res_referrals = client.get(f"/api/analytics/{url_id}/referrals", headers=headers_a)
    assert res_referrals.status_code == 200
    referrals_data = res_referrals.json()

    assert referrals_data["total_clicks"] == 4
    ref_names = [r["name"] for r in referrals_data["referrals"]]
    assert any("twitter" in r for r in ref_names)
    assert any("linkedin" in r for r in ref_names)

    # -------------------------------------------------------------------------
    # 7. Test GET /api/analytics/{url_id}/locations (Country, Region, City)
    # -------------------------------------------------------------------------
    res_locations = client.get(f"/api/analytics/{url_id}/locations", headers=headers_a)
    assert res_locations.status_code == 200
    locations_data = res_locations.json()

    assert locations_data["total_clicks"] == 4
    country_names = [c["name"] for c in locations_data["countries"]]
    assert "United States" in country_names or "US" in country_names
    assert len(locations_data["regions"]) >= 2
    assert len(locations_data["cities"]) >= 2

    # -------------------------------------------------------------------------
    # 8. Test GET /api/analytics/{url_id}/timeline (Trends & Peak Metrics)
    # -------------------------------------------------------------------------
    res_timeline = client.get(f"/api/analytics/{url_id}/timeline?period=30d", headers=headers_a)
    assert res_timeline.status_code == 200
    timeline_data = res_timeline.json()

    assert timeline_data["total_clicks"] == 4
    assert len(timeline_data["timeline"]) >= 1
    assert timeline_data["peak_clicks"] >= 1
    assert timeline_data["average_clicks_per_day"] > 0

    # Hourly interval for 'today'
    res_today_timeline = client.get(f"/api/analytics/{url_id}/timeline?period=today", headers=headers_a)
    assert res_today_timeline.status_code == 200
    assert res_today_timeline.json()["interval"] == "hour"

    # -------------------------------------------------------------------------
    # 9. Test Date Filtering (today, 7d, 30d, custom)
    # -------------------------------------------------------------------------
    res_today = client.get(f"/api/analytics/{url_id}?period=today", headers=headers_a)
    assert res_today.status_code == 200
    assert res_today.json()["period"] == "today"

    res_7d = client.get(f"/api/analytics/{url_id}?period=7d", headers=headers_a)
    assert res_7d.status_code == 200
    assert res_7d.json()["period"] == "7d"

    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    tomorrow_str = (datetime.now(timezone.utc) + timedelta(days=1)).strftime("%Y-%m-%d")
    res_custom = client.get(
        f"/api/analytics/{url_id}?period=custom&start_date={today_str}&end_date={tomorrow_str}",
        headers=headers_a,
    )
    assert res_custom.status_code == 200
    assert res_custom.json()["period"] == "custom"
    assert res_custom.json()["total_in_period"] == 4

    # Invalid custom range without params -> 400
    res_invalid_custom = client.get(f"/api/analytics/{url_id}?period=custom", headers=headers_a)
    assert res_invalid_custom.status_code == 400

    # Invalid date ordering -> 400
    res_inverted = client.get(
        f"/api/analytics/{url_id}?period=custom&start_date={tomorrow_str}&end_date={today_str}",
        headers=headers_a,
    )
    assert res_inverted.status_code == 400

    # -------------------------------------------------------------------------
    # 10. Multi-Tenant Authorization Security: User B cannot access User A's URL
    # -------------------------------------------------------------------------
    token_b, user_b = register_test_user(client, "bob")
    headers_b = {"Authorization": f"Bearer {token_b}"}

    endpoints_to_test = [
        f"/api/analytics/{url_id}",
        f"/api/analytics/{url_id}/clicks",
        f"/api/analytics/{url_id}/devices",
        f"/api/analytics/{url_id}/referrals",
        f"/api/analytics/{url_id}/locations",
        f"/api/analytics/{url_id}/timeline",
    ]

    for ep in endpoints_to_test:
        unauthorized_res = client.get(ep, headers=headers_b)
        assert unauthorized_res.status_code == 404, f"Endpoint {ep} should return 404 for unauthorized user"
