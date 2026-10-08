import { useState, useEffect } from 'react';

export interface HistoryItem {
  id: string;
  query: string;
  timestamp: number;
}

const STORAGE_KEY = 'igna_search_history_v1';

export function useSearchHistory() {
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // Fallback
    }
    // Default initial suggestions for first-time user
    return [
      { id: '1', query: "Men's cotton coat under $100, size M or L", timestamp: Date.now() - 1000 * 60 * 15 },
      { id: '2', query: "Running shoes under $120, size 9", timestamp: Date.now() - 1000 * 60 * 60 * 4 },
      { id: '3', query: "Women's wool sweater under $70, size L", timestamp: Date.now() - 1000 * 60 * 60 * 24 },
    ];
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch {
      // storage full or disabled
    }
  }, [history]);

  const addQuery = (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    setHistory((prev) => {
      const filtered = prev.filter((item) => item.query.toLowerCase() !== trimmed.toLowerCase());
      return [
        { id: Date.now().toString(), query: trimmed, timestamp: Date.now() },
        ...filtered,
      ].slice(0, 10);
    });
  };

  const clearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // fallback
    }
  };

  return { history, addQuery, clearHistory };
}
