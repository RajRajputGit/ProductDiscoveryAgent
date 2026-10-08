import React from 'react';
import { Star, Truck, ArrowRight, Tag } from 'lucide-react';
import { ValidatedProduct } from '../../types/shopping';

interface ProductCardProps {
  item: ValidatedProduct;
  rank: number;
  onSelect: (item: ValidatedProduct) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ item, rank, onSelect }) => {
  const p = item.product;
  const matchPercent = Math.round(item.final_score * 100);
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
    <div className="flex flex-col rounded-2xl bg-[#12131c] hover:bg-[#151722] border border-slate-800 hover:border-slate-700 transition-all duration-300 shadow-md hover:shadow-xl hover:-translate-y-1 overflow-hidden group">
      {/* Thumbnail */}
      <div className="relative aspect-[4/3] w-full bg-slate-900 overflow-hidden flex items-center justify-center">
        {p.image_url && !imgError ? (
          <img
            src={p.image_url}
            alt={p.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <Tag className="w-10 h-10 text-slate-700" />
        )}

        {/* Rank Badge */}
        <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-sm border border-slate-700 text-[11px] font-mono font-bold text-white">
          #{rank}
        </div>

        {/* Source Badge */}
        <div className="absolute top-2.5 right-2.5">
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${getSourceBadgeStyle(p.source)}`}>
            {p.source.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <h4 className="text-sm font-semibold text-slate-100 group-hover:text-indigo-300 transition-colors line-clamp-2 leading-snug">
            {p.title}
          </h4>

          {/* Price & Rating */}
          <div className="flex items-center justify-between mt-2.5">
            <span className="text-base font-bold text-white font-mono">
              ${p.price.toFixed(2)}
            </span>
            {p.rating && (
              <div className="flex items-center gap-1 text-xs text-amber-400 font-semibold">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                <span>{p.rating.toFixed(1)}</span>
              </div>
            )}
          </div>

          {/* Quick specs */}
          <div className="text-[11px] text-slate-400 mt-2 space-y-1">
            <div className="flex items-center justify-between">
              <span>Material:</span>
              <span className="text-slate-200 capitalize truncate max-w-[120px]">{p.material || 'Standard'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Sizes:</span>
              <span className="text-slate-200">{p.sizes.join(', ') || 'N/A'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Shipping:</span>
              <span className="text-slate-300">{p.shipping_cost === 0 ? 'Free' : `$${p.shipping_cost.toFixed(2)}`}</span>
            </div>
          </div>
        </div>

        {/* Match Score Meter */}
        <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Score</span>
            <span className="font-mono font-bold text-emerald-400">{matchPercent}%</span>
          </div>
          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full"
              style={{ width: `${matchPercent}%` }}
            />
          </div>

          <button
            onClick={() => onSelect(item)}
            className="w-full mt-3 py-2 px-3 rounded-xl bg-slate-900 hover:bg-indigo-600/20 border border-slate-800 hover:border-indigo-500/40 text-xs font-medium text-slate-300 hover:text-indigo-200 transition-colors flex items-center justify-center gap-1.5"
          >
            <span>View Details</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
