"""Integration test for Redis cache in LinkPulse redirect engine."""
import sys
from datetime import datetime, timezone, timedelta
from unittest.mock import MagicMock

from app.services.cache_service import CacheService
from app.services.url_service import URLService
from app.routers.redirect import process_redirect
from app.core.database import SessionLocal
from app.models.url import ShortURL
from app.models.user import User

def test_redirect_caching_flow():
    print("Testing Redis redirect caching flow...")
    db = SessionLocal()
    try:
        # Find or create a test user
        user = db.query(User).first()
        if not user:
            user = User(name="Test Cache User", email="test_cache@example.com", password_hash="dummy_hash")
            db.add(user)
            db.commit()
            db.refresh(user)

        # Create a unique short link directly in DB
        code = f"tcache{int(datetime.now().timestamp()) % 100000}"
        target_url = "https://example.com/cached-performance-proof"
        short_url = ShortURL(
            user_id=user.id,
            original_url=target_url,
            short_code=code,
            title="Redis Cache Test",
            is_active=True,
            click_count=0,
        )
        db.add(short_url)
        db.commit()
        db.refresh(short_url)
        print(f"Created test link: short_code={code}, id={short_url.id}")

        # Ensure cache is clear before start
        CacheService.delete_url(code)
        assert CacheService.get_url(code) is None

        # --- Request 1: Cache Miss ---
        mock_request = MagicMock()
        mock_request.headers = {"accept": "text/html", "user-agent": "pytest-browser"}
        mock_request.client.host = "127.0.0.1"
        bg_tasks = MagicMock()

        resp1 = process_redirect(code, mock_request, bg_tasks, db)
        print(f"Request 1 (Cache Miss) response status: {resp1.status_code}")
        assert resp1.status_code == 307
        assert resp1.headers["location"] == target_url

        # Verify key was automatically stored in cache
        cached_entry = CacheService.get_url(code)
        print(f"Cached entry after Request 1: {cached_entry}")
        assert cached_entry is not None, "Cache should have been populated on miss"
        assert cached_entry["id"] == short_url.id
        assert cached_entry["original_url"] == target_url
        assert cached_entry["is_active"] is True

        # --- Request 2: Cache Hit (Zero-DB Hit) ---
        # Mock a closed/empty DB to guarantee zero database queries are made
        failing_db = MagicMock()
        failing_db.query.side_effect = Exception("Database should not be accessed on cache hit!")

        resp2 = process_redirect(code, mock_request, bg_tasks, failing_db)
        print(f"Request 2 (Cache Hit, Zero-DB) response status: {resp2.status_code}")
        assert resp2.status_code == 307
        assert resp2.headers["location"] == target_url
        print("Zero-DB cache hit redirect successfully verified!")

        # --- Test Invalidation on Deactivation ---
        URLService.update_url_status(db, user.id, short_url.id, is_active=False)
        print("Deactivated link via URLService.update_url_status.")

        # Verify cache was purged
        assert CacheService.get_url(code) is None, "Cache key should be deleted on link deactivation"

        # Request 3: Deactivated link
        resp3 = process_redirect(code, mock_request, bg_tasks, db)
        print(f"Request 3 (Deactivated link) response status: {resp3.status_code}")
        assert resp3.status_code == 410, f"Expected 410, got {resp3.status_code}"
        print("Deactivation and 410 response verified.")

        # --- Test Invalidation on Deletion ---
        # Re-activate and re-cache
        URLService.update_url_status(db, user.id, short_url.id, is_active=True)
        resp4 = process_redirect(code, mock_request, bg_tasks, db)
        assert resp4.status_code == 307
        assert CacheService.get_url(code) is not None

        # Delete link
        URLService.delete_user_url(db, user.id, short_url.id)
        assert CacheService.get_url(code) is None, "Cache key should be deleted on link deletion"

        # Request 5: Deleted link
        resp5 = process_redirect(code, mock_request, bg_tasks, db)
        assert resp5.status_code == 404, f"Expected 404, got {resp5.status_code}"
        print("Deletion and 404 response verified.")

        print("\nAll Redis redirect caching & invalidation integration tests passed with 100% success!")

    finally:
        db.close()

if __name__ == "__main__":
    test_redirect_caching_flow()
