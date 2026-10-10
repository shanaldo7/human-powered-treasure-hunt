import React, { useState, useEffect } from 'react';
import { RealStoryArticle, DiscoveryCategory } from '../types/hunt';
import { RealStoryCard } from './RealStoryCard';
import { GENRE_DEFINITIONS, normalizeCategory } from '../data/genreDefinitions';
import { 
  Newspaper, 
  MapPin, 
  Search, 
  RefreshCw, 
  Zap, 
  ShieldCheck, 
  Radio, 
  AlertCircle,
  ExternalLink,
  SlidersHorizontal,
  Compass
} from 'lucide-react';

interface RealArticlesViewProps {
  initialLocation?: string;
  initialGenre?: DiscoveryCategory;
  onTurnIntoHunt: (article: RealStoryArticle) => void;
  onNavigateToCreate?: (loc: string, genre: DiscoveryCategory) => void;
}

export const RealArticlesView: React.FC<RealArticlesViewProps> = ({
  initialLocation = 'Kolkata',
  initialGenre = 'Hidden History',
  onTurnIntoHunt,
  onNavigateToCreate
}) => {
  const [location, setLocation] = useState(initialLocation);
  const [selectedGenre, setSelectedGenre] = useState<DiscoveryCategory>(initialGenre);
  const [customQuery, setCustomQuery] = useState('');
  const [timeFilter, setTimeFilter] = useState<'all' | '24h' | '7d' | '30d' | 'historical'>('all');
  const [articles, setArticles] = useState<RealStoryArticle[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [sourceAvailable, setSourceAvailable] = useState(true);

  // Quick preset locations to test dynamic variation across cities
  const sampleLocations = ['Kolkata', 'London', 'New York', 'Tokyo', 'Mumbai', 'Edinburgh', 'Rome'];

  const fetchRealArticles = async (
    targetLoc: string, 
    targetGenre: DiscoveryCategory, 
    query?: string, 
    skipCache?: boolean,
    targetTimeFilter: 'all' | '24h' | '7d' | '30d' | 'historical' = timeFilter
  ) => {
    setIsLoading(true);
    setErrorMessage(null);
    setHasSearched(true);

    try {
      const res = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: targetLoc.trim() || 'Kolkata',
          genre: targetGenre,
          mode: 'live',
          timeFilter: targetTimeFilter,
          query: query?.trim() || undefined,
          skipCache: Boolean(skipCache)
        })
      });

      if (!res.ok) {
        throw new Error('Research pipeline call failed');
      }

      const data = await res.json();
      setSourceAvailable(data.source_available !== false);
      
      if (data.results && Array.isArray(data.results)) {
        setArticles(data.results);
      } else {
        setArticles([]);
      }

      if (data.message && (!data.results || data.results.length === 0)) {
        setErrorMessage(data.message);
      }
    } catch (err: any) {
      console.error('[REAL ARTICLES VIEW ERROR]', err);
      setArticles([]);
      setErrorMessage('Live research is temporarily unavailable.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRealArticles(location, selectedGenre, customQuery, false, timeFilter);
  }, [selectedGenre, timeFilter]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (location.trim()) {
      fetchRealArticles(location, selectedGenre, customQuery, true, timeFilter);
    }
  };

  return (
    <div className="space-y-8 py-6 px-4 sm:px-6 max-w-6xl mx-auto font-sans">
      
      {/* HEADER SECTION */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono font-semibold">
              <Zap className="w-3.5 h-3.5 text-cyan-400 fill-current" />
              <span>LIVE INVESTIGATIVE RESEARCH</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-serif font-extrabold text-slate-100 tracking-tight">
              Real Stories & Published Cases
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 font-sans max-w-2xl">
              100% grounded in verified real-time web sources. Real headlines, published news, verified archives, and documented folklore. No fabricated stories.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto font-mono text-xs">
            <button
              type="button"
              onClick={() => fetchRealArticles(location, selectedGenre, customQuery, true)}
              disabled={isLoading}
              className="px-4 py-2.5 bg-slate-950 hover:bg-slate-800 text-amber-300 border border-slate-800 rounded-xl font-bold flex items-center gap-2 transition-colors shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh Sources</span>
            </button>
          </div>
        </div>

        {/* SEARCH & FILTER BAR */}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-2">
          {/* Location input */}
          <div className="md:col-span-5 relative">
            <MapPin className="w-4 h-4 text-rose-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Any city or neighborhood (e.g. Kolkata, London)..."
              className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500/50 rounded-2xl pl-10 pr-4 py-3 text-sm text-slate-100 placeholder-slate-500 font-mono focus:outline-none transition-colors"
            />
          </div>

          {/* Optional specific topic / search query */}
          <div className="md:col-span-4 relative">
            <Search className="w-4 h-4 text-cyan-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={customQuery}
              onChange={(e) => setCustomQuery(e.target.value)}
              placeholder="Optional keyword (e.g. cemetery, mural)..."
              className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500/50 rounded-2xl pl-10 pr-4 py-3 text-sm text-slate-100 placeholder-slate-500 font-mono focus:outline-none transition-colors"
            />
          </div>

          {/* Search Button */}
          <div className="md:col-span-3">
            <button
              type="submit"
              disabled={isLoading || !location.trim()}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-serif font-bold text-sm rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
              ) : (
                <Search className="w-4 h-4 text-slate-950" />
              )}
              <span>RESEARCH SOURCES</span>
            </button>
          </div>
        </form>

        {/* Quick location chips */}
        <div className="flex flex-wrap items-center gap-2 pt-1 font-mono text-xs">
          <span className="text-slate-500 text-[11px]">Quick Location:</span>
          {sampleLocations.map((loc) => (
            <button
              key={loc}
              type="button"
              onClick={() => {
                setLocation(loc);
                fetchRealArticles(loc, selectedGenre, customQuery);
              }}
              className={`px-2.5 py-1 rounded-lg border text-[11px] transition-all ${
                location.toLowerCase() === loc.toLowerCase()
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 font-bold'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {loc}
            </button>
          ))}
        </div>
      </div>

      {/* TIME WINDOW / RECENCY FILTERS (Requirement #1: Live Discovery Radar) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-mono text-slate-400 px-1">
          <span className="flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>DISCOVERY RECENCY RADAR:</span>
          </span>
          <span className="text-cyan-400 font-semibold">
            {timeFilter === 'all' && 'All Documented Sources'}
            {timeFilter === '24h' && '⚡ Past 24 Hours Only'}
            {timeFilter === '7d' && '📅 Past 7 Days'}
            {timeFilter === '30d' && '🗓️ Past 30 Days'}
            {timeFilter === 'historical' && '📜 Historical Archives'}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'all', label: 'All Sources', icon: '🌐' },
            { id: '24h', label: 'Last 24 Hours', icon: '⚡' },
            { id: '7d', label: 'Last 7 Days', icon: '📅' },
            { id: '30d', label: 'Last 30 Days', icon: '🗓️' },
            { id: 'historical', label: 'Historical Archives', icon: '📜' }
          ].map((tf) => {
            const isSelected = timeFilter === tf.id;
            return (
              <button
                key={tf.id}
                type="button"
                onClick={() => setTimeFilter(tf.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-all flex items-center gap-1.5 border ${
                  isSelected
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 font-bold shadow-sm'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border-slate-800'
                }`}
              >
                <span>{tf.icon}</span>
                <span>{tf.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* GENRE SELECTOR TABS */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-mono text-slate-400 px-1">
          <span>INVESTIGATION GENRE:</span>
          <span className="text-amber-400">{selectedGenre}</span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {GENRE_DEFINITIONS.map((genre) => {
            const isSelected = selectedGenre === genre.id;
            return (
              <button
                key={genre.id}
                type="button"
                onClick={() => setSelectedGenre(genre.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-mono whitespace-nowrap transition-all flex items-center gap-2 ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/15'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                }`}
              >
                <span>{genre.icon}</span>
                <span>{genre.shortName}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ARTICLES CONTAINER */}
      {isLoading ? (
        <div className="py-20 text-center space-y-4 bg-slate-900/50 rounded-3xl border border-slate-800">
          <div className="relative w-10 h-10 mx-auto">
            <RefreshCw className="w-10 h-10 text-cyan-400 animate-spin" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-mono font-bold text-slate-200">
              Querying live web sources for {location} ({selectedGenre})...
            </p>
            <p className="text-xs font-mono text-slate-400">
              Filtering published reports, authenticating URLs, and classifying evidence.
            </p>
          </div>
        </div>
      ) : articles.length > 0 ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 px-1 border-b border-slate-800/80 pb-2">
            <span>SHOWING {articles.length} REAL PUBLISHED STORIES</span>
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Preserved Original URLs</span>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {articles.map((art, idx) => (
              <RealStoryCard
                key={`${art.source_url}_${idx}`}
                article={art}
                onTurnIntoHunt={onTurnIntoHunt}
              />
            ))}
          </div>
        </div>
      ) : (
        /* EMPTY / FAILURE STATE (Requirement #12) */
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-8 sm:p-12 text-center space-y-5 shadow-xl max-w-2xl mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto text-xl">
            📰
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-serif font-bold text-slate-100">
              No strong real-world stories were found for this location and genre right now.
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 font-sans max-w-md mx-auto">
              {errorMessage || 'Our real-time search did not uncover verified articles or reported cases matching these exact parameters. We strictly refuse to fabricate stories.'}
            </p>
          </div>

          <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-center gap-2 font-mono text-xs">
            <button
              type="button"
              onClick={() => setSelectedGenre('Hidden History')}
              className="px-3.5 py-2 bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-xl transition-colors"
            >
              🏛️ Try Hidden History
            </button>
            <button
              type="button"
              onClick={() => setSelectedGenre('Food & Street Eats')}
              className="px-3.5 py-2 bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-xl transition-colors"
            >
              🍜 Try Food & Eats
            </button>
            <button
              type="button"
              onClick={() => {
                setLocation('London');
                fetchRealArticles('London', selectedGenre);
              }}
              className="px-3.5 py-2 bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-xl transition-colors"
            >
              🌍 Search Wider City
            </button>
            <button
              type="button"
              onClick={() => fetchRealArticles(location, selectedGenre, '', true)}
              className="px-3.5 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl font-bold transition-colors"
            >
              ⚡ Try Live Now Again
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
