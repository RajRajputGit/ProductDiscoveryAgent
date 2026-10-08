import pytest
from cua.formatter import ProductFormatter
from shared.schemas import Product


@pytest.fixture
def formatter():
    return ProductFormatter()


def test_formatter_normal_product(formatter):
    raw = {
        "title": "  Men's Cotton Winter Coat  ",
        "price": "$89.99",
        "currency": "USD",
        "sizes": "M, L, XL",
        "material": "100% Cotton",
        "rating": "4.5 out of 5",
        "shipping_cost": "FREE Shipping",
        "source": "amazon",
        "url": "/dp/B0812345",
        "availability": True,
    }
    prod = formatter.format_product(raw, default_source="amazon")
    assert isinstance(prod, Product)
    assert prod.title == "Men's Cotton Winter Coat"
    assert prod.price == 89.99
    assert prod.currency == "USD"
    assert prod.sizes == ["M", "L", "XL"]
    assert prod.material == "cotton"
    assert prod.rating == 4.5
    assert prod.shipping_cost == 0.0
    assert prod.source == "amazon"
    assert prod.url == "https://www.amazon.com/dp/B0812345"


def test_formatter_missing_price_returns_none(formatter):
    raw = {
        "title": "No Price Coat",
        "price": "Call for price",
    }
    prod = formatter.format_product(raw)
    assert prod is None


def test_formatter_missing_title_returns_none(formatter):
    raw = {
        "title": "   ",
        "price": "$50.00",
    }
    prod = formatter.format_product(raw)
    assert prod is None


def test_formatter_size_normalization(formatter):
    raw = {
        "title": "Jacket with various size notations",
        "price": "45.00",
        "sizes": "S / M / L OR XL",
    }
    prod = formatter.format_product(raw)
    assert prod is not None
    assert "S" in prod.sizes
    assert "M" in prod.sizes
    assert "L" in prod.sizes
    assert "XL" in prod.sizes


def test_formatter_shipping_cost_parsing(formatter):
    raw1 = {"title": "Coat 1", "price": "50.00", "shipping_cost": "$4.99"}
    prod1 = formatter.format_product(raw1)
    assert prod1.shipping_cost == 4.99

    raw2 = {"title": "Coat 2", "price": "50.00", "shipping_cost": "0"}
    prod2 = formatter.format_product(raw2)
    assert prod2.shipping_cost == 0.0
