import React from 'react';
import { CheckCircle2, Loader2, Clock, AlertCircle } from 'lucide-react';
import { PipelineStage } from '../../types/shopping';

interface ResearchTimelineProps {
  stages: PipelineStage[];
}

export const ResearchTimeline: React.FC<ResearchTimelineProps> = ({ stages }) => {
  return (
    <div className="w-full rounded-2xl bg-[#12131c] border border-slate-800 p-5 sm:p-6 shadow-xl space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
        <div>
          <h3 className="text-base font-semibold text-white">Execution Pipeline</h3>
          <p className="text-xs text-slate-400">Step-by-step audit trail of agent progress</p>
        </div>
      </div>

      <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
        {stages.map((stage) => {
          const isDone = stage.status === 'completed';
          const isCurrent = stage.status === 'running';
          const isPending = stage.status === 'pending';

          return (
            <div key={stage.id} className="relative group">
              {/* Timeline marker icon */}
              <div
                className={`absolute -left-6 sm:-left-8 top-0.5 w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center transition-all ${
                  isDone
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    : isCurrent
                    ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)] animate-pulse'
                    : 'bg-slate-900 text-slate-600 border border-slate-800'
                }`}
              >
                {isDone ? (
                  <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
                ) : isCurrent ? (
                  <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin text-white" />
                ) : (
                  <Clock className="w-3 h-3 text-slate-600" />
                )}
              </div>

              {/* Stage content */}
              <div
                className={`p-3.5 sm:p-4 rounded-xl border transition-all ${
                  isCurrent
                    ? 'bg-indigo-950/20 border-indigo-500/30 shadow-sm'
                    : isDone
                    ? 'bg-slate-900/40 border-slate-800/80'
                    : 'bg-slate-900/20 border-slate-800/40 opacity-50'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                        stage.layer === 'IGNA'
                          ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}
                    >
                      {stage.layer}
                    </span>
                    <h4 className="text-sm font-semibold text-white">{stage.name}</h4>
                  </div>
                  <span
                    className={`text-xs font-mono capitalize ${
                      isDone
                        ? 'text-emerald-400'
                        : isCurrent
                        ? 'text-indigo-400 font-medium'
                        : 'text-slate-500'
                    }`}
                  >
                    {isCurrent ? 'Running...' : stage.status}
                  </span>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">{stage.description}</p>

                {/* Granular details when available */}
                {stage.details && stage.details.length > 0 && isDone && (
                  <div className="mt-2.5 pt-2 border-t border-slate-800/60 space-y-1">
                    {stage.details.map((detail, dIdx) => (
                      <div key={dIdx} className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-slate-600"></span>
                        <span>{detail}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
