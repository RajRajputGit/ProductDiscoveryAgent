import React from 'react';
import { SearchBox } from '../components/search/SearchBox';
import { ExampleQueries } from '../components/search/ExampleQueries';
import { ArchitectureVisualizer } from '../components/research/ArchitectureVisualizer';
import { Sparkles, CheckCircle2, ShieldCheck, Compass, Zap } from 'lucide-react';

interface HomeProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
}

export const Home: React.FC<HomeProps> = ({ onSearch, isLoading }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] px-4 sm:px-6 lg:px-8 py-12 max-w-4xl mx-auto space-y-12">
      {/* Hero Section */}
      <div className="text-center space-y-4 max-w-2xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold tracking-wide">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Next-Generation Multi-Source Shopping Agent</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.15]">
          Find the right product.{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-indigo-200 to-emerald-400">
            Without the endless searching.
          </span>
        </h1>

        <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto leading-relaxed">
          Tell IGNA what you need. It searches multiple sources, strictly validates requirements, 
          and mathematically ranks the best options for you.
        </p>
      </div>

      {/* Main Search Input */}
      <div className="w-full space-y-5">
        <SearchBox onSearch={onSearch} isLoading={isLoading} />
        <ExampleQueries onSelect={onSearch} />
      </div>

      {/* Architecture Showcase */}
      <div className="w-full pt-4">
        <ArchitectureVisualizer />
      </div>

      {/* Trust & Transparency Features */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full pt-2">
        <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/80 text-left">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-2.5">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-semibold text-white">Strict Hard Filters</h4>
          <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
            Eliminates out-of-budget and wrong-size items before scoring. No false promises.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/80 text-left">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-2.5">
            <Compass className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-semibold text-white">CUA Browser Control</h4>
          <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
            Directly extracts products across Amazon, eBay, and Walmart with error isolation.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/80 text-left">
          <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 mb-2.5">
            <Zap className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-semibold text-white">Mathematical Explainability</h4>
          <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
            100% deterministic ranking (40% Material + 30% Price + 20% Ship + 10% Rating).
          </p>
        </div>
      </div>
    </div>
  );
};
