"""Redis caching service for LinkPulse URL resolution with graceful degradation.

Provides high-performance short_code -> original_url lookups using Redis,
with automatic fallback to PostgreSQL and in-memory caching when Redis
is offline or unreachable.
"""
import json
import time
from typing import Optional, Dict, Any, Tuple
from app.core.config import settings
from app.utils.logger import logger

try:
    import redis
    _HAS_REDIS_LIB = True
except ImportError:
    _HAS_REDIS_LIB = False
    redis = None  # type: ignore


class CacheService:
    """Resilient URL cache with Redis primary and local memory fallback."""

    _redis_client: Optional[Any] = None
    _redis_checked: bool = False
    _redis_available: bool = False
    _memory_cache: Dict[str, Tuple[Dict[str, Any], float]] = {}  # key -> (data, expire_at)

    @classmethod
    def _get_redis(cls) -> Optional[Any]:
        """Lazily connects to Redis with fast failover."""
        if not settings.REDIS_ENABLED or not _HAS_REDIS_LIB or not settings.REDIS_URL:
            return None

        if cls._redis_client is not None:
            return cls._redis_client if cls._redis_available else None

        try:
            client = redis.Redis.from_url(
                settings.REDIS_URL,
                socket_connect_timeout=settings.REDIS_SOCKET_TIMEOUT,
                socket_timeout=settings.REDIS_SOCKET_TIMEOUT,
                decode_responses=True,
            )
            # Test connectivity
            client.ping()
            cls._redis_client = client
            cls._redis_available = True
            logger.info(f"[Cache] Connected to Redis cache at {settings.REDIS_URL}")
            return cls._redis_client
        except Exception as exc:
            cls._redis_available = False
            if not cls._redis_checked:
                logger.info(
                    f"[Cache] Redis unavailable ({exc}). Gracefully falling back to local memory and PostgreSQL."
                )
                cls._redis_checked = True
            return None

    @classmethod
    def _format_key(cls, short_code: str) -> str:
        return f"linkpulse:url:{short_code.strip()}"

    @classmethod
    def get_url(cls, short_code: str) -> Optional[Dict[str, Any]]:
        """Retrieves cached URL metadata by short code.

        Returns dict containing: id, original_url, is_active, expires_at
        or None on cache miss or error.
        """
        key = cls._format_key(short_code)

        # 1. Try Redis first
        client = cls._get_redis()
        if client:
            try:
                cached_json = client.get(key)
                if cached_json:
                    return json.loads(cached_json)
            except Exception as exc:
                logger.debug(f"[Cache] Redis get error: {exc}. Falling back to memory cache.")

        # 2. Fallback to in-memory cache
        if key in cls._memory_cache:
            data, expire_at = cls._memory_cache[key]
            if time.time() < expire_at:
                return data
            else:
                # Expired in memory
                del cls._memory_cache[key]

        return None

    @classmethod
    def set_url(cls, short_code: str, data: Dict[str, Any], ttl: Optional[int] = None) -> bool:
        """Stores short URL metadata in cache with a TTL (seconds)."""
        key = cls._format_key(short_code)
        effective_ttl = ttl if ttl is not None else settings.REDIS_CACHE_TTL_SECONDS
        json_data = json.dumps(data)

        # 1. Update in-memory fallback
        expire_at = time.time() + effective_ttl
        cls._memory_cache[key] = (data, expire_at)

        # 2. Update Redis
        client = cls._get_redis()
        if client:
            try:
                client.setex(key, effective_ttl, json_data)
                return True
            except Exception as exc:
                logger.debug(f"[Cache] Redis set error: {exc}. Memory cache updated.")
                return False

        return True

    @classmethod
    def delete_url(cls, short_code: str) -> bool:
        """Invalidates the cache entry for a short code (used on delete or deactivation)."""
        key = cls._format_key(short_code)

        # 1. Remove from memory cache
        if key in cls._memory_cache:
            del cls._memory_cache[key]

        # 2. Remove from Redis
        client = cls._get_redis()
        if client:
            try:
                client.delete(key)
                return True
            except Exception as exc:
                logger.debug(f"[Cache] Redis delete error: {exc}")
                return False

        return True

    @classmethod
    def is_redis_connected(cls) -> bool:
        """Returns True if Redis is reachable and active."""
        client = cls._get_redis()
        return bool(client and cls._redis_available)
