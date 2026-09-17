import os
import sys
import pytest
from fastapi.testclient import TestClient

# Add backend to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "backend")))

from app.main import app


@pytest.fixture(scope="session")
def client():
    """Provides a TestClient instance for testing FastAPI endpoints."""
    with TestClient(app) as test_client:
        yield test_client
