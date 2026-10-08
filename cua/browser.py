import asyncio
from typing import Optional
import structlog
from playwright.async_api import (
    async_playwright,
    Playwright,
    Browser,
    BrowserContext,
    Page,
    Error as PlaywrightError
)

from config.settings import get_settings
from shared.exceptions import BrowserExecutionError

logger = structlog.get_logger("cua.browser")


class BrowserManager:
    """Manages the Playwright browser lifecycle, context, pages, and timeouts."""

    USER_AGENT = (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    )

    def __init__(self, headless: Optional[bool] = None, page_timeout: Optional[int] = None):
        settings = get_settings()
        self.headless = headless if headless is not None else settings.headless
        self.page_timeout = page_timeout if page_timeout is not None else settings.page_timeout
        self.playwright: Optional[Playwright] = None
        self.browser: Optional[Browser] = None
        self.context: Optional[BrowserContext] = None

    async def start(self) -> "BrowserManager":
        """Initialize playwright and launch browser."""
        try:
            self.playwright = await async_playwright().start()
            self.browser = await self.playwright.chromium.launch(
                headless=self.headless,
                slow_mo=250 if not self.headless else 0,
                args=[
                    "--no-sandbox",
                    "--disable-setuid-sandbox",
                    "--disable-dev-shm-usage",
                    "--disable-blink-features=AutomationControlled",
                ],
            )
            self.context = await self.browser.new_context(
                user_agent=self.USER_AGENT,
                locale="en-US",
                viewport={"width": 1280, "height": 800},
                device_scale_factor=1,
                extra_http_headers={
                    "Accept-Language": "en-US,en;q=0.9",
                    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
                    "sec-ch-ua": '"Chromium";v="124", "Not-A.Brand";v="99"',
                    "sec-ch-ua-mobile": "?0",
                    "sec-ch-ua-platform": '"macOS"',
                    "sec-fetch-dest": "document",
                    "sec-fetch-mode": "navigate",
                    "sec-fetch-site": "none",
                    "sec-fetch-user": "?1",
                    "upgrade-insecure-requests": "1",
                },
            )
            await self.context.add_init_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
            self.context.set_default_timeout(self.page_timeout)

            logger.info("browser_manager_started", headless=self.headless)
            return self
        except Exception as e:
            logger.error("browser_start_failed", error=str(e))
            await self.close()
            raise BrowserExecutionError(f"Failed to launch browser: {e}") from e

    async def new_page(self) -> Page:
        """Create a new page in the managed context."""
        if not self.context:
            raise BrowserExecutionError("Browser context is not initialized. Call start() first.")
        page = await self.context.new_page()
        page.set_default_timeout(self.page_timeout)
        return page

    async def close(self) -> None:
        """Safely clean up pages, context, browser, and playwright instance."""
        try:
            if self.context:
                await self.context.close()
                self.context = None
            if self.browser:
                await self.browser.close()
                self.browser = None
            if self.playwright:
                await self.playwright.stop()
                self.playwright = None
            logger.info("browser_manager_closed")
        except Exception as e:
            logger.warning("browser_close_warning", error=str(e))

    async def __aenter__(self) -> "BrowserManager":
        return await self.start()

    async def __aexit__(self, exc_type, exc_val, exc_tb) -> None:
        await self.close()
