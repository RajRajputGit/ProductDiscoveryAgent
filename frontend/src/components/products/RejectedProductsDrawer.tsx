import React, { useState } from 'react';
import { ChevronDown, ChevronUp, ShieldAlert, XCircle } from 'lucide-react';
import { ValidatedProduct } from '../../types/shopping';

interface RejectedProductsDrawerProps {
  rejectedProducts: ValidatedProduct[];
}

export const RejectedProductsDrawer: React.FC<RejectedProductsDrawerProps> = ({
  rejectedProducts,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  if (rejectedProducts.length === 0) return null;

  return (
    <div className="w-full rounded-2xl bg-[#12131c] border border-slate-800 overflow-hidden shadow-lg">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-slate-800/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white">
              Why were {rejectedProducts.length} other items rejected?
            </h4>
            <p className="text-xs text-slate-400">
              Strict hard constraint enforcement (budget limits, missing sizes, category mismatch)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
          <span>{isOpen ? 'Collapse' : 'Inspect rejected'}</span>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {isOpen && (
        <div className="p-4 sm:p-5 bg-slate-950/60 border-t border-slate-800/80 space-y-3">
          <p className="text-xs text-slate-400">
            IGNA enforces non-negotiable hard filters before ranking. If a product fails any hard requirement, it is excluded to prevent presenting incompatible options.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {rejectedProducts.map((item, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-slate-900/60 border border-rose-500/20 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="font-medium text-xs text-slate-200 line-clamp-1">
                    {item.product.title}
                  </div>
                  <span className="font-mono text-xs text-slate-300 shrink-0 font-bold">
                    ${item.product.price.toFixed(2)}
                  </span>
                </div>

                <div className="space-y-1">
                  {item.validation_reasons.map((r, rIdx) => (
                    <div key={rIdx} className="flex items-start gap-1.5 text-xs text-rose-400">
                      <XCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>{r}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 font-mono">
                  <span>Source: {item.product.source.toUpperCase()}</span>
                  <span>Sizes: {item.product.sizes.join(', ') || 'None listed'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
