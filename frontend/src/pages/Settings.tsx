import React, { useState } from 'react';
import { Sliders, ShieldCheck, Check, Database, Sparkles, ArrowLeft } from 'lucide-react';
import { DEFAULT_WEIGHTS } from '../mock/shoppingData';

interface SettingsProps {
  onBack: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ onBack }) => {
  const [sources, setSources] = useState({
    amazon: true,
    ebay: true,
    walmart: true,
  });
  const [maxProductsPerSite, setMaxProductsPerSite] = useState(10);
  const [topK, setTopK] = useState(5);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-fade-in">
      <div>
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-medium mb-3 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </button>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          System Preferences
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Configure default search targets, limits, and review mathematical scoring weights.
        </p>
      </div>

      {/* Target Sources */}
      <div className="p-6 rounded-2xl bg-[#12131c] border border-slate-800 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-800/80">
          <Database className="w-4 h-4 text-indigo-400" />
          <h3 className="text-sm font-semibold text-white">Default E-Commerce Sources</h3>
        </div>

        <p className="text-xs text-slate-400">
          Platforms queried concurrently via the CUA browser automation layer.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {Object.entries(sources).map(([site, checked]) => (
            <label
              key={site}
              className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                checked
                  ? 'bg-indigo-950/20 border-indigo-500/40 text-white'
                  : 'bg-slate-900 border-slate-800 text-slate-500'
              }`}
            >
              <span className="text-xs font-bold capitalize">{site}</span>
              <input
                type="checkbox"
                checked={checked}
                onChange={() => setSources({ ...sources, [site]: !checked })}
                className="rounded accent-indigo-500 w-4 h-4 cursor-pointer"
              />
            </label>
          ))}
        </div>
      </div>

      {/* Limits & Capacity */}
      <div className="p-6 rounded-2xl bg-[#12131c] border border-slate-800 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-800/80">
          <Sliders className="w-4 h-4 text-indigo-400" />
          <h3 className="text-sm font-semibold text-white">Execution Bounds</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs text-slate-300 font-medium">Max items per site</label>
            <input
              type="number"
              min={3}
              max={25}
              value={maxProductsPerSite}
              onChange={(e) => setMaxProductsPerSite(parseInt(e.target.value) || 10)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-indigo-500"
            />
            <span className="text-[10px] text-slate-500">Default: 10 items per site</span>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-slate-300 font-medium">Top ranked results</label>
            <input
              type="number"
              min={3}
              max={10}
              value={topK}
              onChange={(e) => setTopK(parseInt(e.target.value) || 5)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-indigo-500"
            />
            <span className="text-[10px] text-slate-500">Default: Top 5 recommendations</span>
          </div>
        </div>
      </div>

      {/* Scoring Weights Review */}
      <div className="p-6 rounded-2xl bg-[#12131c] border border-slate-800 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-white">Mathematical Scoring Weights</h3>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Backend Enforced
          </span>
        </div>

        <p className="text-xs text-slate-400">
          These weights are configured in the Python backend (<code className="text-indigo-300 font-mono">config/settings.py</code>) to maintain absolute mathematical reproducibility.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
            <div className="text-lg font-bold font-mono text-indigo-400">
              {(DEFAULT_WEIGHTS.material * 100).toFixed(0)}%
            </div>
            <div className="text-xs text-slate-300 font-medium mt-0.5">Material</div>
            <div className="text-[10px] text-slate-500">Fabric purity</div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
            <div className="text-lg font-bold font-mono text-emerald-400">
              {(DEFAULT_WEIGHTS.price * 100).toFixed(0)}%
            </div>
            <div className="text-xs text-slate-300 font-medium mt-0.5">Price</div>
            <div className="text-[10px] text-slate-500">Budget headroom</div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
            <div className="text-lg font-bold font-mono text-sky-400">
              {(DEFAULT_WEIGHTS.shipping * 100).toFixed(0)}%
            </div>
            <div className="text-xs text-slate-300 font-medium mt-0.5">Shipping</div>
            <div className="text-[10px] text-slate-500">Free delivery</div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
            <div className="text-lg font-bold font-mono text-amber-400">
              {(DEFAULT_WEIGHTS.rating * 100).toFixed(0)}%
            </div>
            <div className="text-xs text-slate-300 font-medium mt-0.5">Rating</div>
            <div className="text-[10px] text-slate-500">User reviews</div>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button
          onClick={handleSave}
          className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-colors shadow-md"
        >
          {isSaved ? <Check className="w-4 h-4 text-emerald-300" /> : null}
          <span>{isSaved ? 'Preferences Saved' : 'Save Preferences'}</span>
        </button>
      </div>
    </div>
  );
};
