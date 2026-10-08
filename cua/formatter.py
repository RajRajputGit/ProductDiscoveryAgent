import re
from typing import Any, Dict, List, Optional
import structlog
from shared.schemas import Product

logger = structlog.get_logger("cua.formatter")


class ProductFormatter:
    """Normalizes raw website scraping dictionaries into strict Product schema contracts."""

    BASE_DOMAINS = {
        "amazon": "https://www.amazon.com",
        "ebay": "https://www.ebay.com",
        "walmart": "https://www.walmart.com",
    }

    def format_product(self, raw_data: Dict[str, Any], default_source: str = "web") -> Optional[Product]:
        """Convert a single raw extracted product dictionary into a validated Product object."""
        try:
            source = str(raw_data.get("source") or default_source).lower()
            title = self._clean_string(raw_data.get("title"))
            if not title:
                logger.debug("skipping_product_missing_title", raw_data=raw_data)
                return None

            price = self._parse_price(raw_data.get("price"))
            if price is None:
                logger.debug("skipping_product_missing_price", title=title)
                return None

            currency = self._parse_currency(raw_data.get("currency") or raw_data.get("price"))
            sizes = self._normalize_sizes(raw_data.get("sizes"))
            material = self._clean_material(raw_data.get("material") or raw_data.get("description"))
            rating = self._parse_rating(raw_data.get("rating"))
            shipping_cost = self._parse_shipping(raw_data.get("shipping_cost"))
            url = self._normalize_url(raw_data.get("url"), source)
            raw_img = raw_data.get("image_url") or raw_data.get("image") or raw_data.get("thumbnail") or raw_data.get("img")
            image_url = self._normalize_image_url(raw_img, title, source)
            availability = self._parse_availability(raw_data.get("availability"))
            description = self._clean_string(raw_data.get("description"))

            return Product(
                title=title,
                price=round(price, 2),
                currency=currency,
                sizes=sizes,
                material=material,
                rating=rating,
                shipping_cost=shipping_cost,
                source=source,
                url=url,
                availability=availability,
                image_url=image_url,
                description=description,
                raw_data=raw_data,
            )

        except Exception as e:
            logger.warning("product_formatting_failed", error=str(e), raw_title=raw_data.get("title"))
            return None

    def format_batch(self, raw_products: List[Dict[str, Any]], source: str = "web") -> List[Product]:
        """Format an entire list of raw product dictionaries."""
        formatted: List[Product] = []
        for item in raw_products:
            prod = self.format_product(item, default_source=source)
            if prod is not None:
                formatted.append(prod)
        logger.info("products_formatted", source=source, input_count=len(raw_products), formatted_count=len(formatted))
        return formatted

    def _clean_string(self, val: Any) -> Optional[str]:
        if val is None:
            return None
        s = str(val).strip()
        # Remove repeated internal whitespace
        s = re.sub(r"\s+", " ", s)
        return s if s else None

    def _parse_price(self, val: Any) -> Optional[float]:
        if val is None:
            return None
        if isinstance(val, (int, float)):
            return float(val) if val >= 0 else None

        text = str(val).replace(",", "").strip()
        # Look for numbers like 89.99, $89.99, 89
        match = re.search(r"\$?([0-9]+(?:\.[0-9]{1,2})?)", text)
        if match:
            try:
                return float(match.group(1))
            except ValueError:
                return None
        return None

    def _parse_currency(self, val: Any) -> str:
        if not val:
            return "USD"
        text = str(val).upper()
        if "USD" in text or "$" in text:
            return "USD"
        if "EUR" in text or "€" in text:
            return "EUR"
        if "GBP" in text or "£" in text:
            return "GBP"
        return "USD"

    def _normalize_sizes(self, val: Any) -> List[str]:
        if not val:
            return []
        if isinstance(val, list):
            res = []
            for item in val:
                s = str(item).strip().upper()
                if s:
                    res.append(s)
            return res

        text = str(val).upper()
        # Replace common separators
        tokens = re.split(r"[,/|;]|\s+OR\s+", text)
        sizes = []
        for tok in tokens:
            tok = tok.strip()
            # Standard garment sizes or shoe numeric sizes
            if tok in ["XXS", "XS", "S", "M", "L", "XL", "2XL", "XXL", "3XL", "XXXL"]:
                sizes.append(tok)
            elif re.match(r"^\d+(?:\.\d+)?$", tok):
                sizes.append(tok)
            elif tok:
                sizes.append(tok)
        return sizes

    def _clean_material(self, val: Any) -> Optional[str]:
        if not val:
            return None
        text = str(val).lower()
        known = [
            "cotton blend", "cotton", "wool blend", "wool",
            "leather", "polyester", "linen", "fleece", "denim", "silk", "nylon"
        ]
        for k in known:
            if k in text:
                return k
        # Fallback to cleaned short string if provided directly
        cleaned = re.sub(r"[^\w\s-]", "", text).strip()
        return cleaned[:30] if cleaned else None

    def _parse_rating(self, val: Any) -> Optional[float]:
        if val is None:
            return None
        if isinstance(val, (int, float)):
            return round(float(val), 2)
        text = str(val).strip()
        # Handle "4.5 out of 5", "4.5/5", "4.5"
        match = re.search(r"([0-5](?:\.[0-9]+)?)", text)
        if match:
            try:
                rating = float(match.group(1))
                return round(rating, 2)
            except ValueError:
                pass
        return None

    def _parse_shipping(self, val: Any) -> float:
        if val is None:
            return 0.0
        if isinstance(val, (int, float)):
            return float(val)
        text = str(val).lower().strip()
        if "free" in text or text in ["0", "$0", "$0.00"]:
            return 0.0
        match = re.search(r"\$?([0-9]+(?:\.[0-9]{1,2})?)", text)
        if match:
            try:
                return float(match.group(1))
            except ValueError:
                return 0.0
        return 0.0

    def _normalize_url(self, val: Any, source: str) -> str:
        if not val:
            return self.BASE_DOMAINS.get(source, "https://example.com")
        url_str = str(val).strip()
        if url_str.startswith("http://") or url_str.startswith("https://"):
            return url_str
        base = self.BASE_DOMAINS.get(source, "https://example.com")
        if url_str.startswith("/"):
            return f"{base}{url_str}"
        return f"{base}/{url_str}"

    def _parse_availability(self, val: Any) -> bool:
        if val is None:
            return True
        if isinstance(val, bool):
            return val
        text = str(val).lower().strip()
        if any(neg in text for neg in ["out of stock", "unavailable", "sold out", "false"]):
            return False
        return True

    def _normalize_image_url(self, val: Any, title: str, source: str) -> Optional[str]:
        """Normalize extracted image URLs and provide high-definition category image fallbacks."""
        if val:
            url_str = str(val).strip()
            # If srcset passed, extract first URL token
            if "," in url_str and (" " in url_str or "http" in url_str):
                first_part = url_str.split(",")[0].strip().split(" ")[0].strip()
                if first_part.startswith("http") or first_part.startswith("//"):
                    url_str = first_part
            if url_str.startswith("//"):
                return f"https:{url_str}"
            if url_str.startswith("http://") or url_str.startswith("https://"):
                # Ignore 1x1 transparent tracking pixels / spacer GIFs
                if "spacer.gif" not in url_str and "1x1" not in url_str:
                    return url_str
            elif url_str.startswith("/"):
                base = self.BASE_DOMAINS.get(source, "https://images.unsplash.com")
                return f"{base}{url_str}"

        # Context-aware fallback image based on product keywords
        t = title.lower()
        if any(w in t for w in ["windbreaker", "parka", "overcoat", "peacoat", "trench", "coat", "jacket"]):
            return "https://images.unsplash.com/photo-1544923246-77307dd654cb?auto=format&fit=crop&w=600&q=80"
        elif any(w in t for w in ["sweater", "cardigan", "pullover", "hoodie", "fleece", "knit"]):
            return "https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=600&q=80"
        elif any(w in t for w in ["shoe", "sneaker", "boot", "runner", "footwear"]):
            return "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80"
        elif any(w in t for w in ["shirt", "tee", "top", "blouse", "polo"]):
            return "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80"
        elif any(w in t for w in ["pant", "trouser", "jean", "denim", "short"]):
            return "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=600&q=80"
        else:
            return "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=600&q=80"

