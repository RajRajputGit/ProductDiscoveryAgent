import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Terminal } from 'lucide-react';
import { PipelineStage } from '../../types/shopping';

interface ActivityLogProps {
  stages: PipelineStage[];
}

export const ActivityLog: React.FC<ActivityLogProps> = ({ stages }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="w-full rounded-2xl bg-[#0e1017] border border-slate-800 overflow-hidden shadow-md">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-slate-800/40 transition-colors"
      >
        <div className="flex items-center gap-2.5 text-xs text-slate-300 font-mono">
          <Terminal className="w-4 h-4 text-indigo-400" />
          <span>Research Activity &amp; Raw Events</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
          <span>{isOpen ? 'Hide details' : 'View details'}</span>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {isOpen && (
        <div className="p-4 bg-black/60 border-t border-slate-800/80 font-mono text-[11px] text-slate-400 space-y-2 max-h-60 overflow-y-auto">
          {stages.map((stage) => (
            <div key={stage.id} className="pb-2 border-b border-slate-800/40 last:border-0 last:pb-0">
              <div className="flex items-center gap-2">
                <span className="text-slate-500">[{stage.layer}]</span>
                <span className="text-slate-200">{stage.name}</span>
                <span className="text-slate-500">→</span>
                <span className={stage.status === 'completed' ? 'text-emerald-400' : 'text-indigo-400'}>
                  {stage.status.toUpperCase()}
                </span>
              </div>
              {stage.details?.map((item, idx) => (
                <div key={idx} className="text-slate-500 pl-4">
                  ↳ {item}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
