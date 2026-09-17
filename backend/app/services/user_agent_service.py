"""User-Agent detection service for LinkPulse.

Provides modular parsing of Device Type (Mobile, Desktop, Tablet),
Browser, and Operating System without external dependencies.
"""
from typing import Dict


class UserAgentService:
    @staticmethod
    def detect_device_type(user_agent: str) -> str:
        """Detects whether the client is Mobile, Desktop, Tablet, or Bot."""
        if not user_agent:
            return "Desktop"

        ua = user_agent.lower()

        # Bot detection
        if any(keyword in ua for keyword in [
            "bot", "spider", "crawl", "slurp", "mediapartners", "curl", "postman", "python", "httpclient", "wget"
        ]):
            return "Bot"

        # Tablet detection (prioritize before mobile as some tablets include "Mobile" or "Android")
        if any(keyword in ua for keyword in [
            "ipad", "tablet", "kindle", "silk", "playbook", "sm-t", "gt-p", "tab"
        ]):
            return "Tablet"

        # Mobile detection
        if any(keyword in ua for keyword in [
            "mobile", "iphone", "ipod", "android", "blackberry", "windows phone", "opera mini", "iemobile"
        ]):
            return "Mobile"

        return "Desktop"

    @staticmethod
    def detect_browser(user_agent: str) -> str:
        """Detects browser family (Chrome, Safari, Firefox, Edge, Opera, etc.)."""
        if not user_agent:
            return "Unknown"

        ua = user_agent.lower()

        # Check in order of specificity to avoid false positives (e.g. Edge/Opera include Chrome & Safari tokens)
        if any(bot in ua for bot in ["bot", "spider", "crawl", "curl", "python", "postman"]):
            return "Bot/Crawler"
        if "edg/" in ua or "edge/" in ua:
            return "Edge"
        if "opr/" in ua or "opera" in ua:
            return "Opera"
        if "brave" in ua:
            return "Brave"
        if "vivaldi" in ua:
            return "Vivaldi"
        if "firefox/" in ua or "fxios/" in ua:
            return "Firefox"
        if "chrome/" in ua or "crios/" in ua:
            return "Chrome"
        if "safari/" in ua and "chrome" not in ua and "android" not in ua:
            return "Safari"
        if "msie" in ua or "trident" in ua:
            return "Internet Explorer"

        return "Other"

    @staticmethod
    def detect_os(user_agent: str) -> str:
        """Detects client Operating System (Windows, macOS, Linux, iOS, Android, etc.)."""
        if not user_agent:
            return "Other"

        ua = user_agent.lower()

        if "windows" in ua:
            return "Windows"
        if any(keyword in ua for keyword in ["iphone", "ipad", "ipod"]):
            return "iOS"
        if "macintosh" in ua or "mac os" in ua:
            return "macOS"
        if "android" in ua:
            return "Android"
        if "linux" in ua:
            return "Linux"
        if "cros" in ua or "chromebook" in ua:
            return "ChromeOS"

        return "Other"

    @classmethod
    def parse(cls, user_agent: str) -> Dict[str, str]:
        """Parses full user-agent string into modular device, browser, and OS tokens."""
        ua_clean = (user_agent or "").strip()
        return {
            "device_type": cls.detect_device_type(ua_clean),
            "browser": cls.detect_browser(ua_clean),
            "operating_system": cls.detect_os(ua_clean),
        }
