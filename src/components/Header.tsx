import React from 'react';
import { Compass, Sparkles, FolderOpen, Zap, MessageSquare, Newspaper, Database } from 'lucide-react';

interface HeaderProps {
  activeTab: 'landing' | 'create' | 'hunt' | 'history' | 'articles' | 'discovery';
  onNavigate: (tab: 'landing' | 'create' | 'hunt' | 'history' | 'articles' | 'discovery') => void;
  onOpenGuide: () => void;
  onOpenServices?: () => void;
  hasActiveHunt: boolean;
  onTriggerLiveRadar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onNavigate,
  onOpenGuide,
  hasActiveHunt,
  onTriggerLiveRadar
}) => {
  const handleLiveClick = () => {
    if (activeTab !== 'landing') {
      onNavigate('landing');
      setTimeout(() => {
        const el = document.getElementById('live-radar-section');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const el = document.getElementById('live-radar-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
    if (onTriggerLiveRadar) onTriggerLiveRadar();
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/60 px-4 sm:px-6 py-3 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Brand Wordmark */}
          <button
            onClick={() => onNavigate('landing')}
            className="flex items-center gap-3 group text-left focus:outline-none transition-transform"
          >
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-lg shadow-sm group-hover:border-amber-400 transition-colors">
              🏴‍☠️
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-serif font-bold text-slate-100 tracking-wider group-hover:text-amber-400 transition-colors leading-none">
                HUNT
              </span>
              <span className="text-[10px] font-mono text-amber-400/90 tracking-widest mt-0.5 leading-none">
                HUMAN-POWERED AI
              </span>
            </div>
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-900/60 px-2 py-1 rounded-xl border border-slate-800/70 text-xs font-mono">
            <button
              onClick={() => onNavigate('landing')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'landing'
                  ? 'bg-amber-500/15 text-amber-300 font-semibold border border-amber-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Home
            </button>

            <button
              onClick={() => onNavigate('create')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'create'
                  ? 'bg-amber-500/15 text-amber-300 font-semibold border border-amber-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Compass className="w-3.5 h-3.5 text-amber-400" />
              <span>Create Hunt</span>
            </button>

            <button
              onClick={() => onNavigate('articles')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'articles'
                  ? 'bg-cyan-500/15 text-cyan-300 font-semibold border border-cyan-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Newspaper className="w-3.5 h-3.5 text-cyan-400" />
              <span>Stories & Cases</span>
            </button>

            <button
              onClick={() => onNavigate('discovery')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'discovery'
                  ? 'bg-indigo-500/15 text-indigo-300 font-semibold border border-indigo-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Database className="w-3.5 h-3.5 text-indigo-400" />
              <span>Discovery Engine</span>
            </button>

            {hasActiveHunt && (
              <button
                onClick={() => onNavigate('hunt')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  activeTab === 'hunt'
                    ? 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/40 shadow-sm'
                    : 'text-amber-400 hover:text-amber-300 font-semibold'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Active Hunt</span>
              </button>
            )}

            <button
              onClick={() => onNavigate('history')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'history'
                  ? 'bg-amber-500/15 text-amber-300 font-semibold border border-amber-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FolderOpen className="w-3.5 h-3.5" />
              <span>My Hunts</span>
            </button>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {/* Live Radar Quick Action */}
            <button
              onClick={handleLiveClick}
              title="Open Live Local Radar"
              className="px-3 py-1.5 bg-cyan-950/40 hover:bg-cyan-900/40 text-cyan-300 border border-cyan-500/30 hover:border-cyan-400/50 rounded-xl text-xs font-mono font-medium flex items-center gap-1.5 transition-all shadow-sm"
            >
              <Zap className="w-3.5 h-3.5 text-cyan-400 fill-current" />
              <span>Live</span>
            </button>

            {/* AI Guide Drawer Trigger */}
            <button
              onClick={onOpenGuide}
              title="Open AI Hunt Guide"
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-amber-300 border border-slate-800 rounded-xl text-xs font-mono font-medium flex items-center gap-1.5 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Guide</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/80 px-2 py-2 flex items-center justify-around font-mono text-[11px]">
        <button
          onClick={() => onNavigate('landing')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg transition-colors ${
            activeTab === 'landing' ? 'text-amber-400 font-bold' : 'text-slate-400'
          }`}
        >
          <span>🏴‍☠️</span>
          <span>Home</span>
        </button>

        <button
          onClick={() => onNavigate('create')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg transition-colors ${
            activeTab === 'create' ? 'text-amber-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Compass className="w-4 h-4" />
          <span>Create</span>
        </button>

        <button
          onClick={() => onNavigate('articles')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg transition-colors ${
            activeTab === 'articles' ? 'text-cyan-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Newspaper className="w-4 h-4" />
          <span>Cases</span>
        </button>

        <button
          onClick={() => onNavigate('discovery')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg transition-colors ${
            activeTab === 'discovery' ? 'text-indigo-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Radar</span>
        </button>

        {hasActiveHunt && (
          <button
            onClick={() => onNavigate('hunt')}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg transition-colors ${
              activeTab === 'hunt' ? 'text-amber-400 font-bold' : 'text-emerald-400'
            }`}
          >
            <div className="relative">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse absolute -top-0.5 -right-0.5" />
              <Zap className="w-4 h-4 text-emerald-400" />
            </div>
            <span>Active</span>
          </button>
        )}

        <button
          onClick={() => onNavigate('history')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg transition-colors ${
            activeTab === 'history' ? 'text-amber-400 font-bold' : 'text-slate-400'
          }`}
        >
          <FolderOpen className="w-4 h-4" />
          <span>My Hunts</span>
        </button>

        <button
          onClick={handleLiveClick}
          className="flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-cyan-400"
        >
          <Zap className="w-4 h-4 fill-current" />
          <span>Live</span>
        </button>
      </div>
    </>
  );
};

