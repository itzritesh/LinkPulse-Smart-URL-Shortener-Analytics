import uuid
from datetime import datetime, timezone
from app.services.user_agent_service import UserAgentService
from app.services.geo_service import GeoService


def register_user(client, prefix="analytics_user"):
    """Helper to create an authenticated user for tests."""
    uid = uuid.uuid4().hex[:8]
    email = f"{prefix}_{uid}@linkpulse.test"
    password = "TestPassword123!"
    res = client.post(
        "/api/auth/register",
        json={"name": f"User {prefix}", "email": email, "password": password},
    )
    if res.status_code != 201:
        login_res = client.post("/api/auth/login", json={"email": email, "password": password})
        return login_res.json()["access_token"], login_res.json()["user"]
    return res.json()["access_token"], res.json()["user"]


def test_user_agent_service_detection():
    """Unit tests for UserAgentService parsing."""
    # 1. Desktop Windows Chrome
    desktop_ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    res1 = UserAgentService.parse(desktop_ua)
    assert res1["device_type"] == "Desktop"
    assert res1["browser"] == "Chrome"
    assert res1["operating_system"] == "Windows"

    # 2. Mobile iPhone Safari
    iphone_ua = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1"
    res2 = UserAgentService.parse(iphone_ua)
    assert res2["device_type"] == "Mobile"
    assert res2["browser"] == "Safari"
    assert res2["operating_system"] == "iOS"

    # 3. Tablet iPad
    ipad_ua = "Mozilla/5.0 (iPad; CPU OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1"
    res3 = UserAgentService.parse(ipad_ua)
    assert res3["device_type"] == "Tablet"

    # 4. macOS Firefox
    firefox_ua = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:121.0) Gecko/20100101 Firefox/121.0"
    res4 = UserAgentService.parse(firefox_ua)
    assert res4["device_type"] == "Desktop"
    assert res4["browser"] == "Firefox"
    assert res4["operating_system"] == "macOS"

    # 5. Linux Edge
    edge_ua = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0"
    res5 = UserAgentService.parse(edge_ua)
    assert res5["browser"] == "Edge"
    assert res5["operating_system"] == "Linux"


def test_geo_service_approximate_resolution():
    """Unit tests for GeoService privacy-preserving approximate location."""
    # 1. Localhost / Private IP
    local_res = GeoService.lookup_approximate_location("127.0.0.1")
    assert local_res["country"] == "Local / Development"
    assert local_res["city"] == "Localhost"

    # 2. Private 192.168.x.x
    private_res = GeoService.lookup_approximate_location("192.168.1.50")
    assert private_res["city"] == "Localhost"

    # 3. CDN Headers (Cloudflare)
    headers = {
        "cf-ipcountry": "US",
        "cf-region": "California",
        "cf-ipcity": "San Francisco",
    }
    cdn_res = GeoService.lookup_approximate_location("198.51.100.1", headers=headers)
    assert cdn_res["country"] == "United States"
    assert cdn_res["region"] == "California"
    assert cdn_res["city"] == "San Francisco"


def test_click_tracking_and_analytics_flow(client):
    """Integration test verifying click tracking on redirect and analytics API retrieval."""
    token, user = register_user(client, "tracking")
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Create a short link
    create_res = client.post(
        "/api/urls",
        json={"original_url": "https://react.dev/learn", "title": "React Learn Docs"},
        headers=headers,
    )
    assert create_res.status_code == 201
    url_data = create_res.json()
    url_id = url_data["id"]
    short_code = url_data["short_code"]

    # 2. Simulate visitors clicking the link with different devices and headers
    visitors = [
        {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36",
            "Referer": "https://twitter.com/post/999",
            "cf-ipcountry": "US",
            "cf-ipcity": "New York",
        },
        {
            "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Safari/604.1",
            "Referer": "https://linkedin.com/feed",
            "cf-ipcountry": "GB",
            "cf-ipcity": "London",
        },
        {
            "User-Agent": "Mozilla/5.0 (iPad; CPU OS 16_5 like Mac OS X) AppleWebKit/605.1.15 Safari/604.1",
            "Referer": "https://google.com/search?q=react",
            "cf-ipcountry": "US",
            "cf-ipcity": "San Francisco",
        },
    ]

    for v_headers in visitors:
        red_res = client.get(f"/{short_code}", headers=v_headers, follow_redirects=False)
        assert red_res.status_code == 307
        assert red_res.headers["location"] == "https://react.dev/learn"

    # 3. Retrieve detailed URL analytics
    analytics_res = client.get(f"/api/analytics/urls/{url_id}", headers=headers)
    assert analytics_res.status_code == 200
    analytics_data = analytics_res.json()

    assert analytics_data["url_id"] == url_id
    assert analytics_data["total_clicks"] == 3
    assert len(analytics_data["devices"]) >= 2
    assert len(analytics_data["browsers"]) >= 1
    assert len(analytics_data["operating_systems"]) >= 2

    # 4. PRIVACY CHECK: Verify raw IP address is NEVER exposed in the API response
    raw_json_str = analytics_res.text.lower()
    assert "ip_address" not in raw_json_str
    assert "198.51.100" not in raw_json_str

    # 5. Retrieve overview analytics
    overview_res = client.get("/api/analytics/overview", headers=headers)
    assert overview_res.status_code == 200
    overview_data = overview_res.json()
    assert overview_data["total_clicks"] >= 3
    assert overview_data["total_links"] >= 1
    assert len(overview_data["devices"]) >= 1


def test_analytics_multi_tenant_isolation(client):
    """Ensures User A cannot view analytics for User B's link."""
    token_a, _ = register_user(client, "alice")
    token_b, _ = register_user(client, "bob")

    # Alice creates a link
    res_a = client.post(
        "/api/urls",
        json={"original_url": "https://python.org", "title": "Python Website"},
        headers={"Authorization": f"Bearer {token_a}"},
    )
    assert res_a.status_code == 201
    alice_url_id = res_a.json()["id"]

    # Bob attempts to fetch Alice's link analytics -> must return 404
    bob_req = client.get(
        f"/api/analytics/urls/{alice_url_id}",
        headers={"Authorization": f"Bearer {token_b}"},
    )
    assert bob_req.status_code == 404
