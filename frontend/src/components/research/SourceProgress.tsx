import React from 'react';
import { CheckCircle2, Loader2, AlertCircle, Clock } from 'lucide-react';
import { SourceStatus } from '../../types/shopping';

interface SourceProgressProps {
  sources: Record<string, SourceStatus>;
}

export const SourceProgress: React.FC<SourceProgressProps> = ({ sources }) => {
  const sourceKeys = Object.keys(sources);

  const getSourceIcon = (status: SourceStatus['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'running':
        return <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-amber-400" />;
      default:
        return <Clock className="w-4 h-4 text-slate-500" />;
    }
  };

  const getStatusBadge = (status: SourceStatus['status'], count: number) => {
    switch (status) {
      case 'completed':
        return (
          <span className="text-[11px] font-mono font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
            {count} products extracted
          </span>
        );
      case 'running':
        return (
          <span className="text-[11px] font-mono font-medium text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20 animate-pulse">
            Searching catalog...
          </span>
        );
      case 'failed':
        return (
          <span className="text-[11px] font-mono font-medium text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
            Isolated error
          </span>
        );
      default:
        return (
          <span className="text-[11px] font-mono font-medium text-slate-500 bg-slate-800/40 px-2 py-0.5 rounded-full border border-slate-800">
            Pending task
          </span>
        );
    }
  };

  return (
    <div className="w-full rounded-2xl bg-[#12131c] border border-slate-800 p-5 shadow-lg space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
        <div>
          <h4 className="text-sm font-semibold text-white">CUA Browser Execution Status</h4>
          <p className="text-xs text-slate-400">Playwright async scraping across independent targets</p>
        </div>
        <span className="text-xs font-mono text-slate-400">
          {sourceKeys.filter((k) => sources[k].status === 'completed').length} / {sourceKeys.length} Completed
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {sourceKeys.map((key) => {
          const item = sources[key];
          return (
            <div
              key={key}
              className={`p-3.5 rounded-xl border transition-all duration-300 ${
                item.status === 'running'
                  ? 'bg-indigo-950/20 border-indigo-500/40 shadow-[0_0_15px_-3px_rgba(99,102,241,0.2)]'
                  : item.status === 'completed'
                  ? 'bg-slate-900/60 border-slate-800'
                  : 'bg-slate-900/30 border-slate-800/50 opacity-70'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-slate-200">{item.site}</span>
                {getSourceIcon(item.status)}
              </div>
              <div className="mt-1">
                {getStatusBadge(item.status, item.products_found)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
