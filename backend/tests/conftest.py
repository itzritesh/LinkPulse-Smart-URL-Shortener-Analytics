"""Pytest configuration and global fixtures for LinkPulse backend test suite."""
import os
import pytest
from typing import Generator
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool

# Force testing environment
os.environ["ENVIRONMENT"] = "testing"
os.environ["REDIS_ENABLED"] = "false"

from app.core.database import Base, get_db
from app.core.rate_limit import (
    auth_rate_limiter,
    create_url_rate_limiter,
    redirect_rate_limiter,
    api_rate_limiter,
)
from app.core.security import create_access_token, get_password_hash
from app.models.user import User
from app.models.url import ShortURL
from app.models.analytics import Click
from app.services.cache_service import CacheService
import app.main
from app.main import app as fastapi_app

# Prevent lifespan from attempting remote PostgreSQL connection during tests
app.main.check_database_connection = lambda: (False, "Test mode")

# Isolated In-Memory SQLite Engine for safe, sub-millisecond tests
TEST_DATABASE_URL = "sqlite:///:memory:"

test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    """Create all tables in the in-memory database once for the test session."""
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture(autouse=True)
def reset_rate_limiters_and_cache():
    """Reset rate limiter memory counters and in-memory caches between tests."""
    auth_rate_limiter._history.clear()
    create_url_rate_limiter._history.clear()
    redirect_rate_limiter._history.clear()
    api_rate_limiter._history.clear()
    CacheService._memory_cache.clear()
    yield


@pytest.fixture
def db_session() -> Generator[Session, None, None]:
    """Provides a transactional database session per test with automatic cleanup."""
    connection = test_engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture
def client(db_session: Session) -> Generator[TestClient, None, None]:
    """Provides a TestClient wired with the in-memory database override."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    fastapi_app.dependency_overrides[get_db] = override_get_db
    with TestClient(fastapi_app) as test_client:
        yield test_client
    fastapi_app.dependency_overrides.clear()


@pytest.fixture
def test_user(db_session: Session) -> User:
    """Creates a standard verified test user."""
    user = User(
        name="Test User",
        email="test_user@linkpulse.io",
        password_hash=get_password_hash("Password123!"),
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def auth_headers(test_user: User) -> dict:
    """Returns valid JWT bearer authorization headers for test_user."""
    token = create_access_token(subject=str(test_user.id))
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def other_user(db_session: Session) -> User:
    """Creates a secondary distinct user for multi-tenant isolation verification."""
    user = User(
        name="Other User",
        email="other_tenant@linkpulse.io",
        password_hash=get_password_hash("Password123!"),
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def other_auth_headers(other_user: User) -> dict:
    """Returns valid JWT bearer authorization headers for other_user."""
    token = create_access_token(subject=str(other_user.id))
    return {"Authorization": f"Bearer {token}"}
