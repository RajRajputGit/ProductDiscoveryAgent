import React from 'react';
import { Sparkles } from 'lucide-react';

interface ExampleQueriesProps {
  onSelect: (query: string) => void;
}

export const ExampleQueries: React.FC<ExampleQueriesProps> = ({ onSelect }) => {
  const examples = [
    { label: "Men's cotton coat under $100, size M or L", category: "Outerwear" },
    { label: "Running shoes under $120, size 9", category: "Footwear" },
    { label: "Women's wool sweater under $70, size L", category: "Knitwear" },
    { label: "Men's cotton jacket under $80, size M", category: "Jacket" },
  ];

  return (
    <div className="w-full space-y-3">
      <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
        <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
        <span>Popular research queries</span>
      </div>

      <div className="flex flex-wrap gap-2 sm:gap-2.5">
        {examples.map((item, idx) => (
          <button
            key={idx}
            onClick={() => onSelect(item.label)}
            className="flex items-center gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 hover:border-indigo-500/40 text-xs sm:text-sm text-slate-300 hover:text-white transition-all duration-200 group text-left"
          >
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 group-hover:text-indigo-300 border border-slate-700/50">
              {item.category}
            </span>
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
