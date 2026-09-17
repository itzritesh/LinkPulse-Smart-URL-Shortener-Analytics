def test_root_endpoint(client):
    """Test root endpoint returns service info."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "LinkPulse"
    assert data["status"] == "online"
    assert "docs" in data
    assert "health" in data


def test_health_endpoint(client):
    """Test /api/health endpoint structure and response."""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ["healthy", "degraded"]
    assert data["service"] == "LinkPulse"
    assert "database" in data
    assert data["database"]["status"] in ["connected", "disconnected"]
    assert "timestamp" in data
    assert "environment" in data


def test_cors_headers(client):
    """Test CORS preflight / origin headers."""
    response = client.get(
        "/api/health",
        headers={"Origin": "http://localhost:5173"},
    )
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "http://localhost:5173"
