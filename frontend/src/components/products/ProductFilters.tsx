import React from 'react';
import { Filter, SlidersHorizontal, RotateCcw } from 'lucide-react';
import { SearchFilterState } from '../../types/shopping';

interface ProductFiltersProps {
  filters: SearchFilterState;
  onChange: (filters: SearchFilterState) => void;
  onReset: () => void;
  availableMaterials: string[];
  maxPossiblePrice: number;
}

export const ProductFilters: React.FC<ProductFiltersProps> = ({
  filters,
  onChange,
  onReset,
  availableMaterials,
  maxPossiblePrice,
}) => {
  const toggleSource = (source: string) => {
    const updated = filters.sources.includes(source)
      ? filters.sources.filter((s) => s !== source)
      : [...filters.sources, source];
    onChange({ ...filters, sources: updated });
  };

  return (
    <div className="p-4 rounded-2xl bg-[#12131c] border border-slate-800 space-y-4 text-xs">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
        <div className="flex items-center gap-1.5 font-semibold text-slate-200">
          <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
          <span>Filter Results</span>
        </div>
        <button
          onClick={onReset}
          className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {/* Sources Filter */}
        <div className="space-y-1.5">
          <label className="text-slate-400 font-medium text-[11px]">Shopping Source</label>
          <div className="flex flex-wrap gap-1.5">
            {['amazon'].map((s) => {
              const active = filters.sources.includes(s);
              return (
                <button
                  key={s}
                  onClick={() => toggleSource(s)}
                  className={`px-2.5 py-1 rounded-lg border text-xs capitalize transition-all ${
                    active
                      ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-300 font-medium'
                      : 'bg-slate-900 border-slate-800 text-slate-500'
                  }`}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>

        {/* Price Threshold */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-[11px]">
            <span className="text-slate-400 font-medium">Max Budget</span>
            <span className="font-mono text-white font-bold">${filters.maxPrice ?? maxPossiblePrice}</span>
          </div>
          <input
            type="range"
            min={20}
            max={maxPossiblePrice}
            step={5}
            value={filters.maxPrice ?? maxPossiblePrice}
            onChange={(e) => onChange({ ...filters, maxPrice: parseFloat(e.target.value) })}
            className="w-full accent-indigo-500 cursor-pointer"
          />
        </div>

        {/* Rating threshold */}
        <div className="space-y-1.5">
          <label className="text-slate-400 font-medium text-[11px]">Min Rating</label>
          <div className="flex gap-1.5">
            {[0, 4.0, 4.5].map((r) => (
              <button
                key={r}
                onClick={() => onChange({ ...filters, minRating: r === 0 ? undefined : r })}
                className={`px-2 py-1 rounded-lg border text-xs transition-colors ${
                  (r === 0 && filters.minRating === undefined) || filters.minRating === r
                    ? 'bg-amber-500/10 border-amber-500/40 text-amber-300 font-medium'
                    : 'bg-slate-900 border-slate-800 text-slate-500'
                }`}
              >
                {r === 0 ? 'All' : `${r}★+`}
              </button>
            ))}
          </div>
        </div>

        {/* Sort */}
        <div className="space-y-1.5">
          <label className="text-slate-400 font-medium text-[11px]">Display Sorting</label>
          <select
            value={filters.sortBy}
            onChange={(e) => onChange({ ...filters, sortBy: e.target.value as SearchFilterState['sortBy'] })}
            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-indigo-500/50"
          >
            <option value="score">Best Match (IGNA Rank)</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="rating">Highest Rated</option>
          </select>
        </div>
      </div>
    </div>
  );
};
