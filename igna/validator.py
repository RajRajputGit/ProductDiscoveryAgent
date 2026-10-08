import re
from typing import List, Optional, Tuple
import structlog
from rapidfuzz import fuzz

from config.settings import get_settings
from shared.schemas import ShoppingQuery, Product, ValidatedProduct

logger = structlog.get_logger("igna.validator")


class ProductValidator:
    """Validates products against hard requirements and calculates soft component scores."""

    def __init__(self, low_shipping_threshold: Optional[float] = None):
        settings = get_settings()
        self.low_shipping_threshold = low_shipping_threshold or settings.low_shipping_threshold

    def validate_product(self, product: Product, query: ShoppingQuery) -> ValidatedProduct:
        """Validate a single product against ShoppingQuery rules."""
        reasons: List[str] = []
        hard_passed = True

        # 1. Hard Filter: Availability
        if not product.availability:
            hard_passed = False
            reasons.append("Product is out of stock / unavailable.")

        # 2. Hard Filter: Max Price Budget
        if query.max_price is not None:
            if product.price > query.max_price:
                hard_passed = False
                reasons.append(
                    f"Price (${product.price:.2f}) exceeds maximum budget (${query.max_price:.2f})."
                )

        # 3. Hard Filter: Min Price
        if query.min_price is not None:
            if product.price < query.min_price:
                hard_passed = False
                reasons.append(
                    f"Price (${product.price:.2f}) is below minimum requirement (${query.min_price:.2f})."
                )

        # 4. Hard Filter: Size Availability
        if query.sizes:
            prod_sizes_upper = [s.strip().upper() for s in product.sizes]
            req_sizes_upper = [s.strip().upper() for s in query.sizes]

            if not prod_sizes_upper:
                # If product lists no sizes at all, it lacks required size variant
                hard_passed = False
                reasons.append(
                    f"Requested sizes {req_sizes_upper} but product lists no size options."
                )
            else:
                has_matching_size = any(sz in prod_sizes_upper for sz in req_sizes_upper)
                if not has_matching_size:
                    hard_passed = False
                    reasons.append(
                        f"Requested size(s) {req_sizes_upper} not available in {prod_sizes_upper}."
                    )

        # 5. Hard Filter: Category / Core Product relevance
        if query.product:
            target_prod = query.product.lower().strip()
            title_lower = product.title.lower()

            # Word boundary token matching: e.g. "coat" matches "coat" or "coats"
            words = [w for w in target_prod.split() if len(w) > 2]
            synonyms = {
                "coat": ["jacket", "parka", "overcoat", "outerwear", "windbreaker", "trench", "blazer", "vest", "fleece"],
                "jacket": ["coat", "parka", "windbreaker", "outerwear", "bomber", "vest", "fleece"],
                "shoes": ["shoe", "sneakers", "sneaker", "runners", "runner", "footwear", "boots", "boot", "trainers", "trainer", "athletic", "walking", "cushioning"],
                "running shoes": [
                    "shoe", "shoes", "sneakers", "sneaker", "runners", "runner", "footwear",
                    "trainers", "trainer", "athletic", "jogging", "walking", "cushioning", "cushion",
                    "road", "trail", "foam", "mesh", "strider", "sprint"
                ],
                "sweater": ["pullover", "cardigan", "knit", "jumper", "crewneck", "hoodie", "sweatshirt", "fleece"],
                "underwear": ["boxer", "boxers", "brief", "briefs", "trunks", "underpants", "undershirt"],
                "pants": ["trousers", "jeans", "slacks", "chinos", "joggers", "sweatpants"],
                "shirt": ["t-shirt", "tee", "top", "button-down", "polo"],
            }
            allowed_tokens = set(words)
            for w in words:
                allowed_tokens.update(synonyms.get(w, []))
            if target_prod in synonyms:
                allowed_tokens.update(synonyms[target_prod])

            # Stem trailing 's' to match both singular and plural forms (e.g. shoe <-> shoes)
            regex_patterns = []
            for token in allowed_tokens:
                base = token[:-1] if token.endswith("s") and len(token) > 3 and not token.endswith("ss") else token
                regex_patterns.append(rf"\b{re.escape(base)}s?\b")

            has_word_match = any(
                re.search(pat, title_lower) for pat in regex_patterns
            )

            # High token set similarity
            token_ratio = fuzz.token_set_ratio(target_prod, title_lower)

            if not has_word_match and token_ratio < 45:
                hard_passed = False
                reasons.append(
                    f"Product title '{product.title}' does not match requested item '{query.product}'."
                )

        # Calculate Soft Component Scores regardless of pass/fail (for explainability)
        mat_score, mat_reason = self._score_material(product, query)
        price_score, price_reason = self._score_price(product, query)
        shipping_score, shipping_reason = self._score_shipping(product)
        rating_score, rating_reason = self._score_rating(product)

        if hard_passed:
            reasons.append("All hard filters passed.")
            reasons.extend([mat_reason, price_reason, shipping_reason, rating_reason])
        else:
            logger.info(
                "product_rejected",
                title=product.title,
                source=product.source,
                reasons=reasons
            )

        return ValidatedProduct(
            product=product,
            hard_filter_passed=hard_passed,
            material_score=round(mat_score, 4),
            price_score=round(price_score, 4),
            shipping_score=round(shipping_score, 4),
            rating_score=round(rating_score, 4),
            final_score=0.0,  # Computed in RankingEngine
            validation_reasons=reasons,
        )

    def validate_products(
        self,
        products: List[Product],
        query: ShoppingQuery
    ) -> Tuple[List[ValidatedProduct], List[ValidatedProduct]]:
        """Validate a list of products. Returns (valid_products, rejected_products)."""
        logger.info("validation_started", total_products=len(products))
        valid_items: List[ValidatedProduct] = []
        rejected_items: List[ValidatedProduct] = []

        for prod in products:
            val_prod = self.validate_product(prod, query)
            if val_prod.hard_filter_passed:
                valid_items.append(val_prod)
            else:
                rejected_items.append(val_prod)

        logger.info(
            "validation_completed",
            total=len(products),
            valid_count=len(valid_items),
            rejected_count=len(rejected_items)
        )
        return valid_items, rejected_items

    def _score_material(self, product: Product, query: ShoppingQuery) -> Tuple[float, str]:
        """Score material match: exact match = 1.0, blend / partial = 0.7, other = 0.0."""
        if not query.material:
            return 1.0, "Material: not specified (1.0 default)"

        target = query.material.lower().strip()
        mat_text = (product.material or "").lower()
        title_text = product.title.lower()
        combined_text = f"{mat_text} {title_text}"

        # 1. Check blend first (e.g. "cotton blend", "blend", "poly-cotton", "cotton/polyester")
        blend_pattern = rf"\b{target}\s+blend\b|\bblend\s+{target}\b|\b{target}/|\b[a-z]+-{target}\b|\b{target}-[a-z]+\b"
        if re.search(blend_pattern, combined_text):
            return 0.7, f"Material: partial/blend match for '{target}' (score: 0.7)"

        # 2. Check exact match
        exact_pattern = rf"\b100%\s*{target}\b|\bpure\s*{target}\b|\b{target}\b"
        if re.search(exact_pattern, combined_text):
            # If word blend is also explicitly nearby, it's blend, else pure
            if "blend" in combined_text:
                return 0.7, f"Material: partial/blend match for '{target}' (score: 0.7)"
            return 1.0, f"Material: exact match for '{target}' (score: 1.0)"

        # 3. Fuzzy partial match if target in text
        if target in combined_text:
            return 0.7, f"Material: partial match for '{target}' (score: 0.7)"

        return 0.0, f"Material: no match for '{target}' (score: 0.0)"

    def _score_price(self, product: Product, query: ShoppingQuery) -> Tuple[float, str]:
        """Score price: 1 - (price / max_price), clamped to [0, 1]."""
        if query.max_price is None or query.max_price <= 0:
            return 1.0, "Price: budget unconstrained (score: 1.0)"

        raw = 1.0 - (product.price / query.max_price)
        score = max(0.0, min(1.0, raw))
        return score, f"Price: ${product.price:.2f} relative to ${query.max_price:.2f} (score: {score:.2f})"

    def _score_shipping(self, product: Product) -> Tuple[float, str]:
        """Score shipping: free = 1.0, low (<= threshold) = 0.5, high = 0.2."""
        if product.shipping_cost <= 0.0:
            return 1.0, "Shipping: free shipping (score: 1.0)"
        elif product.shipping_cost <= self.low_shipping_threshold:
            return 0.5, f"Shipping: low cost (${product.shipping_cost:.2f}) (score: 0.5)"
        else:
            return 0.2, f"Shipping: high cost (${product.shipping_cost:.2f}) (score: 0.2)"

    def _score_rating(self, product: Product) -> Tuple[float, str]:
        """Score rating: rating / 5.0, missing fallback = 0.6 (3.0/5)."""
        if product.rating is None:
            return 0.6, "Rating: unrated fallback (score: 0.6)"
        score = max(0.0, min(1.0, product.rating / 5.0))
        return score, f"Rating: {product.rating:.1f}/5.0 (score: {score:.2f})"
