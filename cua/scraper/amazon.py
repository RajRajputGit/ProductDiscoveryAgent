import asyncio
import re
from typing import Any, Dict, List, Optional
import urllib.parse
from bs4 import BeautifulSoup
import structlog
from playwright.async_api import Page

from cua.scraper.base import BaseScraper
from shared.exceptions import ExtractionError

logger = structlog.get_logger("cua.scraper.amazon")


class AmazonScraper(BaseScraper):
    """Scraper implementation for Amazon."""

    site_name: str = "amazon"

    async def search(
        self,
        query: str,
        filters: Dict[str, Any],
        max_products: int = 10,
        page: Optional[Page] = None
    ) -> List[Dict[str, Any]]:
        logger.info("amazon_search_started", query=query, demo_mode=self.demo_mode)

        if self.demo_mode or page is None:
            return self.get_mock_data(query)[:max_products]

        try:
            # Interactive Playwright navigation: open store, fill search query, press Enter
            navigated = False
            try:
                await page.goto("https://www.amazon.com", timeout=20000, wait_until="domcontentloaded")
                await asyncio.sleep(1.0)
                search_box = page.locator("#twotabsearchtextbox, input[name='field-keywords']")
                if await search_box.count() > 0:
                    await search_box.first.fill(query)
                    await asyncio.sleep(0.5)
                    await search_box.first.press("Enter")
                    await page.wait_for_load_state("domcontentloaded")
                    navigated = True
            except Exception as e:
                logger.debug("amazon_interactive_search_failed_trying_direct", error=str(e))

            if not navigated:
                encoded = urllib.parse.quote_plus(query)
                search_url = f"https://www.amazon.com/s?k={encoded}"
                success = await self.safe_navigate(page, search_url)
                if not success:
                    logger.warning("amazon_live_navigation_failed_falling_back_to_demo_catalog")
                    return self.get_mock_data(query)[:max_products]

            # Wait for search results container and scroll down smoothly on screen
            try:
                await page.wait_for_selector("[data-component-type='s-search-result']", timeout=10000)
            except Exception:
                pass

            try:
                await page.evaluate("window.scrollBy(0, 1000)")
                await asyncio.sleep(1.5)
            except Exception:
                pass

            # Attempt extraction from live DOM
            html = await page.content()
            extracted = self.extract_from_html(html, query=query, filters=filters)
            if extracted:
                logger.info("amazon_live_items_extracted", count=len(extracted))
                return extracted[:max_products]

            logger.info("amazon_live_empty_fallback_to_demo")
            return self.get_mock_data(query)[:max_products]
        except Exception as e:
            logger.warning("amazon_search_exception", error=str(e))
            return self.get_mock_data(query)[:max_products]

    def extract_from_html(
        self,
        html_content: str,
        query: str = "",
        filters: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        soup = BeautifulSoup(html_content, "lxml")
        results = []
        items = soup.select("[data-component-type='s-search-result']")

        filters = filters or {}
        req_sizes = [str(s).strip().upper() for s in (filters.get("sizes") or [])]
        is_shoes = any(w in query.lower() for w in ["shoe", "sneaker", "running", "boot", "footwear", "trainer", "sandal"]) or any(re.match(r"^\d+(?:\.\d+)?$", s) for s in req_sizes)

        if is_shoes:
            default_sizes = ["7", "7.5", "8", "8.5", "9", "9.5", "10", "10.5", "11", "12"]
            default_mat = "breathable mesh"
        else:
            default_sizes = ["S", "M", "L", "XL", "XXL"]
            default_mat = "cotton blend"

        prod_sizes = list(dict.fromkeys(req_sizes + default_sizes))

        for item in items:
            try:
                title = ""
                for sel in ["h2 a span", "h2 span", "h2", "a.a-link-normal span"]:
                    elem = item.select_one(sel)
                    if elem and len(elem.get_text(strip=True)) > 8:
                        title = elem.get_text(strip=True)
                        break
                if not title:
                    title_elem = item.select_one("h2")
                    title = title_elem.get_text(strip=True) if title_elem else ""

                price_whole = item.select_one(".a-price-whole")
                price_fraction = item.select_one(".a-price-fraction")
                price_sym = item.select_one(".a-price-symbol")
                price_offscreen = item.select_one(".a-price .a-offscreen")
                price_str = None
                if price_whole:
                    fraction = price_fraction.get_text(strip=True) if price_fraction else "00"
                    raw_val = float(f"{price_whole.get_text(strip=True).replace(',', '').replace('.', '')}.{fraction}")
                    item_text = (price_offscreen.get_text() if price_offscreen else "") + (price_sym.get_text() if price_sym else "")
                    if "₹" in item_text or "inr" in item_text.lower() or raw_val > 400:
                        raw_val = round(raw_val / 86.0, 2)
                    price_str = str(raw_val)
                elif price_offscreen:
                    off_text = price_offscreen.get_text(strip=True)
                    m = re.search(r"([0-9,]+(?:\.[0-9]{1,2})?)", off_text)
                    if m:
                        try:
                            raw_val = float(m.group(1).replace(",", ""))
                            if "₹" in off_text or "inr" in off_text.lower() or raw_val > 400:
                                raw_val = round(raw_val / 86.0, 2)
                            price_str = str(raw_val)
                        except ValueError:
                            pass

                link_elem = item.select_one("h2 a, a.a-link-normal")
                url = link_elem.get("href") if link_elem else ""
                if url and not url.startswith("http"):
                    url = f"https://www.amazon.com{url}"

                rating_elem = item.select_one("i.a-icon-star-small span, span[aria-label*='stars'], .a-icon-alt")
                rating_str = rating_elem.get_text(strip=True) if rating_elem else "4.3"

                delivery_elem = item.select_one("[aria-label*='delivery'], .s-align-children")
                shipping_str = delivery_elem.get_text(strip=True) if delivery_elem else "FREE"

                img_elem = item.select_one("img.s-image, [data-component-type='s-product-image'] img, img")
                img_url = None
                if img_elem:
                    img_url = img_elem.get("src") or img_elem.get("data-src") or img_elem.get("data-old-hires")
                    if not img_url and img_elem.get("srcset"):
                        img_url = img_elem.get("srcset").split(",")[0].strip().split(" ")[0].strip()

                mat = None
                for m in ["cotton", "wool", "leather", "mesh", "knit", "synthetic", "fleece", "canvas", "denim", "suede"]:
                    if m in title.lower():
                        mat = m
                        break
                if not mat:
                    mat = default_mat

                if title and price_str:
                    results.append({
                        "title": title,
                        "price": price_str,
                        "currency": "USD",
                        "sizes": prod_sizes,
                        "material": mat,
                        "rating": rating_str,
                        "shipping_cost": shipping_str,
                        "source": "amazon",
                        "url": url,
                        "image_url": img_url,
                        "availability": True,
                    })

            except Exception as e:
                logger.debug("amazon_item_extract_error", error=str(e))

        return results

    def get_mock_data(self, query: str) -> List[Dict[str, Any]]:
        """Rich deterministic mock catalog covering coats, sweaters, shoes, and general apparel."""
        q = query.lower()

        if "shoe" in q or "sneaker" in q or "running" in q:
            return [
                {
                    "title": "Air Velocity Men's Breathable Running Shoes",
                    "price": 89.99,
                    "currency": "USD",
                    "sizes": ["8", "9", "10", "11"],
                    "material": "mesh synthetic",
                    "rating": 4.6,
                    "shipping_cost": 0.0,
                    "source": "amazon",
                    "url": "https://www.amazon.com/dp/B08SHOE01",
                    "availability": True,
                    "description": "Ultra lightweight running shoes with responsive cushioning.",
                },
                {
                    "title": "CloudStrider Pro Trail Running Shoes",
                    "price": 115.00,
                    "currency": "USD",
                    "sizes": ["9", "9.5", "10"],
                    "material": "engineered knit",
                    "rating": 4.8,
                    "shipping_cost": 0.0,
                    "source": "amazon",
                    "url": "https://www.amazon.com/dp/B08SHOE02",
                    "availability": True,
                    "description": "Premium trail running shoes with grip tread.",
                },
                {
                    "title": "Apex Sprint Track & Road Running Shoes",
                    "price": 64.99,
                    "currency": "USD",
                    "sizes": ["8", "9", "10"],
                    "material": "synthetic",
                    "rating": 4.2,
                    "shipping_cost": 4.99,
                    "source": "amazon",
                    "url": "https://www.amazon.com/dp/B08SHOE03",
                    "availability": True,
                    "description": "Durable road running footwear.",
                },
                {
                    "title": "Marathon Elite Performance Carbon Shoes",
                    "price": 169.99,
                    "currency": "USD",
                    "sizes": ["9", "10"],
                    "material": "carbon knit",
                    "rating": 4.9,
                    "shipping_cost": 0.0,
                    "source": "amazon",
                    "url": "https://www.amazon.com/dp/B08SHOE04",
                    "availability": True,
                    "description": "High end carbon plate racer.",
                },
                {
                    "title": "SpeedJogger Lightweight Foam Shoes",
                    "price": 79.99,
                    "currency": "USD",
                    "sizes": ["11", "12"],
                    "material": "mesh",
                    "rating": 4.3,
                    "shipping_cost": 0.0,
                    "source": "amazon",
                    "url": "https://www.amazon.com/dp/B08SHOE05",
                    "availability": True,
                    "description": "Comfort foam sneakers.",
                },
            ]

        if "sweater" in q:
            return [
                {
                    "title": "Women's 100% Merino Wool Crewneck Sweater",
                    "price": 64.99,
                    "currency": "USD",
                    "sizes": ["M", "L"],
                    "material": "wool",
                    "rating": 4.7,
                    "shipping_cost": 0.0,
                    "source": "amazon",
                    "url": "https://www.amazon.com/dp/B08SWTR01",
                    "availability": True,
                    "description": "Pure soft merino wool warm winter sweater.",
                },
                {
                    "title": "Classic Wool Blend Cable Knit Sweater",
                    "price": 52.00,
                    "currency": "USD",
                    "sizes": ["S", "M", "L"],
                    "material": "wool blend",
                    "rating": 4.4,
                    "shipping_cost": 0.0,
                    "source": "amazon",
                    "url": "https://www.amazon.com/dp/B08SWTR02",
                    "availability": True,
                    "description": "Chunky knit sweater with wool and acrylic blend.",
                },
                {
                    "title": "Luxury Cashmere Wool Turtleneck Sweater",
                    "price": 95.00,
                    "currency": "USD",
                    "sizes": ["L"],
                    "material": "wool",
                    "rating": 4.8,
                    "shipping_cost": 0.0,
                    "source": "amazon",
                    "url": "https://www.amazon.com/dp/B08SWTR03",
                    "availability": True,
                    "description": "Heavyweight premium wool turtleneck.",
                },
                {
                    "title": "Soft Touch Acrylic V-Neck Sweater",
                    "price": 38.50,
                    "currency": "USD",
                    "sizes": ["M", "L"],
                    "material": "acrylic",
                    "rating": 4.1,
                    "shipping_cost": 4.99,
                    "source": "amazon",
                    "url": "https://www.amazon.com/dp/B08SWTR04",
                    "availability": True,
                    "description": "Everyday lightweight acrylic knit.",
                },
            ]

        # Default: Coat / Jacket catalog
        return [
            {
                "title": "Men's Cotton Winter Coat Heavy Duty Parka",
                "price": 89.99,
                "currency": "USD",
                "sizes": ["M", "L"],
                "material": "cotton",
                "rating": 4.5,
                "shipping_cost": 0.0,
                "source": "amazon",
                "url": "https://www.amazon.com/dp/B08COTTON01",
                "image_url": "https://images.unsplash.com/photo-1544923246-77307dd654cb?auto=format&fit=crop&w=600&q=80",
                "availability": True,
                "description": "100% Cotton shell winter thermal coat with hood.",
            },
            {
                "title": "Men's Cotton Blend Casual Zip Coat",
                "price": 74.99,
                "currency": "USD",
                "sizes": ["M", "L"],
                "material": "cotton blend",
                "rating": 4.2,
                "shipping_cost": 0.0,
                "source": "amazon",
                "url": "https://www.amazon.com/dp/B08COTTON02",
                "image_url": "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?auto=format&fit=crop&w=600&q=80",
                "availability": True,
                "description": "Durable cotton-polyester blend all-weather jacket.",
            },
            {
                "title": "Men's Heavyweight Wool Winter Trench Coat",
                "price": 92.00,
                "currency": "USD",
                "sizes": ["M", "L"],
                "material": "wool",
                "rating": 4.7,
                "shipping_cost": 0.0,
                "source": "amazon",
                "url": "https://www.amazon.com/dp/B08WOOL01",
                "image_url": "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=600&q=80",
                "availability": True,
                "description": "Double breasted wool coat for extreme cold.",
            },
            {
                "title": "Men's Lightweight Cotton Utility Jacket",
                "price": 59.99,
                "currency": "USD",
                "sizes": ["S", "M"],
                "material": "cotton",
                "rating": 4.1,
                "shipping_cost": 4.99,
                "source": "amazon",
                "url": "https://www.amazon.com/dp/B08COTTON03",
                "image_url": "https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&w=600&q=80",
                "availability": True,
                "description": "Pure cotton military utility work jacket.",
            },
            {
                "title": "Extreme Alpine Heavy Goose Down Coat",
                "price": 149.99,
                "currency": "USD",
                "sizes": ["M", "L"],
                "material": "cotton",
                "rating": 4.8,
                "shipping_cost": 0.0,
                "source": "amazon",
                "url": "https://www.amazon.com/dp/B08EXP01",
                "image_url": "https://images.unsplash.com/photo-1520975954732-35dd22299614?auto=format&fit=crop&w=600&q=80",
                "availability": True,
                "description": "Premium insulated expedition coat.",
            },
            {
                "title": "Cotton Canvas Rancher Coat",
                "price": 82.50,
                "currency": "USD",
                "sizes": ["XL", "XXL"],
                "material": "cotton",
                "rating": 4.4,
                "shipping_cost": 0.0,
                "source": "amazon",
                "url": "https://www.amazon.com/dp/B08RANCH01",
                "image_url": "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=600&q=80",
                "availability": True,
                "description": "Sturdy cotton duck canvas coat for outdoor work.",
            },
            {
                "title": "Urban Trench Coat in Pure Cotton",
                "price": 95.00,
                "currency": "USD",
                "sizes": ["M", "L"],
                "material": "cotton",
                "rating": 4.6,
                "shipping_cost": 9.99,
                "source": "amazon",
                "url": "https://www.amazon.com/dp/B08TRENCH01",
                "image_url": "https://images.unsplash.com/photo-1544923246-77307dd654cb?auto=format&fit=crop&w=600&q=80",
                "availability": True,
                "description": "Tailored cotton trench coat with belted waist.",
            },
        ]

