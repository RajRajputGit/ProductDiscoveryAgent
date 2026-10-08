from typing import Any, Dict, List, Optional
import structlog
from shared.schemas import ShoppingQuery, ValidatedProduct, RecommendationResult
from services.llm import LLMService

logger = structlog.get_logger("igna.recommender")


class Recommender:
    """Designates best recommendation from ranked candidates and provides explainability."""

    def __init__(self, llm_service: Optional[LLMService] = None):
        self.llm_service = llm_service or LLMService()

    def recommend(
        self,
        query: ShoppingQuery,
        top_products: List[ValidatedProduct],
        execution_summary: Optional[Dict[str, Any]] = None,
    ) -> RecommendationResult:
        """Create RecommendationResult with top products and explanation."""
        summary = execution_summary or {}

        if not top_products:
            explanation = (
                f"No suitable products matching '{query.product}' passed all requirements "
                f"(max price ${query.max_price or 'unlimited'}, sizes {query.sizes}). "
                "Consider expanding budget or target sizes."
            )
            logger.warning("recommendation_empty", query=query.product)
            return RecommendationResult(
                top_products=[],
                best_product=None,
                explanation=explanation,
                query=query,
                execution_summary=summary,
            )

        best_product = top_products[0]

        explanation = self.llm_service.explain_recommendation(
            query=query,
            best_product=best_product,
            top_candidates=top_products,
        )

        logger.info(
            "recommendation_generated",
            best_product=best_product.product.title,
            source=best_product.product.source,
            final_score=best_product.final_score
        )

        return RecommendationResult(
            top_products=top_products,
            best_product=best_product,
            explanation=explanation,
            query=query,
            execution_summary=summary,
        )
