import uuid


def register_test_user(client, prefix="user"):
    """Helper to create a user and return access token and user info."""
    uid = uuid.uuid4().hex[:8]
    email = f"{prefix}_{uid}@linkpulse.test"
    password = "TestPassword123!"
    res = client.post(
        "/api/auth/register",
        json={"name": f"Test {prefix}", "email": email, "password": password},
    )
    if res.status_code != 201:
        # If user already registered in prior test, login
        login_res = client.post("/api/auth/login", json={"email": email, "password": password})
        return login_res.json()["access_token"], login_res.json()["user"]
    return res.json()["access_token"], res.json()["user"]


def test_url_shortening_flow(client):
    """Integration test for URL creation, listing, status toggle, deletion, and redirect."""
    token, user = register_test_user(client, "creator")
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Create a short URL with generated short_code
    create_payload = {
        "original_url": "https://fastapi.tiangolo.com/tutorial/",
        "title": "FastAPI Tutorial Documentation",
    }
    create_res = client.post("/api/urls", json=create_payload, headers=headers)
    assert create_res.status_code == 201
    url_data = create_res.json()
    assert url_data["original_url"] == "https://fastapi.tiangolo.com/tutorial/"
    assert "short_code" in url_data
    assert len(url_data["short_code"]) >= 7
    assert url_data["is_active"] is True
    assert url_data["click_count"] == 0
    url_id = url_data["id"]
    short_code = url_data["short_code"]

    # 2. List user URLs
    list_res = client.get("/api/urls", headers=headers)
    assert list_res.status_code == 200
    items = list_res.json()
    assert any(item["id"] == url_id for item in items)

    # 3. Get URL by ID
    get_res = client.get(f"/api/urls/{url_id}", headers=headers)
    assert get_res.status_code == 200
    assert get_res.json()["id"] == url_id

    # 4. Toggle status to inactive
    patch_res = client.patch(
        f"/api/urls/{url_id}/status",
        json={"is_active": False},
        headers=headers,
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["is_active"] is False

    # 5. Public redirect while inactive should return 410 Gone
    red_inactive = client.get(f"/r/{short_code}", follow_redirects=False)
    assert red_inactive.status_code == 410

    # 6. Re-activate status
    patch_res2 = client.patch(
        f"/api/urls/{url_id}/status",
        json={"is_active": True},
        headers=headers,
    )
    assert patch_res2.status_code == 200
    assert patch_res2.json()["is_active"] is True

    # 7. Public redirect while active should return 307 redirect
    red_active = client.get(f"/r/{short_code}", follow_redirects=False)
    assert red_active.status_code == 307
    assert red_active.headers["location"] == "https://fastapi.tiangolo.com/tutorial/"

    # 8. Check click count incremented
    get_res2 = client.get(f"/api/urls/{url_id}", headers=headers)
    assert get_res2.json()["click_count"] == 1

    # 9. Delete URL
    del_res = client.delete(f"/api/urls/{url_id}", headers=headers)
    assert del_res.status_code == 204

    # 10. Verify deleted URL returns 404
    get_del = client.get(f"/api/urls/{url_id}", headers=headers)
    assert get_del.status_code == 404


def test_tenant_isolation(client):
    """Ensure User A cannot see, edit, or delete User B's links."""
    token_a, _ = register_test_user(client, "user_a")
    token_b, _ = register_test_user(client, "user_b")

    # User A creates a link
    res_a = client.post(
        "/api/urls",
        json={"original_url": "https://python.org", "title": "Python Org"},
        headers={"Authorization": f"Bearer {token_a}"},
    )
    assert res_a.status_code == 201
    url_id_a = res_a.json()["id"]

    # User B lists links -> should NOT contain User A's link
    list_b = client.get("/api/urls", headers={"Authorization": f"Bearer {token_b}"})
    assert list_b.status_code == 200
    assert all(item["id"] != url_id_a for item in list_b.json())

    # User B tries to get User A's link -> 404
    get_b = client.get(f"/api/urls/{url_id_a}", headers={"Authorization": f"Bearer {token_b}"})
    assert get_b.status_code == 404

    # User B tries to delete User A's link -> 404
    del_b = client.delete(f"/api/urls/{url_id_a}", headers={"Authorization": f"Bearer {token_b}"})
    assert del_b.status_code == 404


def test_custom_code_and_validation(client):
    """Test custom short code collision and URL format validation."""
    token, _ = register_test_user(client, "slugger")
    headers = {"Authorization": f"Bearer {token}"}
    custom_slug = f"launch-{uuid.uuid4().hex[:6]}"

    # Create link with custom code
    res1 = client.post(
        "/api/urls",
        json={"original_url": "https://github.com", "custom_code": custom_slug},
        headers=headers,
    )
    assert res1.status_code == 201
    assert res1.json()["short_code"] == custom_slug

    # Duplicate custom code should return 409 Conflict
    res_dup = client.post(
        "/api/urls",
        json={"original_url": "https://google.com", "custom_code": custom_slug},
        headers=headers,
    )
    assert res_dup.status_code == 409

    # Invalid URL without valid domain should fail validation
    res_bad = client.post(
        "/api/urls",
        json={"original_url": "not_a_valid_url"},
        headers=headers,
    )
    assert res_bad.status_code == 422
