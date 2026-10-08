import pytest
from igna.validator import ProductValidator
from shared.schemas import ShoppingQuery, Product


@pytest.fixture
def validator():
    return ProductValidator(low_shipping_threshold=5.0)


@pytest.fixture
def base_query():
    return ShoppingQuery(
        product="coat",
        material="cotton",
        max_price=100.0,
        sizes=["M", "L"],
    )


def test_validator_valid_product(validator, base_query):
    product = Product(
        title="Men's Cotton Winter Coat",
        price=89.99,
        sizes=["M", "L"],
        material="cotton",
        rating=4.5,
        shipping_cost=0.0,
        source="amazon",
        url="https://amazon.com/dp/test",
    )
    validated = validator.validate_product(product, base_query)
    assert validated.hard_filter_passed is True
    assert validated.material_score == 1.0
    assert validated.price_score == round(1.0 - (89.99 / 100.0), 4)
    assert validated.shipping_score == 1.0
    assert validated.rating_score == round(4.5 / 5.0, 4)


def test_validator_price_rejection(validator, base_query):
    product = Product(
        title="Men's Cotton Winter Coat",
        price=129.00,  # exceeds $100
        sizes=["M", "L"],
        material="cotton",
        source="amazon",
        url="https://amazon.com/dp/test",
    )
    validated = validator.validate_product(product, base_query)
    assert validated.hard_filter_passed is False
    assert any("exceeds maximum budget" in r for r in validated.validation_reasons)


def test_validator_size_rejection(validator, base_query):
    product = Product(
        title="Men's Cotton Coat",
        price=79.00,
        sizes=["S", "XL"],  # lacks M and L
        material="cotton",
        source="amazon",
        url="https://amazon.com/dp/test",
    )
    validated = validator.validate_product(product, base_query)
    assert validated.hard_filter_passed is False
    assert any("not available" in r for r in validated.validation_reasons)


def test_validator_category_rejection(validator, base_query):
    product = Product(
        title="Men's Cotton Ankle Socks 6-Pack",  # socks, not coat
        price=19.99,
        sizes=["M", "L"],
        material="cotton",
        source="amazon",
        url="https://amazon.com/dp/test",
    )
    validated = validator.validate_product(product, base_query)
    assert validated.hard_filter_passed is False
    assert any("does not match requested item" in r for r in validated.validation_reasons)


def test_validator_material_exact_match(validator, base_query):
    product = Product(
        title="100% Cotton Heavy Coat",
        price=85.00,
        sizes=["M"],
        material="100% cotton",
        source="ebay",
        url="https://ebay.com/itm/test",
    )
    validated = validator.validate_product(product, base_query)
    assert validated.hard_filter_passed is True
    assert validated.material_score == 1.0


def test_validator_material_partial_match(validator, base_query):
    product = Product(
        title="Cotton Blend Utility Coat",
        price=75.00,
        sizes=["M"],
        material="cotton blend",
        source="walmart",
        url="https://walmart.com/ip/test",
    )
    validated = validator.validate_product(product, base_query)
    assert validated.hard_filter_passed is True
    assert validated.material_score == 0.7


def test_validator_material_no_match(validator, base_query):
    product = Product(
        title="Wool Winter Coat",
        price=90.00,
        sizes=["M"],
        material="wool",
        source="amazon",
        url="https://amazon.com/dp/test",
    )
    validated = validator.validate_product(product, base_query)
    # Material is soft filter, so hard_filter_passed is still True!
    assert validated.hard_filter_passed is True
    assert validated.material_score == 0.0
