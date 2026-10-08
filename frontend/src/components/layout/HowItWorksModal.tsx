import React from 'react';
import { X, Brain, Compass, Cpu, Layers, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface HowItWorksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowItWorksModal: React.FC<HowItWorksModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div 
        className="relative w-full max-w-2xl bg-[#12131c] border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">How IGNA Works</h2>
            <p className="text-xs text-slate-400 font-mono">Controlled Hybrid AI Architecture</p>
          </div>
        </div>

        <div className="space-y-6 text-sm text-slate-300">
          <p className="leading-relaxed text-slate-300">
            Unlike generic AI chatbots that scrape hallucinated data or simple search engines that return sponsored spam, 
            <strong className="text-white"> IGNA</strong> separates high-level planning from deterministic browser execution.
          </p>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-indigo-500/20">
              <div className="flex items-center gap-2 mb-2 text-indigo-400 font-semibold">
                <Brain className="w-4 h-4" />
                <span>IGNA Layer (Brain)</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-400">
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                  <span><strong>Input Understanding:</strong> Parses semantic criteria into Pydantic contracts.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                  <span><strong>Deterministic Planning:</strong> Generates strict website search tasks without LLM drift.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                  <span><strong>Hard Filter Validation:</strong> Strictly rejects over-budget and wrong-size items.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                  <span><strong>Formulaic Ranking:</strong> Scores candidates via exact mathematical weights.</span>
                </li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-emerald-500/20">
              <div className="flex items-center gap-2 mb-2 text-emerald-400 font-semibold">
                <Compass className="w-4 h-4" />
                <span>CUA Layer (Execution)</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-400">
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Browser Automation:</strong> Playwright navigates Amazon, eBay, and Walmart.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>DOM Extraction:</strong> Scrapes titles, prices, ratings, and shipping options.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Error Isolation:</strong> Platform bot blocks fail gracefully without halting the pipeline.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Data Normalization:</strong> Formats raw payloads into clean <code className="text-emerald-300">Product</code> models.</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800">
            <h4 className="text-xs uppercase font-semibold tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              <span>Mathematical Scoring Formula</span>
            </h4>
            <div className="p-2.5 rounded-lg bg-black/50 font-mono text-xs text-indigo-300 border border-slate-800">
              Score = (Material × 0.4) + (Price × 0.3) + (Shipping × 0.2) + (Rating × 0.1)
            </div>
            <p className="text-xs text-slate-400 mt-2">
              The AI never decides the winner arbitrarily. The LLM only explains the mathematically highest scoring product to ensure total transparency.
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
