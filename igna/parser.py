from typing import Optional
import structlog
from shared.schemas import ShoppingQuery
from shared.exceptions import QueryParsingError
from services.llm import LLMService

logger = structlog.get_logger("igna.parser")


class QueryParser:
    """Parses natural language queries into validated ShoppingQuery contracts."""

    def __init__(self, llm_service: Optional[LLMService] = None):
        self.llm_service = llm_service or LLMService()

    def parse(self, user_query: str) -> ShoppingQuery:
        """Parse, validate, and apply deterministic defaults to shopping query."""
        if not user_query or not user_query.strip():
            raise QueryParsingError("User query cannot be empty or whitespace.")

        cleaned_query = user_query.strip()
        logger.info("parsing_query_started", query=cleaned_query)

        parsed: ShoppingQuery = self.llm_service.parse_query(cleaned_query)

        # Apply deterministic defaults & validations
        if not parsed.product or parsed.product.strip() == "":
            raise QueryParsingError("Failed to identify a target product in query.")

        # Ensure valid price boundaries
        if parsed.max_price is not None and parsed.max_price <= 0:
            raise QueryParsingError(f"Invalid maximum price: ${parsed.max_price}. Must be greater than 0.")

        if parsed.min_price is not None and parsed.min_price < 0:
            raise QueryParsingError(f"Invalid minimum price: ${parsed.min_price}. Cannot be negative.")

        if parsed.min_price is not None and parsed.max_price is not None:
            if parsed.min_price > parsed.max_price:
                raise QueryParsingError(
                    f"Min price (${parsed.min_price}) cannot exceed max price (${parsed.max_price})."
                )

        # Default sites if empty
        if not parsed.sites:
            parsed.sites = ["amazon", "ebay", "walmart"]
        else:
            parsed.sites = [s.lower().strip() for s in parsed.sites if s.strip()]

        logger.info(
            "query_parsed",
            product=parsed.product,
            material=parsed.material,
            max_price=parsed.max_price,
            min_price=parsed.min_price,
            sizes=parsed.sizes,
            sites=parsed.sites,
            gender=parsed.gender,
            color=parsed.color,
        )

        return parsed
