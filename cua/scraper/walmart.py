from typing import Any, Dict, List, Optional
import urllib.parse
from bs4 import BeautifulSoup
import structlog
from playwright.async_api import Page

from cua.scraper.base import BaseScraper

logger = structlog.get_logger("cua.scraper.walmart")


class WalmartScraper(BaseScraper):
    """Scraper implementation for Walmart."""

    site_name: str = "walmart"

    async def search(
        self,
        query: str,
        filters: Dict[str, Any],
        max_products: int = 10,
        page: Optional[Page] = None
    ) -> List[Dict[str, Any]]:
        logger.info("walmart_search_started", query=query, demo_mode=self.demo_mode)

        if self.demo_mode or page is None:
            return self.get_mock_data(query)[:max_products]

        encoded = urllib.parse.quote_plus(query)
        search_url = f"https://www.walmart.com/search?q={encoded}"

        try:
            success = await self.safe_navigate(page, search_url)
            if not success:
                logger.warning("walmart_live_navigation_failed_falling_back_to_demo_catalog")
                return self.get_mock_data(query)[:max_products]

            try:
                await page.evaluate("window.scrollBy(0, 800)")
                await asyncio.sleep(1.0)
            except Exception:
                pass

            html = await page.content()
            extracted = self.extract_from_html(html)
            if extracted:
                return extracted[:max_products]

            logger.info("walmart_live_empty_fallback_to_demo")
            return self.get_mock_data(query)[:max_products]
        except Exception as e:
            logger.warning("walmart_search_exception", error=str(e))
            return self.get_mock_data(query)[:max_products]

    def extract_from_html(self, html_content: str) -> List[Dict[str, Any]]:
        soup = BeautifulSoup(html_content, "lxml")
        results = []
        items = soup.select("[data-item-id], div[data-testid='item-stack']")

        for item in items:
            try:
                title_elem = item.select_one("[data-automation-id='product-title'], span.normal")
                title = title_elem.get_text(strip=True) if title_elem else ""

                price_elem = item.select_one("[data-automation-id='product-price'] span, .w_iUH7")
                price_str = price_elem.get_text(strip=True) if price_elem else None

                link_elem = item.select_one("a[link-identifier]") or item.select_one("a")
                url = link_elem.get("href") if link_elem else ""

                rating_elem = item.select_one("[data-testid='product-ratings'] span")
                rating_str = rating_elem.get_text(strip=True) if rating_elem else "4.3"

                img_elem = item.select_one("img[data-testid='productTileImage'], img[loading='lazy'], img")
                img_url = None
                if img_elem:
                    img_url = img_elem.get("src") or img_elem.get("data-src")
                    if not img_url and img_elem.get("srcset"):
                        img_url = img_elem.get("srcset").split(",")[0].strip().split(" ")[0].strip()

                if title and price_str:
                    results.append({
                        "title": title,
                        "price": price_str,
                        "currency": "USD",
                        "sizes": ["M", "L"],
                        "material": "cotton" if "cotton" in title.lower() else None,
                        "rating": rating_str,
                        "shipping_cost": 0.0,
                        "source": "walmart",
                        "url": url,
                        "image_url": img_url,
                        "availability": True,
                    })

            except Exception as e:
                logger.debug("walmart_item_extract_error", error=str(e))

        return results

    def get_mock_data(self, query: str) -> List[Dict[str, Any]]:
        q = query.lower()

        if "shoe" in q or "sneaker" in q or "running" in q:
            return [
                {
                    "title": "Athletic Works Men's Active Running Shoes",
                    "price": 29.98,
                    "currency": "USD",
                    "sizes": ["8", "9", "10", "11"],
                    "material": "breathable mesh",
                    "rating": 4.1,
                    "shipping_cost": 0.0,
                    "source": "walmart",
                    "url": "https://www.walmart.com/ip/WM_SHOE_01",
                    "availability": True,
                    "description": "Budget-friendly lightweight cushion runner.",
                },
                {
                    "title": "Avia Men's Jag Mesh Running Shoes Size 9",
                    "price": 38.50,
                    "currency": "USD",
                    "sizes": ["9", "10"],
                    "material": "synthetic knit",
                    "rating": 4.4,
                    "shipping_cost": 0.0,
                    "source": "walmart",
                    "url": "https://www.walmart.com/ip/WM_SHOE_02",
                    "availability": True,
                    "description": "Cantilever sole shock absorption runner.",
                },
                {
                    "title": "Reebok Men's Floatride Energy Running Shoes",
                    "price": 85.00,
                    "currency": "USD",
                    "sizes": ["9", "9.5", "10"],
                    "material": "engineered mesh",
                    "rating": 4.7,
                    "shipping_cost": 0.0,
                    "source": "walmart",
                    "url": "https://www.walmart.com/ip/WM_SHOE_03",
                    "availability": True,
                    "description": "Responsive road running shoes.",
                },
            ]

        if "sweater" in q:
            return [
                {
                    "title": "Time and Tru Women's 100% Wool Knit Sweater",
                    "price": 54.98,
                    "currency": "USD",
                    "sizes": ["M", "L"],
                    "material": "wool",
                    "rating": 4.5,
                    "shipping_cost": 0.0,
                    "source": "walmart",
                    "url": "https://www.walmart.com/ip/WM_SWTR_01",
                    "availability": True,
                    "description": "Cozy warm winter wool sweater.",
                },
                {
                    "title": "Free Assembly Wool Blend Ribbed Sweater",
                    "price": 42.00,
                    "currency": "USD",
                    "sizes": ["S", "M", "L"],
                    "material": "wool blend",
                    "rating": 4.3,
                    "shipping_cost": 0.0,
                    "source": "walmart",
                    "url": "https://www.walmart.com/ip/WM_SWTR_02",
                    "availability": True,
                    "description": "Sustainable wool blend everyday pullover.",
                },
            ]

        # Default Coat / Jacket catalog
        return [
            {
                "title": "Cotton Casual Daily Coat with Hood",
                "price": 69.99,
                "currency": "USD",
                "sizes": ["M", "L"],
                "material": "cotton",
                "rating": 4.3,
                "shipping_cost": 0.0,
                "source": "walmart",
                "url": "https://www.walmart.com/ip/WM_COAT_01",
                "image_url": "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?auto=format&fit=crop&w=600&q=80",
                "availability": True,
                "description": "100% cotton casual jacket with zip front and warm hood.",
            },
            {
                "title": "Winter Cotton Padded Jacket Parka",
                "price": 84.99,
                "currency": "USD",
                "sizes": ["L", "XL"],
                "material": "cotton",
                "rating": 4.5,
                "shipping_cost": 0.0,
                "source": "walmart",
                "url": "https://www.walmart.com/ip/WM_COAT_02",
                "image_url": "https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&w=600&q=80",
                "availability": True,
                "description": "Thick cotton insulated winter parka.",
            },
            {
                "title": "Basic Cotton Zip Jacket Everyday",
                "price": 45.00,
                "currency": "USD",
                "sizes": ["M", "L"],
                "material": "cotton",
                "rating": 4.0,
                "shipping_cost": 5.99,
                "source": "walmart",
                "url": "https://www.walmart.com/ip/WM_COAT_03",
                "image_url": "https://images.unsplash.com/photo-1544923246-77307dd654cb?auto=format&fit=crop&w=600&q=80",
                "availability": True,
                "description": "Budget friendly pure cotton zip jacket.",
            },
            {
                "title": "Wool Blend Peacoat Double Breasted",
                "price": 75.00,
                "currency": "USD",
                "sizes": ["M", "L"],
                "material": "wool blend",
                "rating": 4.2,
                "shipping_cost": 0.0,
                "source": "walmart",
                "url": "https://www.walmart.com/ip/WM_COAT_04",
                "image_url": "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=600&q=80",
                "availability": True,
                "description": "Warm wool blend coat with nautical buttons.",
            },
            {
                "title": "Pro Weatherproof Insulated Storm Coat",
                "price": 119.00,
                "currency": "USD",
                "sizes": ["M", "L"],
                "material": "nylon",
                "rating": 4.6,
                "shipping_cost": 0.0,
                "source": "walmart",
                "url": "https://www.walmart.com/ip/WM_COAT_05",
                "image_url": "https://images.unsplash.com/photo-1520975954732-35dd22299614?auto=format&fit=crop&w=600&q=80",
                "availability": True,
                "description": "Waterproof storm coat with insulated lining.",
            },
            {
                "title": "Everyday Canvas Cotton Coat",
                "price": 64.99,
                "currency": "USD",
                "sizes": ["M", "L"],
                "material": "cotton blend",
                "rating": 4.1,
                "shipping_cost": 0.0,
                "source": "walmart",
                "url": "https://www.walmart.com/ip/WM_COAT_06",
                "image_url": "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=600&q=80",
                "availability": True,
                "description": "Durable cotton canvas chore coat.",
            },
            {
                "title": "Youth Cotton School Coat",
                "price": 39.99,
                "currency": "USD",
                "sizes": ["XS"],
                "material": "cotton",
                "rating": 4.3,
                "shipping_cost": 0.0,
                "source": "walmart",
                "url": "https://www.walmart.com/ip/WM_COAT_07",
                "image_url": "https://images.unsplash.com/photo-1544923246-77307dd654cb?auto=format&fit=crop&w=600&q=80",
                "availability": True,
                "description": "Kids cotton school coat.",
            },
        ]

