import React from 'react';
import { Star, ShieldCheck, ExternalLink, ArrowRight, Sparkles, Tag, Truck } from 'lucide-react';
import { ValidatedProduct, RankingWeights } from '../../types/shopping';
import { ScoreBreakdown } from './ScoreBreakdown';

interface BestMatchProps {
  bestProduct: ValidatedProduct;
  weights: RankingWeights;
  onSelect: (item: ValidatedProduct) => void;
}

export const BestMatch: React.FC<BestMatchProps> = ({ bestProduct, weights, onSelect }) => {
  const p = bestProduct.product;
  const matchPercentage = Math.round(bestProduct.final_score * 100);
  const [imgError, setImgError] = React.useState(false);

  const getSourceBadgeStyle = (source: string) => {
    switch (source.toLowerCase()) {
      case 'amazon':
        return 'bg-amber-500/10 text-amber-300 border-amber-500/30';
      case 'ebay':
        return 'bg-blue-500/10 text-blue-300 border-blue-500/30';
      case 'walmart':
        return 'bg-sky-500/10 text-sky-300 border-sky-500/30';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="w-full rounded-2xl bg-gradient-to-b from-[#181926] via-[#12131c] to-[#0f1017] border border-indigo-500/40 p-5 sm:p-7 shadow-[0_0_30px_-5px_rgba(99,102,241,0.2)] relative overflow-hidden">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-600/20 border border-indigo-500/50 text-indigo-300 text-xs font-semibold tracking-wide shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>BEST MATCH FOR YOU</span>
          </span>
          <span className="text-xs text-slate-400 hidden sm:inline">• Ranked #1 Across All Stores</span>
        </div>

        <div className="flex items-center gap-2">
          <span className={`text-xs font-mono font-medium px-2.5 py-0.5 rounded-full border ${getSourceBadgeStyle(p.source)}`}>
            {p.source.toUpperCase()}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Product Image Column */}
        <div className="lg:col-span-4 relative group rounded-xl overflow-hidden bg-slate-900 border border-slate-800/80 aspect-[4/3] sm:aspect-[16/10] lg:aspect-square flex items-center justify-center">
          {p.image_url && !imgError ? (
            <img
              src={p.image_url}
              alt={p.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="text-center p-6 text-slate-600">
              <Tag className="w-12 h-12 mx-auto mb-2 text-slate-700" />
              <span className="text-xs font-mono">Product Preview</span>
            </div>
          )}

          {/* Floating Score Badge on image */}
          <div className="absolute top-3 right-3 px-3 py-1.5 rounded-xl bg-black/80 backdrop-blur-md border border-indigo-500/40 text-center shadow-lg">
            <div className="text-[10px] text-slate-400 uppercase font-mono font-semibold">Match Score</div>
            <div className="text-lg font-bold text-emerald-400 font-mono leading-none">{matchPercentage}%</div>
          </div>
        </div>

        {/* Product Details Column */}
        <div className="lg:col-span-8 flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-snug hover:text-indigo-200 transition-colors">
              {p.title}
            </h3>

            {/* Price & Rating Row */}
            <div className="flex flex-wrap items-baseline gap-4 mt-3">
              <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
                ${p.price.toFixed(2)}
              </span>
              {p.rating && (
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  <span>{p.rating.toFixed(1)}</span>
                </div>
              )}
              <span className="flex items-center gap-1 text-xs text-slate-400">
                <Truck className="w-3.5 h-3.5 text-slate-400" />
                {p.shipping_cost === 0 ? 'Free Shipping' : `$${p.shipping_cost.toFixed(2)} Shipping`}
              </span>
            </div>
          </div>

          {/* Quick Specifications */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
            <div>
              <span className="text-slate-500 block text-[11px]">Material</span>
              <span className="text-slate-200 font-medium capitalize">{p.material || 'Standard Fabric'}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Available Sizes</span>
              <span className="text-slate-200 font-medium">{p.sizes.join(', ') || 'Standard Size'}</span>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <span className="text-slate-500 block text-[11px]">Stock Status</span>
              <span className="text-emerald-400 font-medium">In Stock</span>
            </div>
          </div>

          {/* Interactive Actions */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => onSelect(bestProduct)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all shadow-md hover:shadow-indigo-500/25 active:scale-95"
            >
              <span>View Product &amp; Audit</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <a
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-medium text-sm transition-colors"
            >
              <span>Store Link</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
