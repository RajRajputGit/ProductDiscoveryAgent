import os
from functools import lru_cache
from typing import Optional
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application configuration loaded from environment and .env."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    # LLM Settings
    openai_api_key: Optional[str] = Field(default=None, alias="OPENAI_API_KEY")
    openai_model: str = Field(default="gpt-4o-mini", alias="OPENAI_MODEL")

    # Mode & Execution
    demo_mode: bool = Field(default=False, alias="DEMO_MODE")
    headless: bool = Field(default=False, alias="HEADLESS")
    max_products_per_site: int = Field(default=10, alias="MAX_PRODUCTS_PER_SITE")
    top_k: int = Field(default=5, alias="TOP_K")
    max_retries: int = Field(default=2, alias="MAX_RETRIES")
    page_timeout: int = Field(default=30000, alias="PAGE_TIMEOUT")
    action_timeout: int = Field(default=10000, alias="ACTION_TIMEOUT")

    # Scoring Weights (must sum to 1.0)
    material_weight: float = Field(default=0.4, alias="MATERIAL_WEIGHT")
    price_weight: float = Field(default=0.3, alias="PRICE_WEIGHT")
    shipping_weight: float = Field(default=0.2, alias="SHIPPING_WEIGHT")
    rating_weight: float = Field(default=0.1, alias="RATING_WEIGHT")

    # Shipping threshold for scoring ($5 by default)
    low_shipping_threshold: float = Field(default=5.0, alias="LOW_SHIPPING_THRESHOLD")

    @field_validator("rating_weight")
    @classmethod
    def validate_weights_sum(cls, v: float, info) -> float:
        """Validate that all scoring weights sum to 1.0."""
        data = info.data
        m = data.get("material_weight", 0.4)
        p = data.get("price_weight", 0.3)
        s = data.get("shipping_weight", 0.2)
        total = m + p + s + v
        if abs(total - 1.0) > 1e-4:
            raise ValueError(
                f"Scoring weights must sum to 1.0, got {total:.4f} "
                f"(material={m}, price={p}, shipping={s}, rating={v})"
            )
        return v


@lru_cache()
def get_settings() -> Settings:
    """Return cached Settings singleton."""
    return Settings()
