import React, { useState } from 'react';
import { Navbar } from './components/layout/Navbar';
import { HowItWorksModal } from './components/layout/HowItWorksModal';
import { SearchHistoryModal } from './components/search/SearchHistoryModal';
import { Home } from './pages/Home';
import { Research } from './pages/Research';
import { Results } from './pages/Results';
import { Settings } from './pages/Settings';
import { useSearch } from './hooks/useSearch';
import { useSearchHistory } from './hooks/useHistory';
import { AlertCircle, RotateCcw } from 'lucide-react';

export function App() {
  const [currentView, setCurrentView] = useState<'home' | 'research' | 'results' | 'settings'>('home');
  const [howItWorksOpen, setHowItWorksOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  const {
    query,
    isSearching,
    statusResponse,
    result,
    error,
    executeSearch,
    resetSearch,
  } = useSearch();

  const { history, addQuery, clearHistory } = useSearchHistory();

  const handleSearch = (newQuery: string) => {
    addQuery(newQuery);
    setCurrentView('research');
    executeSearch(newQuery);
  };

  const handleCancelSearch = () => {
    resetSearch();
    setCurrentView('home');
  };

  // Switch to results when result is received
  React.useEffect(() => {
    if (result && !isSearching) {
      setCurrentView('results');
    }
  }, [result, isSearching]);

  return (
    <div className="min-h-screen bg-[#0a0b10] text-slate-100 flex flex-col font-sans">
      {/* Top Navigation */}
      <Navbar
        currentView={currentView}
        onNavigate={(view) => {
          if (view === 'home' && isSearching) {
            handleCancelSearch();
          } else {
            setCurrentView(view);
          }
        }}
        onOpenHowItWorks={() => setHowItWorksOpen(true)}
        onOpenHistory={() => setHistoryOpen(true)}
        hasActiveResults={!!result}
      />

      {/* Error Banner */}
      {error && (
        <div className="w-full bg-rose-500/10 border-b border-rose-500/30 px-4 py-3 flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-2 text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => handleSearch(query)}
            className="flex items-center gap-1 text-xs text-rose-300 hover:text-white font-medium underline"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Main Content Router */}
      <main className="flex-1">
        {currentView === 'home' && (
          <Home onSearch={handleSearch} isLoading={isSearching} />
        )}

        {currentView === 'research' && (
          <Research
            query={query}
            statusResponse={statusResponse}
            onCancel={handleCancelSearch}
          />
        )}

        {currentView === 'results' && result && (
          <Results
            result={result}
            rawQuery={query}
            onNewSearch={() => {
              resetSearch();
              setCurrentView('home');
            }}
          />
        )}

        {currentView === 'settings' && (
          <Settings onBack={() => setCurrentView('home')} />
        )}
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-900 bg-[#08090d] py-6 px-4 text-center text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-slate-400">
            <span className="font-bold text-slate-300">IGNA</span>
            <span>•</span>
            <span>Controlled Hybrid AI Architecture</span>
          </div>
          <div>
            Built with Playwright • RapidFuzz • Pydantic • React • Tailwind
          </div>
        </div>
      </footer>

      {/* Modals */}
      <HowItWorksModal
        isOpen={howItWorksOpen}
        onClose={() => setHowItWorksOpen(false)}
      />

      <SearchHistoryModal
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        history={history}
        onSelectQuery={handleSearch}
        onClearHistory={clearHistory}
      />
    </div>
  );
}

export default App;

