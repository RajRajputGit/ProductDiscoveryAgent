import React from 'react';
import { X, Clock, Trash2, ArrowUpRight } from 'lucide-react';
import { HistoryItem } from '../../hooks/useHistory';

interface SearchHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryItem[];
  onSelectQuery: (query: string) => void;
  onClearHistory: () => void;
}

export const SearchHistoryModal: React.FC<SearchHistoryModalProps> = ({
  isOpen,
  onClose,
  history,
  onSelectQuery,
  onClearHistory,
}) => {
  if (!isOpen) return null;

  const formatTime = (ts: number) => {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div 
        className="relative w-full max-w-lg bg-[#12131c] border border-slate-800 rounded-2xl shadow-2xl p-6 max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-indigo-400" />
            <h3 className="text-base font-semibold text-white">Recent Searches</h3>
          </div>
          <div className="flex items-center gap-2">
            {history.length > 0 && (
              <button
                onClick={onClearHistory}
                className="flex items-center gap-1 px-2.5 py-1 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto py-3 space-y-2 flex-1">
          {history.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-sm">
              No recent searches found.
            </div>
          ) : (
            history.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onSelectQuery(item.query);
                  onClose();
                }}
                className="w-full text-left p-3 rounded-xl bg-slate-900/40 hover:bg-slate-800/60 border border-slate-800/60 hover:border-indigo-500/30 transition-all group flex items-center justify-between"
              >
                <div className="pr-4 truncate">
                  <div className="text-sm text-slate-200 group-hover:text-white font-medium truncate">
                    {item.query}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {formatTime(item.timestamp)}
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-colors shrink-0" />
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
