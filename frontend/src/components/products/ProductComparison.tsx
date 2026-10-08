import React, { useState } from 'react';
import { ValidatedProduct } from '../../types/shopping';
import { ArrowUpDown, Star, ExternalLink, ArrowRight } from 'lucide-react';

interface ProductComparisonProps {
  products: ValidatedProduct[];
  onSelect: (item: ValidatedProduct) => void;
}

type SortField = 'score' | 'price' | 'rating';

export const ProductComparison: React.FC<ProductComparisonProps> = ({ products, onSelect }) => {
  const [sortField, setSortField] = useState<SortField>('score');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(field === 'price'); // low to high by default for price
    }
  };

  const sortedProducts = [...products].sort((a, b) => {
    let diff = 0;
    if (sortField === 'score') {
      diff = a.final_score - b.final_score;
    } else if (sortField === 'price') {
      diff = a.product.price - b.product.price;
    } else if (sortField === 'rating') {
      diff = (a.product.rating || 0) - (b.product.rating || 0);
    }
    return sortAsc ? diff : -diff;
  });

  return (
    <div className="w-full rounded-2xl bg-[#12131c] border border-slate-800 overflow-hidden shadow-xl">
      <div className="p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
        <div>
          <span>Comparing </span>
          <strong className="text-white">{products.length} Validated Products</strong>
        </div>
        <div className="flex items-center gap-2">
          <span>Sort view by:</span>
          <button
            onClick={() => handleSort('score')}
            className={`px-2.5 py-1 rounded-lg border font-mono transition-colors ${
              sortField === 'score' ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-300' : 'bg-slate-900 border-slate-800 text-slate-300'
            }`}
          >
            Score {sortField === 'score' && (sortAsc ? '↑' : '↓')}
          </button>
          <button
            onClick={() => handleSort('price')}
            className={`px-2.5 py-1 rounded-lg border font-mono transition-colors ${
              sortField === 'price' ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-300' : 'bg-slate-900 border-slate-800 text-slate-300'
            }`}
          >
            Price {sortField === 'price' && (sortAsc ? '↑' : '↓')}
          </button>
          <button
            onClick={() => handleSort('rating')}
            className={`px-2.5 py-1 rounded-lg border font-mono transition-colors ${
              sortField === 'rating' ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-300' : 'bg-slate-900 border-slate-800 text-slate-300'
            }`}
          >
            Rating {sortField === 'rating' && (sortAsc ? '↑' : '↓')}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-mono uppercase text-[11px]">
              <th className="py-3 px-4">Rank</th>
              <th className="py-3 px-4">Product</th>
              <th className="py-3 px-4">Source</th>
              <th className="py-3 px-4 cursor-pointer hover:text-white" onClick={() => handleSort('price')}>
                <div className="flex items-center gap-1">
                  <span>Price</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3 px-4">Sizes</th>
              <th className="py-3 px-4">Material</th>
              <th className="py-3 px-4 cursor-pointer hover:text-white" onClick={() => handleSort('rating')}>
                <div className="flex items-center gap-1">
                  <span>Rating</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3 px-4">Shipping</th>
              <th className="py-3 px-4 cursor-pointer hover:text-white" onClick={() => handleSort('score')}>
                <div className="flex items-center gap-1">
                  <span>Score</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {sortedProducts.map((item, idx) => {
              const p = item.product;
              const isTop = idx === 0 && sortField === 'score' && !sortAsc;

              return (
                <tr
                  key={p.id}
                  className={`hover:bg-slate-850/50 transition-colors ${
                    isTop ? 'bg-indigo-950/10' : ''
                  }`}
                >
                  <td className="py-3 px-4 font-mono font-bold text-slate-300">
                    {isTop ? (
                      <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[10px] border border-indigo-500/30">
                        #1
                      </span>
                    ) : (
                      `#${idx + 1}`
                    )}
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-100 max-w-xs">
                    <div className="flex items-center gap-2.5">
                      {p.image_url ? (
                        <img
                          src={p.image_url}
                          alt=""
                          className="w-8 h-8 rounded-lg object-cover shrink-0 bg-slate-900 border border-slate-800"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 shrink-0 flex items-center justify-center">
                          <span className="text-[10px] text-slate-600 font-mono">#</span>
                        </div>
                      )}
                      <span className="truncate">{p.title}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-mono text-[10px] uppercase px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                      {p.source}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-white">
                    ${p.price.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-slate-300">
                    {p.sizes.join(', ') || 'N/A'}
                  </td>
                  <td className="py-3 px-4 capitalize text-slate-300">
                    {p.material || 'Standard'}
                  </td>
                  <td className="py-3 px-4 text-amber-400">
                    {p.rating ? (
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 fill-amber-400" />
                        <span>{p.rating.toFixed(1)}</span>
                      </div>
                    ) : (
                      <span className="text-slate-500">Unrated</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-300">
                    {p.shipping_cost === 0 ? (
                      <span className="text-emerald-400 font-medium">Free</span>
                    ) : (
                      `$${p.shipping_cost.toFixed(2)}`
                    )}
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                    {(item.final_score * 100).toFixed(0)}%
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => onSelect(item)}
                      className="px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600 border border-indigo-500/30 text-indigo-300 hover:text-white transition-colors text-xs inline-flex items-center gap-1"
                    >
                      <span>View</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
