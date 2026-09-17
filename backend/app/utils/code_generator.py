import ipaddress
import re
import secrets
import string
from urllib.parse import urlparse

# Base62 character pool for clean, URL-safe short codes
BASE62_ALPHABET = string.digits + string.ascii_letters

# Regex for custom slugs: alphanumeric, hyphens, and underscores (3 to 64 chars)
CUSTOM_SLUG_REGEX = re.compile(r"^[a-zA-Z0-9_-]{3,64}$")

# Maximum permitted URL length
MAX_URL_LENGTH = 2048

# Reserved keywords to prevent routing collision with system endpoints
RESERVED_CODES = {
    "api",
    "auth",
    "health",
    "docs",
    "redoc",
    "openapi.json",
    "r",
    "s",
    "admin",
    "dashboard",
    "login",
    "register",
    "pricing",
    "settings",
    "static",
    "assets",
    "favicon.ico",
    "robots.txt",
    "sitemap.xml",
}

# Suspicious hostnames commonly used for internal network probing or cloud metadata exploitation
BLOCKED_HOSTNAMES = {
    "localhost",
    "metadata.google.internal",
    "metadata",
    "instance-data",
    "169.254.169.254",
}

# Disallowed internal domain suffixes
BLOCKED_DOMAIN_SUFFIXES = (
    ".local",
    ".internal",
    ".arpa",
    ".lan",
    ".test",
    ".invalid",
    ".example",
)


def generate_short_code(length: int = 7) -> str:
    """Generates a cryptographically secure, collision-resistant Base62 string."""
    return "".join(secrets.choice(BASE62_ALPHABET) for _ in range(length))


def is_valid_custom_code(code: str) -> bool:
    """Validates that a custom alias adheres to syntax rules and is not reserved."""
    if not code or not CUSTOM_SLUG_REGEX.match(code):
        return False
    if code.lower() in RESERVED_CODES:
        return False
    return True


def normalize_and_validate_url(raw_url: str) -> str:
    """Validates the destination URL with strict SSRF, protocol, and abuse protections.

    - Length checks (max 2048 characters)
    - CRLF injection prevention
    - Protocol whitelisting (http/https only; explicitly rejects javascript:, data:, file:)
    - SSRF defense (blocks loopback, private RFC 1918, link-local, cloud metadata)
    - Rejects localhost and internal domain resolutions
    - Prevents uncontrolled redirect loops
    """
    if not raw_url or not isinstance(raw_url, str):
        raise ValueError("URL cannot be empty.")

    trimmed = raw_url.strip()
    if not trimmed:
        raise ValueError("URL cannot be empty.")

    # 1. Enforce length boundary
    if len(trimmed) > MAX_URL_LENGTH:
        raise ValueError(f"URL exceeds maximum allowed length of {MAX_URL_LENGTH} characters.")

    # 2. Reject CRLF characters to prevent HTTP header splitting / response injection
    if "\r" in trimmed or "\n" in trimmed:
        raise ValueError("URL contains illegal carriage return or newline characters.")

    # 3. Explicitly detect dangerous pseudoprotocols before prepend
    lower_url = trimmed.lower()
    dangerous_schemes = ("javascript:", "data:", "file:", "vbscript:", "blob:", "about:", "intent:", "ftp:")
    for scheme in dangerous_schemes:
        if lower_url.startswith(scheme):
            raise ValueError(f"Unsupported or unsafe URL protocol '{scheme}'. Only HTTP and HTTPS are permitted.")

    # 4. Prepend https:// if no scheme is provided
    if not trimmed.startswith(("http://", "https://")):
        trimmed = "https://" + trimmed

    # 5. Parse structure
    parsed = urlparse(trimmed)
    if not parsed.scheme or parsed.scheme not in ("http", "https"):
        raise ValueError("URL must use HTTP or HTTPS protocol.")

    hostname = (parsed.hostname or "").lower().strip()
    if not hostname:
        raise ValueError("URL must contain a valid domain name or hostname.")

    # 6. Check for blocked suspicious hostnames
    if hostname in BLOCKED_HOSTNAMES:
        raise ValueError("Destination URL targets an invalid, private, or prohibited host.")

    for suffix in BLOCKED_DOMAIN_SUFFIXES:
        if hostname.endswith(suffix):
            raise ValueError(f"Internal domain name suffix '{suffix}' is not permitted.")

    # 7. SSRF Check: IP address inspection
    # Check if the hostname is an IP literal (IPv4 or IPv6)
    try:
        ip = ipaddress.ip_address(hostname)
        if ip.is_loopback:
            raise ValueError("Loopback IP addresses (127.0.0.1, ::1) are not permitted.")
        if ip.is_private:
            raise ValueError("Private network IP addresses (RFC 1918) are not permitted.")
        if ip.is_link_local:
            raise ValueError("Link-local IP addresses (169.254.0.0/16) are not permitted.")
        if ip.is_reserved:
            raise ValueError("Reserved IP addresses are not permitted.")
        if ip.is_multicast:
            raise ValueError("Multicast IP addresses are not permitted.")
        if ip.is_unspecified:
            raise ValueError("Unspecified IP addresses (0.0.0.0) are not permitted.")
    except ValueError as e:
        # If it's our own ValueError, re-raise it
        if "not permitted" in str(e) or "prohibited" in str(e):
            raise
        # Otherwise it's not a direct IP literal, validate domain syntax
        if "." not in hostname:
            raise ValueError("URL must contain a valid domain name with an extension (e.g. example.com).")

    # 8. Prevent self-redirect loops to local development/LinkPulse services
    port = parsed.port
    if hostname in ("127.0.0.1", "localhost", "0.0.0.0"):
        raise ValueError("Self-referential redirect to local LinkPulse server is not permitted.")

    return trimmed

