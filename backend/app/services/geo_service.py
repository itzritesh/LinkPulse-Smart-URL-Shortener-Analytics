"""Approximate Geolocation service for LinkPulse.

Performs coarse location detection (Country, Region/State, City)
while preserving visitor privacy. Does not expose or store exact GPS coordinates.
"""
import ipaddress
from functools import lru_cache
from typing import Optional, Dict, Any
import httpx
from app.utils.logger import logger


class GeoService:
    # Common ISO country code mapping for CDN edge headers
    COUNTRY_NAMES = {
        "US": "United States",
        "GB": "United Kingdom",
        "CA": "Canada",
        "AU": "Australia",
        "DE": "Germany",
        "FR": "France",
        "IN": "India",
        "JP": "Japan",
        "BR": "Brazil",
        "SG": "Singapore",
        "NL": "Netherlands",
        "SE": "Sweden",
    }

    @staticmethod
    def is_private_or_loopback(ip_str: Optional[str]) -> bool:
        """Determines if an IP is local, loopback, or private."""
        if not ip_str or ip_str.lower() in ("testclient", "localhost", "none", ""):
            return True
        try:
            ip_obj = ipaddress.ip_address(ip_str.strip())
            return ip_obj.is_private or ip_obj.is_loopback or ip_obj.is_reserved or ip_obj.is_link_local
        except ValueError:
            return True

    @classmethod
    def from_headers(cls, headers: Optional[Dict[str, str]]) -> Optional[Dict[str, str]]:
        """Extracts location info provided directly by Cloudflare, AWS CloudFront, or reverse proxies."""
        if not headers:
            return None

        # Normalize header keys to lowercase
        norm_headers = {k.lower(): v for k, v in headers.items()}

        country_code = (
            norm_headers.get("cf-ipcountry")
            or norm_headers.get("x-country-code")
            or norm_headers.get("cloudfront-viewer-country")
            or norm_headers.get("x-vercel-ip-country")
        )
        region = (
            norm_headers.get("cf-region")
            or norm_headers.get("x-region")
            or norm_headers.get("cf-region-code")
            or norm_headers.get("x-vercel-ip-country-region")
        )
        city = (
            norm_headers.get("cf-ipcity")
            or norm_headers.get("x-city")
            or norm_headers.get("x-vercel-ip-city")
        )

        if country_code and country_code != "XX":
            country_name = cls.COUNTRY_NAMES.get(country_code.upper(), country_code.upper())
            return {
                "country": country_name,
                "region": region or "Unknown Region",
                "city": city or "Unknown City",
            }
        return None

    @classmethod
    @lru_cache(maxsize=1024)
    def _fetch_approximate_geo(cls, clean_ip: str) -> Dict[str, str]:
        """Queries fast approximate public geolocation with short timeout and in-memory caching."""
        try:
            with httpx.Client(timeout=1.5) as client:
                response = client.get(f"http://ip-api.com/json/{clean_ip}?fields=status,country,regionName,city")
                if response.status_code == 200:
                    data = response.json()
                    if data.get("status") == "success":
                        return {
                            "country": data.get("country") or "Unknown Country",
                            "region": data.get("regionName") or "Unknown Region",
                            "city": data.get("city") or "Unknown City",
                        }
        except Exception as exc:
            logger.debug(f"External geo lookup skipped for {clean_ip}: {exc}")

        return {
            "country": "Unknown Country",
            "region": "Unknown Region",
            "city": "Unknown City",
        }

    @classmethod
    def lookup_approximate_location(
        cls,
        ip_address: Optional[str],
        headers: Optional[Dict[str, str]] = None,
    ) -> Dict[str, str]:
        """Resolves coarse, approximate location while maintaining high performance and privacy.

        Never blocks redirect execution. Returns Country, Region, and City.
        """
        # 1. Check reverse-proxy / CDN edge headers first
        header_geo = cls.from_headers(headers)
        if (
            header_geo
            and header_geo.get("region") != "Unknown Region"
            and header_geo.get("city") != "Unknown City"
        ):
            return header_geo

        # 2. Check for private, development, or loopback IPs
        if cls.is_private_or_loopback(ip_address):
            if header_geo:
                return header_geo
            return {
                "country": "Local / Development",
                "region": "Internal Network",
                "city": "Localhost",
            }

        clean_ip = (ip_address or "").strip()

        # 3. If headers are missing region or city, query IP geolocation
        ip_geo = cls._fetch_approximate_geo(clean_ip) if clean_ip else {}

        country = (
            (header_geo.get("country") if header_geo and header_geo.get("country") != "Unknown Country" else None)
            or ip_geo.get("country")
            or "Unknown Country"
        )
        region = (
            (header_geo.get("region") if header_geo and header_geo.get("region") != "Unknown Region" else None)
            or ip_geo.get("region")
            or "Unknown Region"
        )
        city = (
            (header_geo.get("city") if header_geo and header_geo.get("city") != "Unknown City" else None)
            or ip_geo.get("city")
            or "Unknown City"
        )

        return {
            "country": country,
            "region": region,
            "city": city,
        }
