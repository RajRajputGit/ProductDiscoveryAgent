import re
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
import structlog
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

from config.settings import get_settings
from shared.schemas import ShoppingQuery, ValidatedProduct
from shared.exceptions import QueryParsingError

logger = structlog.get_logger("services.llm")


class LLMQueryParseSchema(BaseModel):
    """Schema for OpenAI structured completion parsing."""
    product: str = Field(description="Core product noun, e.g. coat, sweater, jacket, shoes")
    material: Optional[str] = Field(default=None, description="Material, e.g. cotton, wool, leather")
    min_price: Optional[float] = Field(default=None, description="Minimum price if specified")
    max_price: Optional[float] = Field(default=None, description="Maximum budget price")
    sizes: List[str] = Field(default_factory=list, description="Target sizes, e.g. ['M', 'L']")
    category: Optional[str] = Field(default=None, description="Broader category, e.g. clothing, footwear")
    sites: List[str] = Field(default_factory=lambda: ["amazon", "ebay", "walmart"])
    rating_requirement: Optional[float] = Field(default=None, description="Min rating if specified")
    color: Optional[str] = Field(default=None, description="Color preference, e.g. black, blue")
    gender: Optional[str] = Field(default=None, description="Gender, e.g. men, women, unisex")


def deterministic_query_parser(query_str: str) -> ShoppingQuery:
    """Deterministic rule-based query parser used when LLM is unavailable or in offline demo mode."""
    text = query_str.lower()

    # 1. Price extraction (e.g. under $100, below 80 dollars, max 50, < 70, negative amounts)
    max_price = None
    min_price = None

    price_under_match = re.search(
        r"(?:under|below|less than|max(?:imum)?|<=?)\s*\$?(-?[0-9]+(?:\.[0-9]+)?)(?:\s*(?:dollars|\$|usd))?",
        text
    )
    if not price_under_match:
        price_under_match = re.search(
            r"\$?(-?[0-9]+(?:\.[0-9]+)?)\s*(?:dollars|\$|usd)?\s*(?:or less|budget|max)",
            text
        )

    if price_under_match:
        try:
            max_price = float(price_under_match.group(1))
        except ValueError:
            pass

    price_over_match = re.search(
        r"(?:over|above|more than|min(?:imum)?|>=?)\s*\$?(-?[0-9]+(?:\.[0-9]+)?)(?:\s*(?:dollars|\$|usd))?",
        text
    )

    if price_over_match:
        try:
            min_price = float(price_over_match.group(1))
        except ValueError:
            pass

    # 2. Material extraction
    materials = ["cotton", "wool", "leather", "polyester", "silk", "linen", "fleece", "denim", "nylon", "cashmere"]
    detected_material = None
    for mat in materials:
        if re.search(rf"\b{mat}\b", text):
            detected_material = mat
            break

    # 3. Sizes extraction
    detected_sizes = []
    # Size patterns: "size m or l", "size 9", "medium", "large", "small", "xl"
    size_phrase_match = re.search(r"size\s+([a-z0-9\s/,]+)", text)
    if size_phrase_match:
        raw_sizes = size_phrase_match.group(1)
        # remove words like 'or', 'and'
        tokens = re.split(r"[\s/,]+|or|and", raw_sizes)
        for t in tokens:
            t = t.strip().upper()
            if t in ["XS", "S", "M", "L", "XL", "XXL", "XXXL"] or re.match(r"^\d+(?:\.\d+)?$", t):
                detected_sizes.append(t)
    else:
        # Check explicit keywords
        word_size_map = {
            "small": "S",
            "medium": "M",
            "large": "L",
            "x-large": "XL",
            "extra large": "XL",
        }
        for word, sz in word_size_map.items():
            if re.search(rf"\b{word}\b", text):
                detected_sizes.append(sz)

    # Deduplicate sizes preserving order
    seen_sizes = set()
    unique_sizes = []
    for s in detected_sizes:
        if s not in seen_sizes:
            seen_sizes.add(s)
            unique_sizes.append(s)

    # 4. Gender extraction
    gender = None
    if re.search(r"\b(?:men|men's|male)\b", text):
        gender = "men"
    elif re.search(r"\b(?:women|women's|female)\b", text):
        gender = "women"
    elif re.search(r"\b(?:kids|kid's|child|boy|girl)\b", text):
        gender = "kids"

    # 5. Color extraction
    colors = ["black", "white", "blue", "red", "green", "grey", "gray", "brown", "navy", "beige", "yellow"]
    detected_color = None
    for c in colors:
        if re.search(rf"\b{c}\b", text):
            detected_color = c
            break

    # 6. Sites extraction (only amazon, excluding blocked sites walmart and ebay)
    sites = ["amazon"]

    # 7. Product & Category
    product_keywords = [
        ("running shoes", "footwear"),
        ("shoes", "footwear"),
        ("sneakers", "footwear"),
        ("boots", "footwear"),
        ("coat", "outerwear"),
        ("jacket", "outerwear"),
        ("sweater", "apparel"),
        ("hoodie", "apparel"),
        ("shirt", "apparel"),
        ("t-shirt", "apparel"),
        ("pants", "apparel"),
        ("jeans", "apparel"),
    ]
    detected_product = "item"
    detected_category = "general"
    for prod_name, cat in product_keywords:
        if prod_name in text:
            detected_product = prod_name
            detected_category = cat
            break

    return ShoppingQuery(
        product=detected_product,
        material=detected_material,
        min_price=min_price,
        max_price=max_price,
        sizes=unique_sizes,
        category=detected_category,
        sites=sites,
        color=detected_color,
        gender=gender,
    )


class LLMService:
    """Service encapsulating LLM interactions with OpenAI and graceful fallbacks."""

    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        settings = get_settings()
        self.api_key = api_key or settings.openai_api_key
        self.model = model or settings.openai_model
        self.client = None

        if self.api_key:
            try:
                from openai import OpenAI
                self.client = OpenAI(api_key=self.api_key)
                logger.info("llm_service_initialized", model=self.model)
            except Exception as e:
                logger.warning("llm_service_init_failed", error=str(e))
                self.client = None
        else:
            logger.info("llm_service_running_in_deterministic_mode", reason="no_api_key_provided")

    @retry(
        stop=stop_after_attempt(2),
        wait=wait_exponential(multiplier=1, min=1, max=4),
        retry=retry_if_exception_type(Exception),
        reraise=False
    )
    def parse_query(self, query_str: str) -> ShoppingQuery:
        """Parse natural language shopping query into structured ShoppingQuery contract."""
        if not self.client:
            logger.debug("using_deterministic_parser", query=query_str)
            return deterministic_query_parser(query_str)

        system_prompt = (
            "You are an expert e-commerce query parser. Extract structured shopping criteria "
            "from the user prompt into JSON. Adhere strictly to the requested schema. "
            "Extract the core product noun, material, price constraints, target sizes, "
            "color, gender, and requested sites (default to amazon, ebay, walmart if unmentioned)."
        )

        try:
            completion = self.client.beta.chat.completions.parse(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": query_str},
                ],
                response_format=LLMQueryParseSchema,
                temperature=0.0,
            )
            parsed_result = completion.choices[0].message.parsed
            if not parsed_result:
                raise QueryParsingError("LLM returned empty parsed result")

            return ShoppingQuery(
                product=parsed_result.product,
                material=parsed_result.material,
                min_price=parsed_result.min_price,
                max_price=parsed_result.max_price,
                sizes=parsed_result.sizes,
                category=parsed_result.category,
                sites=[s for s in (parsed_result.sites or ["amazon"]) if s not in ["walmart", "ebay"]] or ["amazon"],
                rating_requirement=parsed_result.rating_requirement,
                color=parsed_result.color,
                gender=parsed_result.gender,
            )
        except Exception as e:
            logger.warning("llm_parse_failed_falling_back_to_deterministic", error=str(e))
            return deterministic_query_parser(query_str)

    def explain_recommendation(
        self,
        query: ShoppingQuery,
        best_product: ValidatedProduct,
        top_candidates: List[ValidatedProduct]
    ) -> str:
        """Generate human-readable explainability for the top-ranked recommendation."""
        # 1. Deterministic high-quality fallback explanation generator
        def _generate_rule_based_explanation() -> str:
            p = best_product.product
            reasons = []

            # Material explainability
            if query.material:
                if best_product.material_score >= 1.0:
                    reasons.append(f"it exactly matches your desired {query.material} material (score: {best_product.material_score:.1f})")
                elif best_product.material_score >= 0.7:
                    reasons.append(f"it features a {p.material or query.material + ' blend'} (score: {best_product.material_score:.1f})")

            # Budget explainability
            if query.max_price:
                diff = query.max_price - p.price
                if diff > 0:
                    reasons.append(f"is priced at ${p.price:.2f}, saving ${diff:.2f} under your ${query.max_price:.2f} budget")
                else:
                    reasons.append(f"is priced exactly at your ${query.max_price:.2f} limit")
            else:
                reasons.append(f"is competitively priced at ${p.price:.2f}")

            # Size availability
            if query.sizes:
                common_sizes = [s for s in query.sizes if s in p.sizes]
                if common_sizes:
                    reasons.append(f"verifiably supports your target size(s): {', '.join(common_sizes)}")

            # Shipping
            if p.shipping_cost == 0:
                reasons.append("offers free shipping")
            else:
                reasons.append(f"has low shipping of ${p.shipping_cost:.2f}")

            # Rating
            if p.rating:
                reasons.append(f"maintains a strong customer satisfaction rating of {p.rating:.1f}/5.0")

            reason_str = ", ".join(reasons)
            return (
                f"Recommended as the #{1} choice (Composite Score: {best_product.final_score:.2f}) on {p.source.title()} "
                f"because {reason_str}. It outperforms {len(top_candidates) - 1} other validated alternatives across material quality, price headroom, and shipping value."
            )

        if not self.client:
            return _generate_rule_based_explanation()

        # If LLM client is available:
        system_prompt = (
            "You are an explainable AI shopping advisor. Explain concisely and convincingly why the chosen product "
            "was ranked #1 based purely on the provided scores, price, material match, shipping, and rating. "
            "Do not contradict the data. Output 2-3 sentences explaining the decision."
        )

        user_content = (
            f"User Requirements: Product={query.product}, Material={query.material}, "
            f"Max Price=${query.max_price}, Sizes={query.sizes}\n\n"
            f"Selected Best Product:\n"
            f"Title: {best_product.product.title}\n"
            f"Source: {best_product.product.source}\n"
            f"Price: ${best_product.product.price}\n"
            f"Material: {best_product.product.material}\n"
            f"Sizes: {best_product.product.sizes}\n"
            f"Rating: {best_product.product.rating}\n"
            f"Shipping: ${best_product.product.shipping_cost}\n"
            f"Final Score: {best_product.final_score:.2f}\n"
            f"Scores Breakdown: Material={best_product.material_score:.2f}, Price={best_product.price_score:.2f}, "
            f"Shipping={best_product.shipping_score:.2f}, Rating={best_product.rating_score:.2f}"
        )

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_content},
                ],
                max_tokens=150,
                temperature=0.3,
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            logger.warning("llm_explanation_generation_failed_using_fallback", error=str(e))
            return _generate_rule_based_explanation()
