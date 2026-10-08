from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional
import structlog
from playwright.async_api import Page
from bs4 import BeautifulSoup

from config.settings import get_settings
from shared.exceptions import ExtractionError

logger = structlog.get_logger("cua.scraper.base")


class BaseScraper(ABC):
    """Abstract base class for e-commerce site scrapers."""

    site_name: str = "base"

    def __init__(self, demo_mode: Optional[bool] = None):
        settings = get_settings()
        self.demo_mode = demo_mode if demo_mode is not None else settings.demo_mode

    @abstractmethod
    async def search(
        self,
        query: str,
        filters: Dict[str, Any],
        max_products: int = 10,
        page: Optional[Page] = None
    ) -> List[Dict[str, Any]]:
        """Perform search and return raw product dictionaries."""
        pass

    @abstractmethod
    def extract_from_html(self, html_content: str) -> List[Dict[str, Any]]:
        """Extract raw product items from HTML string."""
        pass

    @abstractmethod
    def get_mock_data(self, query: str) -> List[Dict[str, Any]]:
        """Return deterministic mock product data matching the query category."""
        pass

    async def safe_navigate(self, page: Page, url: str) -> bool:
        """Safely navigate to URL handling potential navigation timeouts and blocks."""
        try:
            logger.debug("navigating_to_url", site=self.site_name, url=url)
            response = await page.goto(url, wait_until="domcontentloaded", timeout=20000)
            if response and response.status >= 400:
                logger.warning("http_status_error", site=self.site_name, status=response.status)
                return False

            # Check for generic bot/captcha block pages without attempting bypass
            content = (await page.content()).lower()
            if any(term in content for term in ["captcha", "robot check", "verify you are human", "blocked", "access denied"]):
                logger.warning("bot_protection_detected", site=self.site_name)
                return False

            return True
        except Exception as e:
            logger.warning("navigation_failed", site=self.site_name, error=str(e))
            return False
