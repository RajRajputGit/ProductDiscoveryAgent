import React from 'react';
import { Loader2, Sparkles, Brain, ArrowLeft } from 'lucide-react';
import { SearchStatusResponse } from '../api/shopping';
import { ResearchTimeline } from '../components/research/ResearchTimeline';
import { SourceProgress } from '../components/research/SourceProgress';
import { ArchitectureVisualizer } from '../components/research/ArchitectureVisualizer';
import { ActivityLog } from '../components/research/ActivityLog';

interface ResearchProps {
  query: string;
  statusResponse: SearchStatusResponse | null;
  onCancel: () => void;
}

export const Research: React.FC<ResearchProps> = ({ query, statusResponse, onCancel }) => {
  const progressPercent = statusResponse?.progress_percent ?? 15;
  const stages = statusResponse?.stages ?? [];
  const sources = statusResponse?.sources ?? {
    amazon: { site: 'Amazon', status: 'pending', products_found: 0, valid_products: 0 },
  };

  const getContextualMessage = (progress: number) => {
    if (progress < 20) return 'Understanding your shopping criteria and constraints...';
    if (progress < 40) return 'Creating deterministic execution tasks for Amazon...';
    if (progress < 65) return 'Navigating browser and extracting raw catalog items...';
    if (progress < 85) return 'Enforcing hard filters (budget, sizes) and sanitizing data...';
    if (progress < 99) return 'Calculating weighted mathematical scores and deduplicating...';
    return 'Finalizing recommendations...';
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8 animate-fade-in">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>RESEARCH IN PROGRESS</span>
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            IGNA is researching your request
          </h2>

          <div className="inline-block px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300">
            "{query}"
          </div>
        </div>

        <button
          onClick={onCancel}
          className="self-start sm:self-center px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-400 hover:text-white transition-colors"
        >
          Cancel Search
        </button>
      </div>

      {/* Progress Bar & Status Pill */}
      <div className="p-5 rounded-2xl bg-[#12131c] border border-slate-800 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-300 font-medium flex items-center gap-2">
            <Brain className="w-4 h-4 text-indigo-400" />
            <span>{getContextualMessage(progressPercent)}</span>
          </span>
          <span className="font-mono text-indigo-400 font-bold">{progressPercent}%</span>
        </div>

        <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-800">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 via-indigo-400 to-emerald-400 rounded-full transition-all duration-300 shadow-[0_0_12px_rgba(99,102,241,0.5)]"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Architecture Visualizer during research */}
      <ArchitectureVisualizer />

      {/* Live CUA Browser Scrapers */}
      <SourceProgress sources={sources} />

      {/* Vertical Execution Timeline */}
      <ResearchTimeline stages={stages} />

      {/* Collapsible raw logs */}
      <ActivityLog stages={stages} />
    </div>
  );
};
