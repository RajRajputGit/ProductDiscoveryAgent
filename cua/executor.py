from typing import Any, Dict, List, Optional, Tuple
import structlog
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

from config.settings import get_settings
from shared.schemas import ExecutionTask, Product
from shared.exceptions import BrowserExecutionError, ExtractionError
from cua.browser import BrowserManager
from cua.formatter import ProductFormatter
from cua.scraper import BaseScraper, AmazonScraper, EbayScraper, WalmartScraper

logger = structlog.get_logger("cua.executor")


class BrowserExecutor:
    """Executes execution tasks across website scrapers with error isolation and formatting."""

    def __init__(
        self,
        browser_manager: Optional[BrowserManager] = None,
        formatter: Optional[ProductFormatter] = None,
        demo_mode: Optional[bool] = None,
    ):
        settings = get_settings()
        self.demo_mode = demo_mode if demo_mode is not None else settings.demo_mode
        self.browser_manager = browser_manager
        self.formatter = formatter or ProductFormatter()

        # Registry of site scrapers
        self.scrapers: Dict[str, BaseScraper] = {
            "amazon": AmazonScraper(demo_mode=self.demo_mode),
            "ebay": EbayScraper(demo_mode=self.demo_mode),
            "walmart": WalmartScraper(demo_mode=self.demo_mode),
        }

    async def execute_tasks(
        self,
        tasks: List[ExecutionTask]
    ) -> Tuple[List[Product], Dict[str, Any]]:
        """Execute all execution tasks across target sites."""
        logger.info("execution_started", total_tasks=len(tasks), demo_mode=self.demo_mode)
        all_products: List[Product] = []
        site_counts: Dict[str, int] = {}
        failed_sites: List[str] = []

        # If live mode, initialize browser manager if not provided
        own_browser = False
        manager = self.browser_manager
        if not self.demo_mode and manager is None:
            own_browser = True
            manager = BrowserManager(headless=False)
            try:
                await manager.start()
            except Exception as e:
                logger.error("browser_initialization_failed_falling_back_to_mock", error=str(e))
                self.demo_mode = True
                manager = None

        try:
            for task in tasks:
                site = task.site.lower()
                scraper = self.scrapers.get(site)
                if not scraper:
                    logger.warning("unsupported_site_skipped", site=site)
                    failed_sites.append(site)
                    site_counts[site] = 0
                    continue

                logger.info("site_started", site=site, query=task.search_query)

                page = None
                if not self.demo_mode and manager:
                    try:
                        page = await manager.new_page()
                    except Exception as e:
                        logger.warning("page_creation_failed", site=site, error=str(e))

                try:
                    raw_items = await scraper.search(
                        query=task.search_query,
                        filters=task.filters,
                        max_products=task.max_products,
                        page=page
                    )
                    logger.info("products_extracted", site=site, count=len(raw_items))

                    # Format and normalize products
                    formatted_products = self.formatter.format_batch(raw_items, source=site)
                    all_products.extend(formatted_products)
                    site_counts[site] = len(formatted_products)

                except Exception as e:
                    logger.error("site_failed", site=site, error=str(e))
                    failed_sites.append(site)
                    site_counts[site] = 0
                finally:
                    if page:
                        try:
                            await page.close()
                        except Exception:
                            pass

        finally:
            if own_browser and manager:
                await manager.close()

        summary = {
            "site_counts": site_counts,
            "failed_sites": failed_sites,
            "total_collected": len(all_products),
        }
        logger.info("execution_completed", **summary)
        return all_products, summary
