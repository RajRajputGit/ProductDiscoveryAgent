import asyncio
import uuid
from typing import Dict, Optional, Any
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from config.settings import get_settings
from shared.logger import setup_logging
from shared.schemas import ShoppingQuery, ExecutionTask, Product, ValidatedProduct
from igna.parser import QueryParser
from igna.planner import ExecutionPlanner
from igna.validator import ProductValidator
from igna.ranker import RankingEngine
from igna.recommender import Recommender
from cua.executor import BrowserExecutor

app = FastAPI(title="IGNA Smart Shopping Agent API", version="1.0.0")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logger = setup_logging()
settings = get_settings()

# In-memory storage for search sessions
search_cache: Dict[str, Dict[str, Any]] = {}


class SearchRequest(BaseModel):
    query: str = Field(description="Natural language shopping query")
    live: bool = Field(default=True, description="Whether to run live browser scraping")
    sites: Optional[list[str]] = Field(default=None, description="Target websites")
    max_products: Optional[int] = Field(default=10, description="Max items per site")


@app.get("/api/health")
async def health_check():
    return {
        "status": "ok",
        "openai_configured": bool(settings.openai_api_key),
        "demo_mode_default": settings.demo_mode,
        "weights": {
            "material": settings.material_weight,
            "price": settings.price_weight,
            "shipping": settings.shipping_weight,
            "rating": settings.rating_weight,
        }
    }


@app.post("/api/search")
async def execute_search(request: SearchRequest):
    """
    Executes the complete IGNA pipeline:
    1. User Query -> OpenAI LLM structured intent
    2. IGNA -> Deterministic plan for search on websites (NO LLM)
    3. CUA -> Playwright Browser execution & extraction
    4. IGNA -> Hard filter validation
    5. IGNA -> Deduplication & Ranking
    6. IGNA -> Best recommendation & explanation
    """
    query_str = request.query.strip()
    if not query_str:
        raise HTTPException(status_code=400, detail="Query cannot be empty.")

    search_id = "srch_" + uuid.uuid4().hex[:8]
    demo_mode = False if request.live else settings.demo_mode

    logger.info("api_search_requested", search_id=search_id, query=query_str, live=request.live)

    try:
        # Step 1: Input Understanding (OpenAI LLM structured output)
        parser = QueryParser()
        shopping_query: ShoppingQuery = parser.parse(query_str)
        if request.sites:
            shopping_query.sites = [s for s in request.sites if s.lower() not in ["walmart", "ebay"]] or ["amazon"]
        else:
            shopping_query.sites = [s for s in shopping_query.sites if s.lower() not in ["walmart", "ebay"]] or ["amazon"]

        # Step 2: Deterministic Planning (NO LLM)
        planner = ExecutionPlanner(max_products_per_site=request.max_products)
        tasks: list[ExecutionTask] = planner.create_plan(shopping_query)

        # Step 3: CUA Browser Execution (Playwright / Scrapers)
        executor = BrowserExecutor(demo_mode=demo_mode)
        collected_products, exec_summary = await executor.execute_tasks(tasks)

        # Step 4: IGNA Validation (Hard filters + soft scoring)
        validator = ProductValidator()
        valid_items, rejected_items = validator.validate_products(collected_products, shopping_query)

        # Step 5: IGNA Ranking (RapidFuzz deduplication + deterministic weights)
        ranker = RankingEngine()
        top_products = ranker.rank(valid_items)

        # Step 6: IGNA Recommendation & Explanation
        recommender = Recommender()
        summary = {
            "sites": exec_summary.get("site_counts", {}),
            "total_collected": len(collected_products),
            "valid_count": len(valid_items),
            "rejected_count": len(rejected_items),
        }
        recommendation_result = recommender.recommend(
            query=shopping_query,
            top_products=top_products,
            execution_summary=summary,
        )

        # Construct full response payload matching frontend schema
        best_prod = recommendation_result.best_product

        def serialize_prod(vp: ValidatedProduct, idx: int):
            p = vp.product
            return {
                "product": {
                    "id": f"prod_{idx}_{p.source}",
                    "title": p.title,
                    "price": p.price,
                    "currency": p.currency,
                    "sizes": p.sizes,
                    "material": p.material,
                    "rating": p.rating,
                    "shipping_cost": p.shipping_cost,
                    "source": p.source,
                    "url": p.url,
                    "availability": p.availability,
                    "image_url": p.image_url,
                    "description": p.description,
                },
                "hard_filter_passed": vp.hard_filter_passed,
                "material_score": vp.material_score,
                "price_score": vp.price_score,
                "shipping_score": vp.shipping_score,
                "rating_score": vp.rating_score,
                "final_score": vp.final_score,
                "validation_reasons": vp.validation_reasons,
            }

        playwright_q = tasks[0].search_query if tasks else shopping_query.product
        response_payload = {
            "search_id": search_id,
            "raw_query": query_str,
            "playwright_query": playwright_q,
            "execution_tasks": [
                {
                    "site": t.site,
                    "search_query": t.search_query,
                    "filters": t.filters,
                }
                for t in tasks
            ],
            "query": shopping_query.model_dump(),
            "summary": {
                "total_collected": len(collected_products),
                "valid_count": len(valid_items),
                "rejected_count": len(rejected_items),
                "sources_count": len(shopping_query.sites),
                "top_score": best_prod.final_score if best_prod else 0.0,
                "site_counts": exec_summary.get("site_counts", {}),
            },
            "top_products": [serialize_prod(vp, i) for i, vp in enumerate(top_products, 1)],
            "best_product": serialize_prod(best_prod, 1) if best_prod else None,
            "rejected_products": [serialize_prod(rp, i) for i, rp in enumerate(rejected_items, 1)],
            "explanation": recommendation_result.explanation,
            "execution_stages": [
                {
                    "id": "understanding",
                    "name": "Input Understanding",
                    "layer": "IGNA",
                    "status": "completed",
                    "description": "OpenAI LLM extracted structured intent and constraints.",
                    "details": [
                        f"Product: {shopping_query.product}",
                        f"Material: {shopping_query.material or 'Any'}",
                        f"Max Budget: ${shopping_query.max_price or 'None'}",
                        f"Sizes: {', '.join(shopping_query.sizes) if shopping_query.sizes else 'Any'}",
                    ],
                },
                {
                    "id": "planning",
                    "name": "Search Planning",
                    "layer": "IGNA",
                    "status": "completed",
                    "description": "Deterministic planner created search tasks without LLM.",
                    "details": [f"{t.site.upper()}: '{t.search_query}'" for t in tasks],
                },
                {
                    "id": "execution",
                    "name": "CUA Browser Search",
                    "layer": "CUA",
                    "status": "completed",
                    "description": "Playwright navigated websites and extracted raw products.",
                    "details": [f"{s}: {c} items extracted" for s, c in exec_summary.get("site_counts", {}).items()],
                },
                {
                    "id": "formatting",
                    "name": "Data Normalization",
                    "layer": "CUA",
                    "status": "completed",
                    "description": "Sanitized prices, ratings, sizes into Product contracts.",
                    "details": [f"Formatted {len(collected_products)} items"],
                },
                {
                    "id": "validation",
                    "name": "Hard Filter Validation",
                    "layer": "IGNA",
                    "status": "completed",
                    "description": "Strictly filtered out items exceeding budget or missing sizes.",
                    "details": [f"Valid: {len(valid_items)}, Rejected: {len(rejected_items)}"],
                },
                {
                    "id": "ranking",
                    "name": "Ranking & Deduplication",
                    "layer": "IGNA",
                    "status": "completed",
                    "description": "RapidFuzz deduplication and mathematical formula applied.",
                    "details": [
                        "Formula: (Material × 0.4) + (Price × 0.3) + (Shipping × 0.2) + (Rating × 0.1)",
                        f"Selected Top {len(top_products)} overall",
                    ],
                },
                {
                    "id": "recommendation",
                    "name": "Recommendation Rationale",
                    "layer": "IGNA",
                    "status": "completed",
                    "description": "Designated best match with transparent explanation.",
                    "details": [f"Winner: {best_prod.product.title}" if best_prod else "No winner"],
                },
            ],
            "sources_status": {
                s: {
                    "site": s.title(),
                    "status": "completed",
                    "products_found": exec_summary.get("site_counts", {}).get(s, 0),
                    "valid_products": sum(1 for v in valid_items if v.product.source.lower() == s),
                }
                for s in shopping_query.sites
            },
            "weights": {
                "material": settings.material_weight,
                "price": settings.price_weight,
                "shipping": settings.shipping_weight,
                "rating": settings.rating_weight,
            },
        }

        search_cache[search_id] = response_payload
        return response_payload

    except Exception as e:
        logger.error("api_search_failed", error=str(e), query=query_str)
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/search/{search_id}/results")
async def get_results(search_id: str):
    if search_id not in search_cache:
        raise HTTPException(status_code=404, detail="Search session not found.")
    return search_cache[search_id]
