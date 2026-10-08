import React from 'react';
import { Sparkles, Check, CheckCircle2 } from 'lucide-react';
import { ValidatedProduct, ShoppingQuery } from '../../types/shopping';

interface RecommendationReasonProps {
  bestProduct: ValidatedProduct;
  query: ShoppingQuery;
  explanation: string;
}

export const RecommendationReason: React.FC<RecommendationReasonProps> = ({
  bestProduct,
  query,
  explanation,
}) => {
  const p = bestProduct.product;

  const keyAttributes = [
    { label: p.material ? `${p.material.toUpperCase()}` : 'Quality Material', active: bestProduct.material_score >= 0.7 },
    { label: query.max_price ? `$${(query.max_price - p.price).toFixed(2)} Under Budget` : 'Competitive Price', active: bestProduct.price_score > 0 },
    { label: `Size ${query.sizes.filter((s) => p.sizes.includes(s)).join(', ') || p.sizes.join(', ')} In Stock`, active: true },
    { label: p.shipping_cost === 0 ? 'Free Shipping' : `$${p.shipping_cost.toFixed(2)} Shipping`, active: bestProduct.shipping_score >= 0.5 },
    { label: p.rating ? `${p.rating.toFixed(1)}/5.0 Customer Rating` : 'Verified Seller', active: true },
  ];

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-indigo-950/20 via-[#12131c] to-[#0f1018] border border-indigo-500/30 shadow-lg space-y-4">
      <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs uppercase tracking-wider">
        <Sparkles className="w-4 h-4 text-indigo-400" />
        <span>Why IGNA Recommends This</span>
      </div>

      <p className="text-sm text-slate-200 leading-relaxed font-normal">
        {explanation}
      </p>

      {/* Pill Attribute highlights */}
      <div className="flex flex-wrap gap-2 pt-1">
        {keyAttributes.map((attr, idx) => (
          <div
            key={idx}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/80 border border-indigo-500/20 text-xs font-medium text-slate-300"
          >
            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>{attr.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
