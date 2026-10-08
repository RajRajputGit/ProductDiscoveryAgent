import argparse
import asyncio
import os
import sys
from typing import List, Optional

from config.settings import get_settings
from shared.logger import setup_logging
from shared.schemas import ShoppingQuery, ExecutionTask, Product, ValidatedProduct, RecommendationResult
from igna.parser import QueryParser
from igna.planner import ExecutionPlanner
from igna.validator import ProductValidator
from igna.ranker import RankingEngine
from igna.recommender import Recommender
from cua.executor import BrowserExecutor


class SmartShoppingAgent:
    """End-to-end orchestrator maintaining strict separation between IGNA and CUA layers."""

    def __init__(self, demo_mode: Optional[bool] = None):
        settings = get_settings()
        self.demo_mode = demo_mode if demo_mode is not None else settings.demo_mode
        self.logger = setup_logging()

        # IGNA Components (Decision Layer)
        self.parser = QueryParser()
        self.planner = ExecutionPlanner()
        self.validator = ProductValidator()
        self.ranker = RankingEngine()
        self.recommender = Recommender()

        # CUA Components (Execution Layer)
        self.executor = BrowserExecutor(demo_mode=self.demo_mode)

    async def run(
        self,
        query_str: str,
        override_sites: Optional[List[str]] = None,
        max_products: Optional[int] = None,
        verbose: bool = False
    ) -> RecommendationResult:
        """Run deterministic pipeline across IGNA and CUA layers."""
        self.logger.info("pipeline_run_started", query=query_str, demo_mode=self.demo_mode)

        # 1. IGNA - Input Understanding
        shopping_query: ShoppingQuery = self.parser.parse(query_str)
        if override_sites:
            shopping_query.sites = override_sites

        # 2. IGNA - Planning
        if max_products:
            self.planner.max_products_per_site = max_products
        tasks: List[ExecutionTask] = self.planner.create_plan(shopping_query)

        # 3. CUA - Browser Execution, Scraping, Formatting
        collected_products, exec_summary = await self.executor.execute_tasks(tasks)

        # 4. IGNA - Validation (Hard filters + component scoring)
        valid_items, rejected_items = self.validator.validate_products(collected_products, shopping_query)

        # 5. IGNA - Merging & Ranking (Deduplication + Final Score calculation + Top K)
        top_products = self.ranker.rank(valid_items)

        # 6. IGNA - Recommendation (Select #1 and generate explainability)
        summary = {
            "sites": exec_summary.get("site_counts", {}),
            "total_collected": len(collected_products),
            "valid_count": len(valid_items),
            "rejected_count": len(rejected_items),
            "rejected_items": rejected_items if verbose else [],
            "all_valid_items": valid_items if verbose else [],
            "tasks": tasks if verbose else [],
        }

        result = self.recommender.recommend(
            query=shopping_query,
            top_products=top_products,
            execution_summary=summary,
        )

        return result


def print_cli_report(result: RecommendationResult, verbose: bool = False) -> None:
    """Format and print the clean terminal report required by specifications."""
    query = result.query
    summary = result.execution_summary
    site_counts = summary.get("sites", {})
    total_collected = summary.get("total_collected", 0)
    valid_count = summary.get("valid_count", 0)
    rejected_count = summary.get("rejected_count", 0)

    print("\n" + "=" * 80)
    print("IGNA SMART SHOPPING AGENT")
    print("=" * 80)

    print("\nUSER QUERY:")
    user_q = f"{query.gender or ''} {query.material or ''} {query.product}".strip()
    if query.max_price:
        user_q += f" under ${query.max_price:g}"
    if query.sizes:
        user_q += f" size {' or '.join(query.sizes)}"
    print(user_q.title())

    print("\n" + "-" * 50)
    print("PARSED REQUIREMENTS")
    print("-" * 50)
    print(f"Product:   {query.product}")
    print(f"Material:  {query.material or 'Any'}")
    print(f"Max Price: ${query.max_price:g}" if query.max_price else "Max Price: None")
    if query.min_price:
        print(f"Min Price: ${query.min_price:g}")
    print(f"Sizes:     {', '.join(query.sizes) if query.sizes else 'Any'}")
    print(f"Sites:     {', '.join(query.sites)}")

    if verbose and summary.get("tasks"):
        print("\n[VERBOSE] EXECUTION TASKS:")
        for t in summary["tasks"]:
            print(f"  - Site: {t.site:<8} | Search Query: '{t.search_query}' | Max Products: {t.max_products}")

    print("\n" + "-" * 50)
    print("EXECUTION")
    print("-" * 50)
    for site, count in site_counts.items():
        print(f"{site.title():<10}: {count} products")

    print("\n" + "-" * 50)
    print("VALIDATION")
    print("-" * 50)
    print(f"Collected: {total_collected}")
    print(f"Valid:     {valid_count}")
    print(f"Rejected:  {rejected_count}")

    if verbose and summary.get("rejected_items"):
        print("\n[VERBOSE] REJECTION SAMPLES:")
        for r in summary["rejected_items"][:5]:
            reasons_str = "; ".join(r.validation_reasons[:2])
            print(f"  ✗ {r.product.title[:40]:<40} (${r.product.price:.2f}) -> {reasons_str}")

    print("\n" + "-" * 50)
    print("TOP 5 PRODUCTS")
    print("-" * 50)

    if not result.top_products:
        print("No products satisfied all requirements.")
    else:
        # Table Header
        header = f"| {'Rank':<4} | {'Product':<35} | {'Source':<8} | {'Price':<7} | {'Size':<6} | {'Material':<12} | {'Rating':<6} | {'Ship':<6} | {'Score':<6} |"
        sep = "-" * len(header)
        print(sep)
        print(header)
        print(sep)

        for rank_idx, item in enumerate(result.top_products, start=1):
            p = item.product
            title_trunc = (p.title[:32] + "...") if len(p.title) > 35 else p.title
            sizes_str = ",".join(p.sizes[:2]) if p.sizes else "N/A"
            mat_str = (p.material or "N/A")[:12]
            price_str = f"${p.price:.2f}"
            rating_str = f"{p.rating:.1f}" if p.rating else "N/A"
            ship_str = "Free" if p.shipping_cost == 0 else f"${p.shipping_cost:.2f}"
            score_str = f"{item.final_score:.2f}"

            row = f"| {rank_idx:<4} | {title_trunc:<35} | {p.source.title():<8} | {price_str:<7} | {sizes_str:<6} | {mat_str:<12} | {rating_str:<6} | {ship_str:<6} | {score_str:<6} |"
            print(row)
        print(sep)

    if verbose and result.top_products:
        print("\n[VERBOSE] SCORE BREAKDOWN FOR TOP PRODUCTS:")
        for idx, item in enumerate(result.top_products, start=1):
            p = item.product
            print(
                f"  #{idx} {p.title[:30]:<30} => "
                f"Mat: {item.material_score:.2f}*0.4 + Price: {item.price_score:.2f}*0.3 + "
                f"Ship: {item.shipping_score:.2f}*0.2 + Rating: {item.rating_score:.2f}*0.1 = "
                f"Final: {item.final_score:.4f}"
            )

    print("\n" + "-" * 50)
    print("BEST RECOMMENDATION")
    print("-" * 50)

    if result.best_product:
        bp = result.best_product.product
        print(f"Product:  {bp.title}")
        print(f"Source:   {bp.source.title()}")
        print(f"Price:    ${bp.price:.2f}")
        print(f"URL:      {bp.url}")
        print(f"\nReason:\n{result.explanation}")
    else:
        print("None available.")

    print("\n" + "=" * 80 + "\n")


def parse_args():
    parser = argparse.ArgumentParser(
        description="IGNA Smart Shopping Agent - Hybrid AI Shopping Assistant"
    )
    parser.add_argument(
        "--query",
        type=str,
        default="Men cotton coat under $100 size M or L",
        help="Natural language shopping query"
    )
    parser.add_argument(
        "--sites",
        nargs="+",
        default=None,
        help="Target shopping sites (amazon, ebay, walmart)"
    )
    parser.add_argument(
        "--max-products",
        type=int,
        default=10,
        help="Maximum products to extract per website"
    )
    parser.add_argument(
        "--verbose",
        action="store_true",
        help="Display detailed verbose pipeline execution steps"
    )
    parser.add_argument(
        "--live",
        action="store_true",
        help="Attempt live browser scraping instead of demo mode"
    )
    return parser.parse_args()


async def main():
    args = parse_args()
    demo_mode = not args.live

    agent = SmartShoppingAgent(demo_mode=demo_mode)
    try:
        result = await agent.run(
            query_str=args.query,
            override_sites=args.sites,
            max_products=args.max_products,
            verbose=args.verbose,
        )
        print_cli_report(result, verbose=args.verbose)
    except Exception as e:
        print(f"\n[FATAL ERROR] {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
