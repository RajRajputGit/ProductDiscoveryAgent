class ShoppingAgentException(Exception):
    """Base exception for IGNA Smart Shopping Agent."""
    pass


class ConfigurationError(ShoppingAgentException):
    """Raised when configuration or settings are invalid."""
    pass


class QueryParsingError(ShoppingAgentException):
    """Raised when natural language query parsing fails."""
    pass


class PlanningError(ShoppingAgentException):
    """Raised when execution planning fails."""
    pass


class BrowserExecutionError(ShoppingAgentException):
    """Raised when browser initialization or navigation encounters a fatal failure."""
    pass


class ExtractionError(ShoppingAgentException):
    """Raised when product scraping or data extraction fails."""
    pass


class ValidationError(ShoppingAgentException):
    """Raised when product validation logic fails."""
    pass
