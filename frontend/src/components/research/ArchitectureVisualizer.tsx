import React from 'react';
import { Brain, Compass, ArrowRight, ArrowDown } from 'lucide-react';

export const ArchitectureVisualizer: React.FC = () => {
  return (
    <div className="w-full rounded-2xl bg-gradient-to-br from-[#12131c] to-[#0d0e15] border border-slate-800/80 p-5 sm:p-6 shadow-xl">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800/60">
        <div>
          <h3 className="text-sm font-semibold text-white tracking-tight">System Architecture</h3>
          <p className="text-xs text-slate-400">Strict separation of Decision &amp; Browser Execution</p>
        </div>
        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
          Decoupled Flow
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
        {/* Layer 1: IGNA Brain */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-indigo-500/30 shadow-sm relative">
          <div className="flex items-center gap-2 mb-2 text-indigo-400 font-semibold text-xs uppercase tracking-wider">
            <Brain className="w-4 h-4 shrink-0" />
            <span>1. IGNA Layer (Brain)</span>
          </div>
          <p className="text-xs text-slate-300 font-medium">Input Understanding &amp; Planning</p>
          <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
            Extracts semantic requirements (budget, sizes, material) and creates deterministic execution tasks.
          </p>
        </div>

        {/* Transition Arrow for desktop */}
        <div className="hidden md:flex flex-col items-center justify-center text-slate-500">
          <div className="flex items-center gap-1 text-[10px] font-mono text-slate-400 uppercase">
            <span>Tasks</span>
            <ArrowRight className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
          </div>
        </div>

        {/* Layer 2: CUA Execution */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-emerald-500/30 shadow-sm relative">
          <div className="flex items-center gap-2 mb-2 text-emerald-400 font-semibold text-xs uppercase tracking-wider">
            <Compass className="w-4 h-4 shrink-0" />
            <span>2. CUA Layer (Execution)</span>
          </div>
          <p className="text-xs text-slate-300 font-medium">Playwright Browser Control</p>
          <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
            Navigates Amazon, eBay &amp; Walmart. Handles DOM scraping, bot-block isolation, and data normalization.
          </p>
        </div>
      </div>

      {/* Return to IGNA Validation & Ranking */}
      <div className="mt-3 p-4 rounded-xl bg-slate-900/60 border border-indigo-500/30">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs uppercase tracking-wider">
            <Brain className="w-4 h-4 shrink-0" />
            <span>3. IGNA Layer (Validation &amp; Ranking)</span>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
            Mathematical Rules
          </span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          Enforces strict hard filters (budget, sizes), deduplicates cross-listed items, calculates weighted scores (0.4 Mat + 0.3 Price + 0.2 Ship + 0.1 Rating), and generates explainable recommendation rationale.
        </p>
      </div>
    </div>
  );
};
