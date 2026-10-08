import pytest
from igna.ranker import RankingEngine
from shared.schemas import ValidatedProduct, Product


def test_ranker_formula_correctness():
    ranker = RankingEngine(
        material_weight=0.4,
        price_weight=0.3,
        shipping_weight=0.2,
        rating_weight=0.1,
    )
    product = Product(
        title="Sample Cotton Coat",
        price=50.0,
        sizes=["M"],
        source="amazon",
        url="https://amazon.com",
    )
    val_prod = ValidatedProduct(
        product=product,
        hard_filter_passed=True,
        material_score=1.0,
        price_score=0.5,
        shipping_score=1.0,
        rating_score=0.8,
    )

    # Expected: (1.0 * 0.4) + (0.5 * 0.3) + (1.0 * 0.2) + (0.8 * 0.1)
    # = 0.4 + 0.15 + 0.2 + 0.08 = 0.83
    score = ranker.calculate_score(val_prod)
    assert score == pytest.approx(0.83, abs=1e-4)


def test_ranker_top_5_selection_across_sites():
    ranker = RankingEngine(top_k=5)

    styles = ["Parka", "Trench", "Winter", "Casual", "Rain", "Bomber", "Field", "Puffer"]
    items = []
    # Create 8 products with different scores across sites
    for i, style in enumerate(styles):
        source = ["amazon", "ebay", "walmart"][i % 3]
        prod = Product(
            title=f"Classic {style} Coat Edition",
            price=50.0 + i * 5,
            sizes=["M"],
            source=source,
            url=f"https://{source}.com/{i}",
        )
        val = ValidatedProduct(
            product=prod,
            hard_filter_passed=True,
            material_score=1.0,
            price_score=1.0 - (i * 0.1),
            shipping_score=1.0,
            rating_score=0.9,
        )
        items.append(val)

    top_5 = ranker.rank(items, top_k=5)
    assert len(top_5) == 5
    # Ensure descending order
    scores = [item.final_score for item in top_5]
    assert scores == sorted(scores, reverse=True)



def test_ranker_deduplication():
    ranker = RankingEngine(top_k=5)

    prod1 = Product(
        title="Men's Cotton Winter Coat Heavy Duty Parka",
        price=89.99,
        sizes=["M"],
        source="amazon",
        url="https://amazon.com/1",
    )
    prod2 = Product(
        title="Men's Cotton Winter Coat Heavy Duty Parka",
        price=88.50,
        sizes=["M"],
        source="ebay",
        url="https://ebay.com/2",
    )

    val1 = ValidatedProduct(product=prod1, hard_filter_passed=True, material_score=1.0, price_score=0.2, shipping_score=1.0, rating_score=0.8)
    val2 = ValidatedProduct(product=prod2, hard_filter_passed=True, material_score=1.0, price_score=0.2, shipping_score=1.0, rating_score=0.8)

    ranked = ranker.rank([val1, val2], top_k=5)
    # Should deduplicate down to 1
    assert len(ranked) == 1
