import pytest
from igna.parser import QueryParser
from shared.schemas import ShoppingQuery
from shared.exceptions import QueryParsingError


def test_parser_normal_query():
    parser = QueryParser()
    q = "Men's cotton coat under $100, size M or L"
    result = parser.parse(q)

    assert isinstance(result, ShoppingQuery)
    assert result.product == "coat"
    assert result.material == "cotton"
    assert result.max_price == 100.0
    assert "M" in result.sizes
    assert "L" in result.sizes
    assert result.sites == ["amazon"]


def test_parser_missing_optional_values():
    parser = QueryParser()
    q = "cotton jacket"
    result = parser.parse(q)

    assert result.product == "jacket"
    assert result.material == "cotton"
    assert result.max_price is None
    assert result.sizes == []


def test_parser_multiple_sizes_and_keywords():
    parser = QueryParser()
    q = "men's wool sweater under $70 size S, M, L"
    result = parser.parse(q)

    assert result.product == "sweater"
    assert result.material == "wool"
    assert result.max_price == 70.0
    assert result.sizes == ["S", "M", "L"]
    assert result.gender == "men"


def test_parser_price_variations():
    parser = QueryParser()

    res1 = parser.parse("shoes below 80 dollars size 9")
    assert res1.max_price == 80.0
    assert "9" in res1.sizes

    res2 = parser.parse("black coat under $120.50")
    assert res2.max_price == 120.50
    assert res2.color == "black"


def test_parser_invalid_empty_query():
    parser = QueryParser()
    with pytest.raises(QueryParsingError):
        parser.parse("")


def test_parser_invalid_negative_price():
    parser = QueryParser()
    with pytest.raises(QueryParsingError):
        # We simulate invalid price validation directly
        parser.parse("coat under -50")
