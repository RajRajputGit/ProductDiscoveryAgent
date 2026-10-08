import React, { useState } from 'react';
import { Sparkles, HelpCircle, History, Settings as SettingsIcon, Menu, X, ArrowLeft } from 'lucide-react';

interface NavbarProps {
  currentView: 'home' | 'research' | 'results' | 'settings';
  onNavigate: (view: 'home' | 'settings') => void;
  onOpenHowItWorks: () => void;
  onOpenHistory: () => void;
  hasActiveResults?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  onOpenHowItWorks,
  onOpenHistory,
  hasActiveResults,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-[#0a0b10]/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          {currentView !== 'home' && (
            <button
              onClick={() => onNavigate('home')}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors mr-1 sm:mr-2"
              title="Return to Home"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2.5 text-left group focus:outline-none"
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition-transform shadow-[0_0_15px_-3px_rgba(99,102,241,0.3)]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold tracking-tight text-white text-base">IGNA</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-medium">
                  PoC
                </span>
              </div>
              <div className="text-[11px] text-slate-400 leading-none hidden sm:block">
                AI Shopping Research Agent
              </div>
            </div>
          </button>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          <button
            onClick={onOpenHowItWorks}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
            <span>How it works</span>
          </button>

          <button
            onClick={onOpenHistory}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
          >
            <History className="w-3.5 h-3.5 text-slate-400" />
            <span>Search history</span>
          </button>

          <button
            onClick={() => onNavigate(currentView === 'settings' ? 'home' : 'settings')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              currentView === 'settings'
                ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <SettingsIcon className="w-3.5 h-3.5" />
            <span>Settings</span>
          </button>
        </nav>

        {/* System Status Pill */}
        <div className="hidden sm:flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-800 text-[11px] font-mono text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>System ready</span>
          </div>
        </div>

        {/* Mobile menu trigger */}
        <div className="md:hidden flex items-center">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-800 bg-[#0e1017] px-4 pt-2 pb-4 space-y-2">
          <button
            onClick={() => {
              onOpenHowItWorks();
              setMobileMenuOpen(false);
            }}
            className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-200 hover:bg-slate-800/60"
          >
            <HelpCircle className="w-4 h-4 text-indigo-400" />
            <span>How it works</span>
          </button>
          <button
            onClick={() => {
              onOpenHistory();
              setMobileMenuOpen(false);
            }}
            className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-200 hover:bg-slate-800/60"
          >
            <History className="w-4 h-4 text-indigo-400" />
            <span>Search history</span>
          </button>
          <button
            onClick={() => {
              onNavigate(currentView === 'settings' ? 'home' : 'settings');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-200 hover:bg-slate-800/60"
          >
            <SettingsIcon className="w-4 h-4 text-indigo-400" />
            <span>Settings</span>
          </button>
        </div>
      )}
    </header>
  );
};
