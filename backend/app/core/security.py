import hashlib
import hmac
import os
import time
import json
import base64
from datetime import datetime, timedelta, timezone
from typing import Any, Optional, Union

from app.core.config import settings

# Attempt to import standard production auth libraries with resilient fallbacks
try:
    from passlib.context import CryptContext
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    _HAS_PASSLIB = True
except Exception:
    _HAS_PASSLIB = False

try:
    import jwt
    _HAS_PYJWT = True
except Exception:
    _HAS_PYJWT = False


# OWASP recommendation for PBKDF2-HMAC-SHA256
PBKDF2_ITERATIONS = 600000


def _hash_pbkdf2(password: str, salt: Optional[str] = None, iterations: int = PBKDF2_ITERATIONS) -> str:
    """Standard-library PBKDF2-HMAC-SHA256 password hashing with 600,000 iterations."""
    if not salt:
        salt = os.urandom(16).hex()
    hashed = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        iterations,
    ).hex()
    return f"pbkdf2:sha256:{iterations}${salt}${hashed}"


def _verify_pbkdf2(password: str, hashed_password: str) -> bool:
    """Verifies a standard-library PBKDF2 hash, dynamically respecting the recorded iteration count."""
    try:
        parts = hashed_password.split("$")
        if len(parts) != 3:
            return False
        
        prefix = parts[0]
        salt = parts[1]
        
        # Extract iterations if specified, e.g. pbkdf2:sha256:600000
        iterations = PBKDF2_ITERATIONS
        if ":" in prefix:
            prefix_tokens = prefix.split(":")
            if len(prefix_tokens) >= 3 and prefix_tokens[2].isdigit():
                iterations = int(prefix_tokens[2])

        expected_hash = _hash_pbkdf2(password, salt=salt, iterations=iterations)
        return hmac.compare_digest(hashed_password, expected_hash)
    except Exception:
        return False


def get_password_hash(password: str) -> str:
    """Generates a secure hash for a plain text password."""
    if _HAS_PASSLIB:
        try:
            return pwd_context.hash(password)
        except Exception:
            pass
    return _hash_pbkdf2(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plain text password against a stored hash."""
    if not plain_password or not hashed_password:
        return False
    if hashed_password.startswith("pbkdf2:"):
        return _verify_pbkdf2(plain_password, hashed_password)
    if _HAS_PASSLIB:
        try:
            return pwd_context.verify(plain_password, hashed_password)
        except Exception:
            pass
    return False


def create_access_token(
    subject: Union[str, Any],
    expires_delta: Optional[timedelta] = None,
    extra_claims: Optional[dict] = None,
) -> str:
    """Encodes a JWT access token with expiration and subject claims."""
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )

    payload = {
        "exp": int(expire.timestamp()),
        "iat": int(datetime.now(timezone.utc).timestamp()),
        "sub": str(subject),
    }
    if extra_claims:
        payload.update(extra_claims)

    if _HAS_PYJWT:
        return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)

    # Standard HS256 JWT encoder fallback
    header = {"alg": settings.JWT_ALGORITHM, "typ": "JWT"}
    header_b64 = base64.urlsafe_b64encode(json.dumps(header).encode()).decode().rstrip("=")
    payload_b64 = base64.urlsafe_b64encode(json.dumps(payload).encode()).decode().rstrip("=")
    signature = hmac.new(
        settings.JWT_SECRET_KEY.encode(),
        f"{header_b64}.{payload_b64}".encode(),
        hashlib.sha256,
    ).digest()
    sig_b64 = base64.urlsafe_b64encode(signature).decode().rstrip("=")
    return f"{header_b64}.{payload_b64}.{sig_b64}"


def decode_access_token(token: str) -> Optional[dict]:
    """Decodes and verifies a JWT token. Returns payload dict or None if invalid/expired."""
    try:
        if _HAS_PYJWT:
            return jwt.decode(
                token,
                settings.JWT_SECRET_KEY,
                algorithms=[settings.JWT_ALGORITHM],
            )

        # Standard HS256 JWT decoder fallback
        parts = token.split(".")
        if len(parts) != 3:
            return None
        header_b64, payload_b64, sig_b64 = parts
        expected_sig = hmac.new(
            settings.JWT_SECRET_KEY.encode(),
            f"{header_b64}.{payload_b64}".encode(),
            hashlib.sha256,
        ).digest()
        actual_sig = base64.urlsafe_b64decode(sig_b64 + "=" * (-len(sig_b64) % 4))
        if not hmac.compare_digest(expected_sig, actual_sig):
            return None
        payload_json = base64.urlsafe_b64decode(payload_b64 + "=" * (-len(payload_b64) % 4)).decode()
        payload = json.loads(payload_json)
        if payload.get("exp") and payload["exp"] < time.time():
            return None
        return payload
    except Exception:
        return None
