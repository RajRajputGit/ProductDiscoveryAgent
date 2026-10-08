import { useState, useRef, useCallback, useEffect } from 'react';
import { RecommendationResult } from '../types/shopping';
import { searchProducts, getSearchStatus, getSearchResults, SearchStatusResponse } from '../api/shopping';

export function useSearch() {
  const [searchId, setSearchId] = useState<string | null>(null);
  const [query, setQuery] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [statusResponse, setStatusResponse] = useState<SearchStatusResponse | null>(null);
  const [result, setResult] = useState<RecommendationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);


  useEffect(() => {
    return () => {
      clearPolling();
    };
  }, [clearPolling]);

  const executeSearch = useCallback(
    async (queryText: string) => {
      const clean = queryText.trim();
      if (!clean) return;

      clearPolling();
      setQuery(clean);
      setIsSearching(true);
      setError(null);
      setResult(null);
      setStatusResponse(null);

      try {
        const { search_id } = await searchProducts(clean);
        setSearchId(search_id);

        // Fetch initial status immediately
        const initialStatus = await getSearchStatus(search_id);
        setStatusResponse(initialStatus);

        // Poll every 500ms
        pollIntervalRef.current = setInterval(async () => {
          try {
            const currentStatus = await getSearchStatus(search_id);
            setStatusResponse(currentStatus);

            if (currentStatus.status === 'completed') {
              clearPolling();
              const finalResult = await getSearchResults(search_id);
              setResult(finalResult);
              setIsSearching(false);
            } else if (currentStatus.status === 'failed') {
              clearPolling();
              setIsSearching(false);
              setError('Search process encountered an unrecoverable failure.');
            }
          } catch (err: unknown) {
            clearPolling();
            setIsSearching(false);
            setError(err instanceof Error ? err.message : 'Error polling status');
          }
        }, 500);
      } catch (err: unknown) {
        setIsSearching(false);
        setError(err instanceof Error ? err.message : 'Failed to launch search');
      }
    },
    [clearPolling]
  );

  const resetSearch = useCallback(() => {
    clearPolling();
    setSearchId(null);
    setQuery('');
    setIsSearching(false);
    setStatusResponse(null);
    setResult(null);
    setError(null);
  }, [clearPolling]);

  return {
    searchId,
    query,
    isSearching,
    statusResponse,
    result,
    error,
    executeSearch,
    resetSearch,
  };
}
