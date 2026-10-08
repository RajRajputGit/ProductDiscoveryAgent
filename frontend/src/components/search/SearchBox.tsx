import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, ArrowRight, X, Loader2 } from 'lucide-react';

interface SearchBoxProps {
  initialQuery?: string;
  onSearch: (query: string) => void;
  isLoading?: boolean;
}

export const SearchBox: React.FC<SearchBoxProps> = ({
  initialQuery = '',
  onSearch,
  isLoading = false,
}) => {
  const [query, setQuery] = useState(initialQuery);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
    }
  }, [initialQuery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;
    onSearch(query.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleClear = () => {
    setQuery('');
    inputRef.current?.focus();
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="relative group rounded-2xl bg-gradient-to-b from-[#181926] to-[#12131c] border border-slate-800 p-1.5 sm:p-2 shadow-2xl transition-all duration-300 focus-within:border-indigo-500/60 focus-within:shadow-[0_0_35px_-5px_rgba(99,102,241,0.25)]">
        <div className="flex items-center gap-2 sm:gap-3 px-2">
          {/* AI Sparkle Icon */}
          <div className="shrink-0 text-indigo-400 pl-1">
            <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 transition-transform group-focus-within:rotate-12 group-focus-within:scale-110" />
          </div>

          {/* Input text */}
          <input
            ref={inputRef}
            type="text"
            value={query}
            disabled={isLoading}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe what you're looking for... e.g. Men's cotton coat under $100, size M or L"
            className="w-full bg-transparent text-sm sm:text-base text-slate-100 placeholder-slate-500 py-3 sm:py-3.5 focus:outline-none disabled:opacity-50"
            autoFocus
          />

          {/* Clear button */}
          {query.length > 0 && !isLoading && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-full text-slate-500 hover:text-slate-300 hover:bg-slate-800/80 transition-colors"
              aria-label="Clear query"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Research Button */}
          <button
            type="submit"
            disabled={!query.trim() || isLoading}
            className="shrink-0 flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-medium text-xs sm:text-sm transition-all duration-200 shadow-md hover:shadow-indigo-500/25 active:scale-95 disabled:scale-100 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="hidden sm:inline">Researching...</span>
              </>
            ) : (
              <>
                <span>Research</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
};
