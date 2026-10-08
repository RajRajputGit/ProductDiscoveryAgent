from typing import List, Optional
import structlog
from rapidfuzz import fuzz

from config.settings import get_settings
from shared.schemas import ValidatedProduct

logger = structlog.get_logger("igna.ranker")


class RankingEngine:
    """Calculates weighted deterministic scores and selects top overall products across sites."""

    def __init__(
        self,
        material_weight: Optional[float] = None,
        price_weight: Optional[float] = None,
        shipping_weight: Optional[float] = None,
        rating_weight: Optional[float] = None,
        top_k: Optional[int] = None,
    ):
        settings = get_settings()
        self.material_weight = material_weight if material_weight is not None else settings.material_weight
        self.price_weight = price_weight if price_weight is not None else settings.price_weight
        self.shipping_weight = shipping_weight if shipping_weight is not None else settings.shipping_weight
        self.rating_weight = rating_weight if rating_weight is not None else settings.rating_weight
        self.top_k = top_k if top_k is not None else settings.top_k

    def calculate_score(self, item: ValidatedProduct) -> float:
        """Calculate weighted score using the exact formula."""
        score = (
            (item.material_score * self.material_weight)
            + (item.price_score * self.price_weight)
            + (item.shipping_score * self.shipping_weight)
            + (item.rating_score * self.rating_weight)
        )
        return round(score, 4)

    def deduplicate(
        self,
        products: List[ValidatedProduct],
        similarity_threshold: float = 88.0
    ) -> List[ValidatedProduct]:
        """Remove duplicate products across sites using RapidFuzz title similarity."""
        unique_items: List[ValidatedProduct] = []

        for candidate in products:
            is_dup = False
            for existing in unique_items:
                cand_title = candidate.product.title.lower()
                exist_title = existing.product.title.lower()

                similarity = fuzz.token_set_ratio(cand_title, exist_title)
                price_diff = abs(candidate.product.price - existing.product.price)

                # Consider duplicate if title is highly similar and price is within $5
                if similarity >= similarity_threshold and price_diff <= 5.0:
                    is_dup = True
                    # Keep the one with higher rating or lower price
                    logger.debug(
                        "duplicate_detected",
                        title1=candidate.product.title,
                        title2=existing.product.title,
                        similarity=similarity
                    )
                    break

            if not is_dup:
                unique_items.append(candidate)

        return unique_items

    def rank(
        self,
        validated_products: List[ValidatedProduct],
        top_k: Optional[int] = None
    ) -> List[ValidatedProduct]:
        """Deduplicate, compute final scores, and return top_k ranked products sorted descending."""
        k = top_k or self.top_k
        logger.info("ranking_started", input_count=len(validated_products), top_k=k)

        # 1. Deduplicate
        deduped = self.deduplicate(validated_products)

        # 2. Compute final scores
        for item in deduped:
            item.final_score = self.calculate_score(item)

        # 3. Sort descending by final_score, breaking ties with price_score and rating_score
        ranked = sorted(
            deduped,
            key=lambda x: (x.final_score, x.price_score, x.rating_score),
            reverse=True
        )

        top_selection = ranked[:k]

        logger.info(
            "ranking_completed",
            deduped_count=len(deduped),
            selected_count=len(top_selection),
            top_scores=[p.final_score for p in top_selection]
        )
        return top_selection
