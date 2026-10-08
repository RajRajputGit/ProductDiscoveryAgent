import React from 'react';
import { X, ExternalLink, Star, Truck, CheckCircle2, ShieldCheck, Tag } from 'lucide-react';
import { ValidatedProduct, RankingWeights } from '../../types/shopping';
import { ScoreBreakdown } from '../recommendation/ScoreBreakdown';

interface ProductDetailsModalProps {
  item: ValidatedProduct | null;
  weights: RankingWeights;
  onClose: () => void;
}

export const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({
  item,
  weights,
  onClose,
}) => {
  if (!item) return null;

  const p = item.product;
  const [imgError, setImgError] = React.useState(false);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl bg-[#12131c] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#161824]">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs uppercase px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-semibold">
              {p.source}
            </span>
            <span className="text-xs text-slate-400">ID: {p.id}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Image Preview */}
            <div className="md:col-span-5 rounded-xl overflow-hidden bg-slate-900 border border-slate-800 aspect-square flex items-center justify-center relative">
              {p.image_url && !imgError ? (
                <img
                  src={p.image_url}
                  alt={p.title}
                  className="w-full h-full object-cover"
                  onError={() => setImgError(true)}
                />
              ) : (
                <Tag className="w-16 h-16 text-slate-700" />
              )}
              <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-black/80 border border-indigo-500/40 font-mono text-xs font-bold text-emerald-400">
                {(item.final_score * 100).toFixed(0)}% Score
              </div>
            </div>

            {/* Main Info */}
            <div className="md:col-span-7 space-y-4">
              <h3 className="text-xl font-bold text-white leading-snug">
                {p.title}
              </h3>

              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-extrabold text-white font-mono">
                  ${p.price.toFixed(2)}
                </span>
                {p.rating && (
                  <div className="flex items-center gap-1 text-amber-400 text-sm font-semibold">
                    <Star className="w-4 h-4 fill-amber-400" />
                    <span>{p.rating.toFixed(1)} / 5.0</span>
                  </div>
                )}
              </div>

              <div className="space-y-2 text-xs text-slate-300 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <div className="flex justify-between">
                  <span className="text-slate-500">Material:</span>
                  <span className="text-white font-medium capitalize">{p.material || 'Standard Fabric'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Available Sizes:</span>
                  <span className="text-white font-medium">{p.sizes.join(', ') || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Shipping:</span>
                  <span className="text-white font-medium">
                    {p.shipping_cost === 0 ? 'Free Shipping' : `$${p.shipping_cost.toFixed(2)}`}
                  </span>
                </div>
              </div>

              {p.description && (
                <p className="text-xs text-slate-400 leading-relaxed">
                  {p.description}
                </p>
              )}

              <a
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center justify-center gap-2 transition-colors shadow-md"
              >
                <span>Open Store Page on {p.source.toUpperCase()}</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Mathematical Score Breakdown */}
          <ScoreBreakdown validatedProduct={item} weights={weights} />

          {/* Validation Reasons */}
          <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 space-y-2">
            <h4 className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Validation Audit Checklist</span>
            </h4>
            <div className="space-y-1">
              {item.validation_reasons.map((reason, idx) => (
                <div key={idx} className="text-xs text-slate-400 flex items-start gap-1.5 font-mono">
                  <span className="text-emerald-400">✓</span>
                  <span>{reason}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
