from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, field_validator


class ShoppingQuery(BaseModel):
    """User shopping requirements parsed from natural language."""
    product: str = Field(description="Core product noun, e.g. coat, sweater, shoes")
    material: Optional[str] = Field(default=None, description="Requested material, e.g. cotton, wool")
    min_price: Optional[float] = Field(default=None, description="Minimum price if specified")
    max_price: Optional[float] = Field(default=None, description="Maximum budget threshold")
    sizes: List[str] = Field(default_factory=list, description="Target size variants, e.g. ['M', 'L']")
    category: Optional[str] = Field(default=None, description="General category, e.g. outerwear, apparel, footwear")
    sites: List[str] = Field(
        default_factory=lambda: ["amazon"],
        description="Target e-commerce sites to search"
    )
    rating_requirement: Optional[float] = Field(default=None, description="Minimum required rating out of 5")
    color: Optional[str] = Field(default=None, description="Color preference, e.g. black, blue")
    gender: Optional[str] = Field(default=None, description="Gender target, e.g. men, women, unisex")

    @field_validator("sites", mode="before")
    @classmethod
    def validate_sites(cls, v: Any) -> List[str]:
        if not v:
            return ["amazon"]
        if isinstance(v, str):
            raw = [s.strip().lower() for s in v.split(",") if s.strip()]
        else:
            raw = [str(s).strip().lower() for s in v if str(s).strip()]
        filtered = [s for s in raw if s not in ["walmart", "ebay"]]
        return filtered if filtered else ["amazon"]

    @field_validator("sizes", mode="before")
    @classmethod
    def normalize_sizes(cls, v: Any) -> List[str]:
        if not v:
            return []
        if isinstance(v, str):
            # Split comma or or/slash
            parts = [p.strip().upper() for p in v.replace("/", ",").split(",") if p.strip()]
            return parts
        return [str(item).strip().upper() for item in v if str(item).strip()]


class ExecutionTask(BaseModel):
    """Deterministic browser execution instruction for a specific site."""
    site: str = Field(description="Target site identifier, e.g. amazon, ebay, walmart")
    search_query: str = Field(description="Optimized search query keyword string")
    filters: Dict[str, Any] = Field(default_factory=dict, description="Pre-filtering options (e.g. max_price)")
    max_products: int = Field(default=10, description="Max products to fetch from site")
    retry_count: int = Field(default=0, description="Allowed retry count")


class Product(BaseModel):
    """Normalized product data contract extracted from e-commerce sites."""
    title: str = Field(description="Product title")
    price: float = Field(description="Numerical product price")
    currency: str = Field(default="USD", description="Currency code (e.g. USD)")
    sizes: List[str] = Field(default_factory=list, description="Available product sizes")
    material: Optional[str] = Field(default=None, description="Detected or extracted material")
    rating: Optional[float] = Field(default=None, description="Product rating (0.0 to 5.0)")
    shipping_cost: float = Field(default=0.0, description="Shipping cost in currency")
    source: str = Field(description="Source store / site name")
    url: str = Field(description="Canonical or direct product URL")
    availability: bool = Field(default=True, description="Whether product is in stock")
    image_url: Optional[str] = Field(default=None, description="Product image URL")
    description: Optional[str] = Field(default=None, description="Product snippet or description")
    raw_data: Optional[Dict[str, Any]] = Field(default=None, description="Raw extraction payload for debugging")



class ValidatedProduct(BaseModel):
    """Product evaluated by IGNA validation and scoring rules."""
    product: Product
    hard_filter_passed: bool = Field(description="True if all hard constraints are satisfied")
    material_score: float = Field(default=0.0, description="Material match score [0.0 - 1.0]")
    price_score: float = Field(default=0.0, description="Price score [0.0 - 1.0]")
    shipping_score: float = Field(default=0.0, description="Shipping score [0.0 - 1.0]")
    rating_score: float = Field(default=0.0, description="Rating score [0.0 - 1.0]")
    final_score: float = Field(default=0.0, description="Weighted composite score [0.0 - 1.0]")
    validation_reasons: List[str] = Field(
        default_factory=list,
        description="List of validation decisions or rejection reasons"
    )


class RecommendationResult(BaseModel):
    """Final output presentation package containing top products and decision explainability."""
    top_products: List[ValidatedProduct] = Field(default_factory=list, description="Top ranked valid products")
    best_product: Optional[ValidatedProduct] = Field(default=None, description="Top ranked product")
    explanation: str = Field(description="Explainable recommendation reasoning")
    query: ShoppingQuery = Field(description="Original parsed shopping requirements")
    execution_summary: Dict[str, Any] = Field(
        default_factory=dict,
        description="Execution statistics (collected, valid, rejected counts, sites)"
    )
