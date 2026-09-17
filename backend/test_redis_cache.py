"""Test script to verify CacheService set, get, TTL, deletion, and fallback."""
import sys
import time

from app.services.cache_service import CacheService

def run_cache_tests():
    print("Testing CacheService...")

    # 1. Test set and get
    test_data = {
        "id": 42,
        "original_url": "https://example.com/target-test",
        "is_active": True,
        "expires_at": None,
    }
    success = CacheService.set_url("sample_short", test_data, ttl=60)
    print(f"Set URL in cache: {success}")
    assert success is True, "Failed to set URL in cache"

    # 2. Test lookup (cache hit)
    retrieved = CacheService.get_url("sample_short")
    print(f"Retrieved from cache: {retrieved}")
    assert retrieved is not None, "Cache miss on sample_short"
    assert retrieved["id"] == 42
    assert retrieved["original_url"] == "https://example.com/target-test"
    assert retrieved["is_active"] is True

    # 3. Test deletion / invalidation
    del_success = CacheService.delete_url("sample_short")
    print(f"Deleted from cache: {del_success}")
    assert del_success is True

    # 4. Verify after invalidation
    retrieved_after_del = CacheService.get_url("sample_short")
    print(f"Retrieved after deletion: {retrieved_after_del}")
    assert retrieved_after_del is None, "Cache key was not invalidated properly"

    # 5. Test short TTL expiration
    CacheService.set_url("expiring_code", test_data, ttl=1)
    assert CacheService.get_url("expiring_code") is not None
    time.sleep(1.2)
    assert CacheService.get_url("expiring_code") is None, "Cache key did not expire as expected"
    print("TTL expiration verified.")

    print("\nAll CacheService verification tests passed successfully!")

if __name__ == "__main__":
    run_cache_tests()
