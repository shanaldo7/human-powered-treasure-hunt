import React, { useState, useEffect } from 'react';
import { 
  NormalizedDiscoveryRecord, 
  SourceAdapterMetadata, 
  DiscoveryEngineResponse 
} from '../types/discovery';
import { DiscoveryCategory } from '../types/hunt';
import { DiscoveryRecordCard } from './DiscoveryRecordCard';
import { DiscoveryDeepIntelligenceModal } from './DiscoveryDeepIntelligenceModal';
import { GENRE_DEFINITIONS, normalizeCategory } from '../data/genreDefinitions';
import { 
  Database, 
  MapPin, 
  Search, 
  RefreshCw, 
  Layers, 
  SlidersHorizontal, 
  Globe, 
  BookOpen, 
  ShieldCheck, 
  Radio, 
  Filter,
  CheckCircle2,
  AlertCircle,
  Sparkles
} from 'lucide-react';

interface ContinuousDiscoveryViewProps {
  initialLocation?: string;
  initialGenre?: DiscoveryCategory;
  onTurnRecordIntoHunt?: (record: NormalizedDiscoveryRecord) => void;
  onTurnTimelineIntoHunt?: (record: NormalizedDiscoveryRecord, timeline: any) => void;
}

export const ContinuousDiscoveryView: React.FC<ContinuousDiscoveryViewProps> = ({
  initialLocation = 'Edinburgh',
  initialGenre = 'Hidden History',
  onTurnRecordIntoHunt,
  onTurnTimelineIntoHunt
}) => {
  const [location, setLocation] = useState(initialLocation);
  const [selectedGenre, setSelectedGenre] = useState<DiscoveryCategory>(initialGenre);
  const [timeFilter, setTimeFilter] = useState<'all' | '24h' | '7d' | '30d' | 'historical'>('all');
  const [sourceTypeFilter, setSourceTypeFilter] = useState<string>('all');
  const [claimFilter, setClaimFilter] = useState<string>('all');

  const [records, setRecords] = useState<NormalizedDiscoveryRecord[]>([]);
  const [activeSources, setActiveSources] = useState<SourceAdapterMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSerendipityLoading, setIsSerendipityLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastSyncedTime, setLastSyncedTime] = useState<string | null>(null);

  // Intelligence Modal State
  const [selectedRecordForIntelligence, setSelectedRecordForIntelligence] = useState<NormalizedDiscoveryRecord | null>(null);

  // Preset exploration hubs
  const sampleLocations = ['Edinburgh', 'Kolkata', 'London', 'New York', 'Tokyo', 'Rome'];

  const executeDiscoverySearch = async (
    targetLoc: string, 
    targetGenre: DiscoveryCategory, 
    targetTimeFilter: string = timeFilter,
    forceFresh: boolean = false
  ) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/discovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: targetLoc.trim() || 'Edinburgh',
          genre: targetGenre,
          timeFilter: targetTimeFilter,
          forceFresh
        })
      });

      if (!res.ok) {
        throw new Error('Continuous discovery engine call failed');
      }

      const data: DiscoveryEngineResponse = await res.json();
      setRecords(data.records || []);
      setActiveSources(data.activeSources || []);
      setStats(data.stats);
      setLastSyncedTime(new Date().toLocaleTimeString());

      if (data.noMatchReason && (!data.records || data.records.length === 0)) {
        setErrorMessage(data.noMatchReason);
      }
    } catch (err: any) {
      console.error('[CONTINUOUS DISCOVERY VIEW ERROR]', err);
      setRecords([]);
      setErrorMessage('Discovery engine is temporarily unavailable.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    executeDiscoverySearch(location, selectedGenre, timeFilter, false);
  }, [selectedGenre, timeFilter]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (location.trim()) {
      executeDiscoverySearch(location, selectedGenre, timeFilter, true);
    }
  };

  // Filter records in memory based on user sub-filters
  const filteredRecords = records.filter(r => {
    if (sourceTypeFilter !== 'all' && r.source_type !== sourceTypeFilter) {
      return false;
    }
    if (claimFilter !== 'all' && r.claim_type !== claimFilter) {
      return false;
    }
    return true;
  });

  const handleTriggerSerendipity = async () => {
    setIsSerendipityLoading(true);
    try {
      const res = await fetch('/api/serendipity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ location: location.trim() || 'Edinburgh' })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.record) {
          // Prepend serendipitous discovery to records and open intelligence modal
          setRecords(prev => [data.record, ...prev.filter(r => r.id !== data.record.id)]);
          setSelectedRecordForIntelligence(data.record);
        }
      }
    } catch (err) {
      console.error('[SERENDIPITY ERROR]', err);
    } finally {
      setIsSerendipityLoading(false);
    }
  };

  return (
    <div className="space-y-8 py-6 px-4 sm:px-6 max-w-6xl mx-auto font-sans">
      
      {/* HEADER SECTION */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-mono font-semibold">
              <Database className="w-3.5 h-3.5 text-indigo-400 fill-current" />
              <span>CONTINUOUS DATA INTELLIGENCE ENGINE</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-serif font-extrabold text-slate-100 tracking-tight">
              Multi-Source Discovery Radar
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 font-sans max-w-2xl">
              Cross-referencing live web research, OpenStreetMap civic geography, Wikipedia historical archives, and open datasets into unified normalized destination cards.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start md:self-auto font-mono text-xs">
            {/* FEATURE 3: SERENDIPITY ENGINE */}
            <button
              type="button"
              onClick={handleTriggerSerendipity}
              disabled={isSerendipityLoading || isLoading}
              className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl font-bold flex items-center gap-2 transition-all shadow-md shadow-purple-500/20"
            >
              <Sparkles className={`w-3.5 h-3.5 text-amber-300 ${isSerendipityLoading ? 'animate-spin' : ''}`} />
              <span>SHOW ME SOMETHING I WOULD NEVER SEARCH FOR</span>
            </button>

            <button
              type="button"
              onClick={() => executeDiscoverySearch(location, selectedGenre, timeFilter, true)}
              disabled={isLoading}
              className="px-4 py-2.5 bg-slate-950 hover:bg-slate-800 text-amber-300 border border-slate-800 rounded-xl font-bold flex items-center gap-2 transition-colors shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh Sources</span>
            </button>
          </div>
        </div>

        {/* SEARCH FORM */}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-2">
          <div className="md:col-span-8 relative">
            <MapPin className="w-4 h-4 text-rose-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Enter any city, neighborhood, or historical district..."
              className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500/50 rounded-2xl pl-10 pr-4 py-3 text-sm text-slate-100 placeholder-slate-500 font-mono focus:outline-none transition-colors"
            />
          </div>

          <div className="md:col-span-4">
            <button
              type="submit"
              disabled={isLoading || !location.trim()}
              className="w-full py-3 bg-gradient-to-r from-indigo-500 via-indigo-600 to-indigo-700 hover:from-indigo-400 hover:to-indigo-600 text-white font-serif font-bold text-sm rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
              ) : (
                <Search className="w-4 h-4 text-white" />
              )}
              <span>EXECUTE DISCOVERY</span>
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
                executeDiscoverySearch(loc, selectedGenre, timeFilter, true);
              }}
              className={`px-2.5 py-1 rounded-lg border text-[11px] transition-all ${
                location.toLowerCase() === loc.toLowerCase()
                  ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300 font-bold'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {loc}
            </button>
          ))}
        </div>
      </div>

      {/* ACTIVE DATASET SOURCES BANNER (Requirement #2 & #9: Modular Source Registry) */}
      <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-3 font-mono text-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-300 font-bold">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>CONNECTED OPEN SOURCES & ADAPTERS ({activeSources.length})</span>
          </div>
          {lastSyncedTime && (
            <span className="text-[11px] text-slate-500">
              Last Sync: {lastSyncedTime}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {activeSources.map(source => (
            <div key={source.id} className="p-3 bg-slate-900/90 rounded-xl border border-slate-800/80 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-200 truncate">{source.name}</span>
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[9px] border border-emerald-500/30">
                  READY
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-sans line-clamp-1">{source.description}</p>
              <div className="text-[10px] text-slate-500 truncate">{source.attribution}</div>
            </div>
          ))}
        </div>
      </div>

      {/* FILTER BAR: RECENCY + CLAIM + SOURCE TYPE (Requirement #9) */}
      <div className="space-y-3 bg-slate-900/50 p-4 rounded-2xl border border-slate-800 font-mono text-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Time Filter */}
          <div className="space-y-1.5">
            <span className="text-slate-400 text-[11px] block font-bold">TEMPORAL RECENCY:</span>
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: 'all', label: 'All Documented' },
                { id: '24h', label: 'Past 24h' },
                { id: '7d', label: 'Past 7d' },
                { id: '30d', label: 'Past 30d' },
                { id: 'historical', label: 'Historical Only' }
              ].map(tf => (
                <button
                  key={tf.id}
                  type="button"
                  onClick={() => setTimeFilter(tf.id as any)}
                  className={`px-2.5 py-1 rounded-lg border text-[11px] transition-all ${
                    timeFilter === tf.id
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 font-bold'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  {tf.label}
                </button>
              ))}
            </div>
          </div>

          {/* Source Type Filter */}
          <div className="space-y-1.5">
            <span className="text-slate-400 text-[11px] block font-bold">SOURCE TYPE:</span>
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: 'all', label: 'All Sources' },
                { id: 'geographic_dataset', label: '🗺️ Geographic' },
                { id: 'cultural_archive', label: '🏛️ Archives' },
                { id: 'news_article', label: '📰 News' },
                { id: 'web_search', label: '🌐 Web' }
              ].map(st => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setSourceTypeFilter(st.id)}
                  className={`px-2.5 py-1 rounded-lg border text-[11px] transition-all ${
                    sourceTypeFilter === st.id
                      ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/50 font-bold'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* Claim Classification Filter */}
          <div className="space-y-1.5">
            <span className="text-slate-400 text-[11px] block font-bold">CLAIM TYPE:</span>
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: 'all', label: 'All Claims' },
                { id: 'historical', label: 'Historical' },
                { id: 'newly_reported_event', label: 'Reported' },
                { id: 'local_legend', label: 'Folklore' }
              ].map(cf => (
                <button
                  key={cf.id}
                  type="button"
                  onClick={() => setClaimFilter(cf.id)}
                  className={`px-2.5 py-1 rounded-lg border text-[11px] transition-all ${
                    claimFilter === cf.id
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 font-bold'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  {cf.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* GENRE SELECTOR BAR */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-mono text-slate-400 px-1">
          <span>SELECT EXPLORATION GENRE:</span>
          <span className="text-amber-400 font-semibold">{selectedGenre}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {GENRE_DEFINITIONS.slice(0, 8).map(g => (
            <button
              key={g.id}
              type="button"
              onClick={() => setSelectedGenre(g.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-all flex items-center gap-1.5 border ${
                selectedGenre === g.id
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 font-bold shadow-sm'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border-slate-800'
              }`}
            >
              <span>{g.icon}</span>
              <span>{g.shortName}</span>
            </button>
          ))}
        </div>
      </div>

      {/* RESULTS LIST */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs font-mono text-slate-400 px-1">
          <span>VERIFIED DESTINATION RECORDS: {filteredRecords.length}</span>
          {stats && (
            <span>Evaluated {stats.totalEvaluated} records in {stats.durationMs}ms</span>
          )}
        </div>

        {isLoading ? (
          <div className="text-center py-16 space-y-3">
            <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mx-auto" />
            <p className="text-slate-400 font-mono text-xs">
              Querying OpenStreetMap, Wikipedia Archives, and Web sources in parallel...
            </p>
          </div>
        ) : filteredRecords.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredRecords.map(rec => (
              <DiscoveryRecordCard
                key={rec.id}
                record={rec}
                onTurnIntoHunt={onTurnRecordIntoHunt}
                onOpenIntelligence={(r) => setSelectedRecordForIntelligence(r)}
              />
            ))}
          </div>
        ) : (
          <div className="p-8 text-center bg-slate-900/60 rounded-3xl border border-slate-800 space-y-2">
            <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
            <h4 className="text-slate-200 font-bold font-serif text-lg">No Matching Records Found</h4>
            <p className="text-slate-400 text-xs font-mono max-w-md mx-auto">
              {errorMessage || 'Try broadening the exploration area or adjusting filters to discover verified places.'}
            </p>
          </div>
        )}
      </div>

      {/* FEATURE 2, 4, 5: DEEP KNOWLEDGE & EVIDENCE INTELLIGENCE MODAL */}
      {selectedRecordForIntelligence && (
        <DiscoveryDeepIntelligenceModal
          record={selectedRecordForIntelligence}
          allRecords={records}
          isOpen={Boolean(selectedRecordForIntelligence)}
          onClose={() => setSelectedRecordForIntelligence(null)}
          onTurnTimelineIntoHunt={onTurnTimelineIntoHunt}
        />
      )}

    </div>
  );
};
