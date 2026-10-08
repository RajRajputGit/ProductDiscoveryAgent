import React from 'react';
import { ValidatedProduct, RankingWeights } from '../../types/shopping';

interface ScoreBreakdownProps {
  validatedProduct: ValidatedProduct;
  weights: RankingWeights;
  compact?: boolean;
}

export const ScoreBreakdown: React.FC<ScoreBreakdownProps> = ({
  validatedProduct,
  weights,
  compact = false,
}) => {
  const { material_score, price_score, shipping_score, rating_score, final_score } = validatedProduct;

  const metrics = [
    { label: 'Material Quality', score: material_score, weight: weights.material, color: 'bg-indigo-500' },
    { label: 'Price Headroom', score: price_score, weight: weights.price, color: 'bg-emerald-500' },
    { label: 'Shipping Value', score: shipping_score, weight: weights.shipping, color: 'bg-sky-500' },
    { label: 'Customer Rating', score: rating_score, weight: weights.rating, color: 'bg-amber-500' },
  ];

  if (compact) {
    return (
      <div className="space-y-1.5 w-full">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400 font-medium">Match Score</span>
          <span className="font-bold text-white font-mono text-sm">
            {(final_score * 100).toFixed(0)}%
          </span>
        </div>
        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden flex">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, Math.max(0, final_score * 100))}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-xl bg-black/40 border border-slate-800 space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
        <div className="text-xs font-semibold text-slate-300">Deterministic Score Breakdown</div>
        <div className="text-xs font-mono text-indigo-400 font-bold">
          Total: {(final_score * 100).toFixed(0)}%
        </div>
      </div>

      <div className="space-y-2.5">
        {metrics.map((m) => {
          const contrib = m.score * m.weight * 100;
          return (
            <div key={m.label} className="space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">
                  {m.label} <span className="text-slate-600">({(m.weight * 100).toFixed(0)}% weight)</span>
                </span>
                <span className="font-mono text-slate-200">
                  {(m.score * 100).toFixed(0)}% <span className="text-slate-500">→ +{contrib.toFixed(1)}%</span>
                </span>
              </div>
              <div className="h-1.5 w-full bg-slate-800/80 rounded-full overflow-hidden">
                <div
                  className={`h-full ${m.color} rounded-full transition-all duration-300`}
                  style={{ width: `${Math.min(100, Math.max(0, m.score * 100))}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-[10px] text-slate-500 pt-1 font-mono">
        Formula: (Material × 0.4) + (Price × 0.3) + (Shipping × 0.2) + (Rating × 0.1)
      </div>
    </div>
  );
};
