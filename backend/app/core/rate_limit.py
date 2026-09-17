"""In-memory sliding window rate limiter for LinkPulse.

Provides thread-safe request rate limiting per IP address or user ID,
returning standard HTTP 429 Too Many Requests with Retry-After headers.
"""
import time
from collections import defaultdict
from threading import Lock
from typing import Optional, Tuple
from fastapi import Request, HTTPException, status


class RateLimiter:
    """Thread-safe sliding window rate limiter."""

    def __init__(self, requests_limit: int, window_seconds: int = 60, name: str = "rate_limit"):
        self.requests_limit = requests_limit
        self.window_seconds = window_seconds
        self.name = name
        self._history = defaultdict(list)
        self._lock = Lock()

    def _clean_and_check(self, key: str) -> Tuple[bool, int]:
        """Cleans expired timestamps and returns (is_allowed, retry_after_seconds)."""
        now = time.time()
        window_start = now - self.window_seconds

        with self._lock:
            timestamps = self._history[key]
            # Filter out entries older than the sliding window
            self._history[key] = [t for t in timestamps if t > window_start]
            current_count = len(self._history[key])

            if current_count >= self.requests_limit:
                # Oldest timestamp in window dictates retry after
                oldest_in_window = self._history[key][0]
                retry_after = max(1, int(oldest_in_window + self.window_seconds - now))
                return False, retry_after

            # Allow and append current timestamp
            self._history[key].append(now)
            return True, 0

    def get_client_key(self, request: Request) -> str:
        """Extracts the client identification key (client IP or forwarded IP)."""
        forwarded_for = request.headers.get("x-forwarded-for")
        if forwarded_for:
            client_ip = forwarded_for.split(",")[0].strip()
        elif request.client:
            client_ip = request.client.host
        else:
            client_ip = "unknown_client"
        return f"{self.name}:{client_ip}"

    def __call__(self, request: Request) -> None:
        """FastAPI Dependency callable that raises HTTP 429 if rate limit is exceeded."""
        key = self.get_client_key(request)
        allowed, retry_after = self._clean_and_check(key)

        if not allowed:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Rate limit exceeded. Please try again in {retry_after} seconds.",
                headers={"Retry-After": str(retry_after)},
            )


# Pre-configured rate limiters for distinct application surfaces
# 1. Auth endpoints: 10 requests / 60 seconds (brute-force defense)
auth_rate_limiter = RateLimiter(requests_limit=10, window_seconds=60, name="auth")

# 2. URL creation: 60 requests / 60 seconds (spam / scraping defense)
create_url_rate_limiter = RateLimiter(requests_limit=60, window_seconds=60, name="create_url")

# 3. Public redirection: 300 requests / 60 seconds (DDoS mitigation on redirects)
redirect_rate_limiter = RateLimiter(requests_limit=300, window_seconds=60, name="redirect")

# 4. General API calls: 180 requests / 60 seconds
api_rate_limiter = RateLimiter(requests_limit=180, window_seconds=60, name="api")
