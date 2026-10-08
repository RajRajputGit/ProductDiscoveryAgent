# IGNA Smart Shopping Agent (Proof of Concept)

A **Controlled Hybrid AI Architecture** for e-commerce search, validation, and recommendation.

The **IGNA Smart Shopping Agent** demonstrates an end-to-end multi-agent system that accepts natural-language shopping requests, extracts strict structured requirements via OpenAI LLM, produces a deterministic execution plan, scrapes and normalizes items across multiple e-commerce platforms (Amazon, eBay, Walmart) using Playwright, strictly enforces hard filters, scores soft attributes, deduplicates products, and selects the Top 5 items with explainable recommendation rationale.

---

## Controlled Hybrid AI Architecture Flow

The pipeline executes through a strictly controlled, non-autonomous flow:

```text
User Query
    ↓
OpenAI LLM (Structured Intent Parsing with Pydantic Contracts)
    ↓
IGNA - Planning (Deterministic ExecutionPlanner, NO LLM)
    ↓
CUA  - Browser Execution (BrowserManager with Playwright async API)
    ↓
CUA  - Data Extraction (Isolated scrapers: Amazon, eBay, Walmart)
    ↓
CUA  - Data Formatting (ProductFormatter to strict Product schema)
    ↓
IGNA - Validation (ProductValidator: Hard filters + Soft scoring)
    ↓
IGNA - Data Merging (RankingEngine deduplication across sources via RapidFuzz)
    ↓
IGNA - Ranking (Deterministic weighted formula)
    ↓
IGNA - Recommendation (Top 1 selection + Explainable reasoning)
    ↓
Final Presentation (Interactive UI & Terminal Report)
```


### Layer Responsibilities

| Layer | Component | Core Responsibilities |
|---|---|---|
| **IGNA** *(Brain)* | `QueryParser` | Understands natural-language queries into structured `ShoppingQuery`. Applies default constraints and bounds. |
| **IGNA** *(Brain)* | `ExecutionPlanner` | Produces deterministic `ExecutionTask` lists for target sites without LLM drift. |
| **CUA** *(Execution)* | `BrowserManager` | Manages Playwright lifecycle, pages, user-agents, network timeouts, and resource teardown. |
| **CUA** *(Execution)* | `BaseScraper` & Adapters | Navigates search pages, extracts raw DOM data or realistic demo mock catalogs. |
| **CUA** *(Execution)* | `ProductFormatter` | Sanitizes prices, currencies, sizes, materials, ratings, and canonical URLs into `Product`. |
| **IGNA** *(Brain)* | `ProductValidator` | Enforces non-negotiable **Hard Filters** (budget, size, core product) and calculates soft sub-scores. |
| **IGNA** *(Brain)* | `RankingEngine` | Deduplicates cross-site items using RapidFuzz and calculates deterministic composite scores. |
| **IGNA** *(Brain)* | `Recommender` | Identifies best product (#1) and generates explainable reasoning. |

---

## Scoring Formula & Weights

Ranking is **100% deterministic**; LLMs are not permitted to alter rankings:

$$\text{Final Score} = (\text{Material Score} \times 0.4) + (\text{Price Score} \times 0.3) + (\text{Shipping Score} \times 0.2) + (\text{Rating Score} \times 0.1)$$

- **Material Score (Weight: 0.4)**:
  - Exact match (`100% cotton`, `cotton`): `1.0`
  - Partial or blend (`cotton blend`, `poly-cotton`): `0.7`
  - Unmatched / other: `0.0`
  - Unspecified in user query: `1.0`
- **Price Score (Weight: 0.3)**:
  - $\text{Price Score} = 1 - \left(\frac{\text{product price}}{\text{max budget}}\right)$, clamped to $[0.0, 1.0]$.
- **Shipping Score (Weight: 0.2)**:
  - Free shipping: `1.0`
  - Low shipping ($\le \$5.00$): `0.5`
  - High shipping ($> \$5.00$): `0.2`
- **Rating Score (Weight: 0.1)**:
  - $\text{Rating} / 5.0$, with unrated fallback score of `0.6` ($3.0 / 5$).

---

## Key Architecture Decisions

1. **Why LLMs Are Excluded from Ranking & Planning**:
   - LLMs can suffer from non-deterministic drift, halluncinate prices, and reorder items unpredictably. By utilizing pure Python math and Pydantic validation, rankings are reproducible, auditable, and mathematically explainable.
2. **Deterministic Hard Filters vs. Soft Filters**:
   - Requirements such as maximum budget, available size variant, and core product category are hard constraints. Products violating these constraints are strictly rejected before scoring. Soft preferences (material purity, customer reviews, shipping fees) contribute to weighted ranking.
3. **CUA Isolation & Bot Resilience**:
   - Website-specific DOM selectors are strictly encapsulated inside dedicated scraper adapters (`AmazonScraper`, `EbayScraper`, `WalmartScraper`). If a live website triggers CAPTCHA or blocks requests, the executor logs `site_failed`, isolates the error, and continues querying remaining stores without failing the pipeline.
4. **Offline Demo Mode (`DEMO_MODE=true`)**:
   - Real e-commerce platforms frequently alter CSS classes or enforce anti-bot restrictions. The system includes realistic mock catalogs for apparel, footwear, and outerwear that run through the **exact same** scraping, formatting, validation, and ranking pipeline.
5. **Zero-Dependency Fallback for LLMs**:
   - If `OPENAI_API_KEY` is not present, the system defaults to deterministic rule-based query parsing and structured explanation generation, allowing complete local execution out of the box.

---

## Installation & Setup

### 1. Prerequisites
- Python 3.11+
- [uv](https://docs.astral.sh/uv/) (recommended) or standard `venv`

### 2. Environment Setup

Using `uv`:
```bash
# Create virtual environment
uv venv .venv
source .venv/bin/activate

# Install dependencies
uv pip install -r requirements.txt

# Install Playwright browser binaries
playwright install chromium
```

Using standard `pip`:
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
playwright install chromium
```

### 3. Configuration

Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Configuration parameters in `.env`:
```ini
# OpenAI Configuration (Optional for DEMO_MODE=true)
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-4o-mini

# Mode & Execution
DEMO_MODE=true
HEADLESS=true
MAX_PRODUCTS_PER_SITE=10
TOP_K=5
MAX_RETRIES=2
PAGE_TIMEOUT=30000
ACTION_TIMEOUT=10000

# Scoring Weights (Must sum to 1.0)
MATERIAL_WEIGHT=0.4
PRICE_WEIGHT=0.3
SHIPPING_WEIGHT=0.2
RATING_WEIGHT=0.1
```

---

## Running the Application
 
### 1. Interactive Web Application (React + FastAPI)
 
Run the backend server:
```bash
uvicorn server:app --host 127.0.0.1 --port 8000
```

In a second terminal, start the frontend:
```bash
cd frontend
npm run dev
```
Open [http://127.0.0.1:5173/](http://127.0.0.1:5173/) in your browser.

### 2. Command Line Interface (CLI)

Run default shopping query:
```bash
python main.py --query "men cotton coat under 100 size M or L"
```

Run with verbose execution audit:
```bash
python main.py --query "men cotton coat under 100 size M or L" --verbose
```


### Run Additional Example Queries
```bash
# 1. Men's Cotton Jacket
python main.py --query "Men's cotton jacket under 80 size M"

# 2. Women's Wool Sweater
python main.py --query "Women's wool sweater under 70 size L"

# 3. Running Shoes
python main.py --query "Running shoes under 120 size 9"
```

### Target Specific Websites
```bash
python main.py --query "cotton jacket under 60" --sites amazon walmart
```

---

## Example Output

```text
================================================================================
IGNA SMART SHOPPING AGENT
================================================================================

USER QUERY:
Men Cotton Coat Under $100 Size M Or L

--------------------------------------------------
PARSED REQUIREMENTS
--------------------------------------------------
Product:   coat
Material:  cotton
Max Price: $100
Sizes:     M, L
Sites:     amazon, ebay, walmart

--------------------------------------------------
EXECUTION
--------------------------------------------------
Amazon    : 7 products
Ebay      : 7 products
Walmart   : 7 products

--------------------------------------------------
VALIDATION
--------------------------------------------------
Collected: 21
Valid:     14
Rejected:  7

--------------------------------------------------
TOP 5 PRODUCTS
--------------------------------------------------
----------------------------------------------------------------------------------------------------------------------
| Rank | Product                             | Source   | Price   | Size   | Material     | Rating | Ship   | Score  |
----------------------------------------------------------------------------------------------------------------------
| 1    | Cotton Casual Windbreaker Spring... | Ebay     | $49.99  | S,M    | cotton       | 3.9    | Free   | 0.83   |
| 2    | Cotton Casual Daily Coat with Hood  | Walmart  | $69.99  | M,L    | cotton       | 4.3    | Free   | 0.78   |
| 3    | Men's Cotton Coat Classic Vintag... | Ebay     | $79.99  | M,L    | cotton       | 4.4    | Free   | 0.75   |
| 4    | Winter Cotton Padded Jacket Parka   | Walmart  | $84.99  | L,XL   | cotton       | 4.5    | Free   | 0.73   |
| 5    | Men's Cotton Winter Coat Heavy D... | Amazon   | $89.99  | M,L    | cotton       | 4.5    | Free   | 0.72   |
----------------------------------------------------------------------------------------------------------------------

--------------------------------------------------
BEST RECOMMENDATION
--------------------------------------------------
Product:  Cotton Casual Windbreaker Spring Coat
Source:   Ebay
Price:    $49.99
URL:      https://www.ebay.com/itm/EBAY_COAT_04

Reason:
Recommended as the #1 choice (Composite Score: 0.83) on Ebay because it exactly matches your desired cotton material (score: 1.0), is priced at $49.99, saving $50.01 under your $100.00 budget, verifiably supports your target size(s): M, offers free shipping, maintains a strong customer satisfaction rating of 3.9/5.0. It outperforms 4 other validated alternatives across material quality, price headroom, and shipping value.

================================================================================
```

---

## Testing

Run unit tests via `pytest`:
```bash
pytest -v
```

### Test Coverage:
- `test_parser.py`: Query normalization, optional fields, multiple sizes, price boundary validation.
- `test_validator.py`: Budget enforcement, missing size variants, category mismatches, material exact/partial scoring.
- `test_ranker.py`: Exact mathematical formula verification, cross-site top-k selection, RapidFuzz deduplication.
- `test_formatter.py`: Sanitization of raw prices, strings, sizes, shipping costs, and URLs.

---

## Observability & Logging

Structured JSON events are automatically emitted to `logs/shopping_agent.log` using `structlog`.

Events emitted:
- `query_parsed`: Structured query criteria.
- `planning_started` / `planning_completed`: Deterministic tasks generated.
- `execution_started` / `site_started`: Target scraping underway.
- `products_extracted` / `products_formatted`: Raw DOM data converted to `Product`.
- `product_rejected`: Reasons for hard filter failures.
- `validation_completed`: Counts of valid vs rejected products.
- `ranking_completed`: Top scores and deduplication events.
- `recommendation_generated`: Best product and rationale.
