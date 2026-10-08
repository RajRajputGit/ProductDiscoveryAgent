import React, { useState, useMemo } from 'react';
import { RecommendationResult, ValidatedProduct, SearchFilterState } from '../types/shopping';
import { BestMatch } from '../components/recommendation/BestMatch';
import { RecommendationReason } from '../components/recommendation/RecommendationReason';
import { ProductGrid } from '../components/products/ProductGrid';
import { ProductComparison } from '../components/products/ProductComparison';
import { ProductFilters } from '../components/products/ProductFilters';
import { RejectedProductsDrawer } from '../components/products/RejectedProductsDrawer';
import { ProductDetailsModal } from '../components/products/ProductDetailsModal';
import { CheckCircle2, Layers, Search, Sparkles, LayoutGrid, Table, ArrowLeft, Compass, Bot } from 'lucide-react';

interface ResultsProps {
  result: RecommendationResult;
  rawQuery?: string;
  onNewSearch: () => void;
}

export const Results: React.FC<ResultsProps> = ({ result, rawQuery, onNewSearch }) => {
  const [activeTab, setActiveTab] = useState<'cards' | 'compare'>('cards');
  const [selectedProduct, setSelectedProduct] = useState<ValidatedProduct | null>(null);

  // Maximum price in current results
  const maxPriceInResults = useMemo(() => {
    const prices = result.top_products.map((p) => p.product.price);
    return Math.max(...prices, result.query.max_price ?? 100);
  }, [result]);

  const [filters, setFilters] = useState<SearchFilterState>({
    sources: result.query.sites && result.query.sites.length > 0 ? result.query.sites : ['amazon'],
    maxPrice: maxPriceInResults,
    minRating: undefined,
    material: undefined,
    sortBy: 'score',
  });

  const availableMaterials = useMemo(() => {
    const mats = new Set<string>();
    result.top_products.forEach((p) => {
      if (p.product.material) mats.add(p.product.material.toLowerCase());
    });
    return Array.from(mats);
  }, [result]);

  const filteredProducts = useMemo(() => {
    return result.top_products.filter((item) => {
      const p = item.product;
      // Source filter
      if (!filters.sources.includes(p.source.toLowerCase())) {
        return false;
      }
      // Price filter
      if (filters.maxPrice !== undefined && p.price > filters.maxPrice) {
        return false;
      }
      // Rating filter
      if (filters.minRating !== undefined && (!p.rating || p.rating < filters.minRating)) {
        return false;
      }
      // Material filter
      if (filters.material && (!p.material || !p.material.toLowerCase().includes(filters.material.toLowerCase()))) {
        return false;
      }
      return true;
    }).sort((a, b) => {
      if (filters.sortBy === 'price-asc') return a.product.price - b.product.price;
      if (filters.sortBy === 'price-desc') return b.product.price - a.product.price;
      if (filters.sortBy === 'rating') return (b.product.rating || 0) - (a.product.rating || 0);
      return b.final_score - a.final_score;
    });
  }, [result.top_products, filters]);

  const resetFilters = () => {
    setFilters({
      sources: ['amazon', 'ebay', 'walmart'],
      maxPrice: maxPriceInResults,
      minRating: undefined,
      material: undefined,
      sortBy: 'score',
    });
  };

  const summary = result.summary;

  const actualQuery =
    rawQuery ||
    result.raw_query ||
    result.query.product;

  const playwrightSearchQuery =
    result.playwright_query ||
    result.execution_tasks?.[0]?.search_query ||
    result.query.product;

  const storeNames =
    result.query.sites && result.query.sites.length > 0
      ? result.query.sites.map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(', ')
      : 'Amazon';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10 animate-fade-in">
      {/* Top Header & Search Query Display */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 pb-6 border-b border-slate-800">
        <div>
          <button
            onClick={onNewSearch}
            className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-medium mb-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Search another product</span>
          </button>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Your Best Matches
          </h1>

          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            IGNA compared <strong className="text-slate-200">{summary.total_collected} products</strong> across{' '}
            <strong className="text-slate-200">{summary.sources_count} shopping sources</strong> and validated{' '}
            <strong className="text-emerald-400">{summary.valid_count} products</strong> strictly matching your criteria.
          </p>
        </div>

        {/* Actual Query & Playwright Structured Intent Card */}
        <div className="flex flex-col gap-2 p-3 sm:p-3.5 rounded-2xl bg-[#12131c] border border-slate-800 shadow-sm max-w-xl w-full lg:w-auto">
          {/* Row 1: Actual User Natural Language Query */}
          <div className="flex items-center gap-2 text-xs">
            <span className="flex items-center gap-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-700/60 shrink-0">
              <Search className="w-3 h-3 text-indigo-400" />
              Actual Query
            </span>
            <span className="font-semibold text-white truncate max-w-[280px] sm:max-w-[360px]" title={actualQuery}>
              "{actualQuery}"
            </span>
          </div>

          {/* Row 2: Playwright CUA Store Search & Structured Intent */}
          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-800/80 text-[11px] font-mono">
            <span className="flex items-center gap-1 font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 shrink-0">
              <Bot className="w-3 h-3" />
              Playwright Searched
            </span>
            <span className="text-emerald-300 font-bold bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
              "{playwrightSearchQuery}"
            </span>
            <span className="text-slate-500 text-[10px]">on {storeNames}</span>

            {/* Structured Constraints */}
            {result.query.max_price && (
              <span className="bg-slate-900 text-slate-300 px-2 py-0.5 rounded border border-slate-800 text-[10px]">
                Budget: ≤ ${result.query.max_price}
              </span>
            )}
            {result.query.sizes && result.query.sizes.length > 0 && (
              <span className="bg-slate-900 text-slate-300 px-2 py-0.5 rounded border border-slate-800 text-[10px]">
                Size: {result.query.sizes.join(', ')}
              </span>
            )}
            {result.query.material && (
              <span className="bg-slate-900 text-slate-300 px-2 py-0.5 rounded border border-slate-800 text-[10px] capitalize">
                {result.query.material}
              </span>
            )}
            {result.query.gender && (
              <span className="bg-slate-900 text-slate-300 px-2 py-0.5 rounded border border-slate-800 text-[10px] capitalize">
                {result.query.gender}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-[#12131c] border border-slate-800 shadow-sm">
          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-400">
            {summary.valid_count}
          </div>
          <div className="text-xs text-slate-400 mt-1 font-medium">Valid Products</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Passed all hard filters</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#12131c] border border-slate-800 shadow-sm">
          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-indigo-400">
            {summary.sources_count}
          </div>
          <div className="text-xs text-slate-400 mt-1 font-medium">Sources Searched</div>
          <div className="text-[10px] text-slate-500 mt-0.5 capitalize">
            {result.query.sites && result.query.sites.length > 0 ? result.query.sites.join(', ') : 'Amazon'}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#12131c] border border-slate-800 shadow-sm">
          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-200">
            {summary.total_collected}
          </div>
          <div className="text-xs text-slate-400 mt-1 font-medium">Products Analyzed</div>
          <div className="text-[10px] text-slate-500 mt-0.5">{summary.rejected_count} filtered out</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#12131c] border border-slate-800 shadow-sm">
          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-white">
            {(summary.top_score * 100).toFixed(0)}%
          </div>
          <div className="text-xs text-slate-400 mt-1 font-medium">Top Match Score</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Weighted algorithm</div>
        </div>
      </div>

      {/* Dominant Best Match Showcase */}
      {result.best_product && (
        <section className="space-y-4">
          <BestMatch
            bestProduct={result.best_product}
            weights={result.weights}
            onSelect={setSelectedProduct}
          />
          <RecommendationReason
            bestProduct={result.best_product}
            query={result.query}
            explanation={result.explanation}
          />
        </section>
      )}

      {/* Product Catalog Section */}
      <section className="space-y-6 pt-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Top Validated Matches
            </h2>
            <p className="text-xs text-slate-400">
              Ranked in descending order across all stores using the 4-factor scoring formula
            </p>
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800">
            <button
              onClick={() => setActiveTab('cards')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'cards'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Cards</span>
            </button>
            <button
              onClick={() => setActiveTab('compare')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'compare'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>Compare</span>
            </button>
          </div>
        </div>

        {/* Lightweight Filter Control */}
        <ProductFilters
          filters={filters}
          onChange={setFilters}
          onReset={resetFilters}
          availableMaterials={availableMaterials}
          maxPossiblePrice={maxPriceInResults}
        />

        {/* Product Cards or Comparison Table */}
        {filteredProducts.length === 0 ? (
          <div className="py-16 text-center rounded-2xl bg-[#12131c] border border-slate-800 space-y-3">
            <p className="text-sm text-slate-300 font-medium">No products match your active filter settings.</p>
            <button
              onClick={resetFilters}
              className="px-4 py-2 text-xs font-medium rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : activeTab === 'cards' ? (
          <ProductGrid products={filteredProducts} onSelect={setSelectedProduct} />
        ) : (
          <ProductComparison products={filteredProducts} onSelect={setSelectedProduct} />
        )}
      </section>

      {/* Rejected Products Audit Drawer */}
      <section className="pt-2">
        <RejectedProductsDrawer rejectedProducts={result.rejected_products} />
      </section>

      {/* Product Details Modal */}
      <ProductDetailsModal
        item={selectedProduct}
        weights={result.weights}
        onClose={() => setSelectedProduct(null)}
      />
    </div>
  );
};
