from typing import List, Optional
import structlog
from config.settings import get_settings
from shared.schemas import ShoppingQuery, ExecutionTask
from shared.exceptions import PlanningError

logger = structlog.get_logger("igna.planner")


class ExecutionPlanner:
    """Deterministic planner that produces ExecutionTasks without any LLM intervention."""

    def __init__(self, max_products_per_site: Optional[int] = None):
        settings = get_settings()
        self.max_products_per_site = max_products_per_site or settings.max_products_per_site

    def create_plan(self, query: ShoppingQuery) -> List[ExecutionTask]:
        """Convert a validated ShoppingQuery into a deterministic list of ExecutionTasks."""
        logger.info("planning_started", sites=query.sites, product=query.product)

        if not query.sites:
            raise PlanningError("Cannot create execution plan: no target websites specified.")

        # Build clean search keywords: e.g. [gender] [color] [material] [product]
        tokens = []
        if query.gender and query.gender.lower() in ["men", "women", "kids"]:
            tokens.append(query.gender.lower())
        if query.color:
            tokens.append(query.color.lower())
        if query.material:
            tokens.append(query.material.lower())
        tokens.append(query.product.lower())

        search_query_str = " ".join(tokens)

        filters = {}
        if query.max_price is not None:
            filters["max_price"] = query.max_price
        if query.min_price is not None:
            filters["min_price"] = query.min_price
        if query.sizes:
            filters["sizes"] = query.sizes

        # Exclude sites that block automated browser scraping (walmart and ebay)
        active_sites = [s.strip().lower() for s in query.sites if s.strip().lower() not in ["walmart", "ebay"]]
        if not active_sites:
            active_sites = ["amazon"]

        tasks: List[ExecutionTask] = []
        for site in active_sites:
            tasks.append(
                ExecutionTask(
                    site=site,
                    search_query=search_query_str,
                    filters=filters,
                    max_products=self.max_products_per_site,
                    retry_count=0,
                )
            )

        logger.info(
            "planning_completed",
            task_count=len(tasks),
            sites=[t.site for t in tasks],
            search_query=search_query_str
        )
        return tasks
