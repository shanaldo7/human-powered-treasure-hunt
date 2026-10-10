import React, { useState, useEffect } from 'react';
import { 
  Compass, 
  MapPin, 
  Sparkles, 
  Navigation, 
  ArrowRight, 
  Play, 
  RefreshCw, 
  Locate, 
  Map as MapIcon, 
  ExternalLink, 
  ShieldAlert, 
  CheckCircle2, 
  Zap, 
  Radio, 
  Search, 
  HelpCircle,
  Clock,
  Layers,
  AlertCircle
} from 'lucide-react';
import { PRESET_HUNTS } from '../data/presetHunts';
import { TreasureHunt, DiscoveredPlace, DiscoveryCategory, LiveRadarItem, CuriousSpot, HuntDifficulty } from '../types/hunt';
import { RealPlaceCard } from './RealPlaceCard';
import { GENRE_DEFINITIONS, getGenreDefinition, normalizeCategory } from '../data/genreDefinitions';

interface LandingViewProps {
  onCreateHunt: (initialLocation?: string, initialMode?: DiscoveryCategory) => void;
  onLaunchPresetHunt: (hunt: TreasureHunt) => void;
  onStartPlaceTask: (place: DiscoveredPlace) => void;
  onOpenArticles?: (loc?: string, genre?: DiscoveryCategory) => void;
  onQuickGenerateHunt?: (params: {
    locationName: string;
    mode: DiscoveryCategory;
    durationMinutes: number;
    numberOfStops: number;
    userCoordinates?: { latitude: number; longitude: number };
    isLive?: boolean;
    difficulty?: HuntDifficulty;
  }) => Promise<void>;
  generationError?: string | null;
  onClearError?: () => void;
}

export const LandingView: React.FC<LandingViewProps> = ({
  onCreateHunt,
  onLaunchPresetHunt,
  onStartPlaceTask,
  onOpenArticles,
  onQuickGenerateHunt,
  generationError,
  onClearError
}) => {
  // Quick Hunt Creator form state
  const [quickLocation, setQuickLocation] = useState('Kolkata');
  const [quickGenre, setQuickGenre] = useState<DiscoveryCategory>('Hidden History');
  const [quickDuration, setQuickDuration] = useState<number>(30);
  const [quickMode, setQuickMode] = useState<'classic' | 'live'>('classic');
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [isSubmittingQuick, setIsSubmittingQuick] = useState(false);
  const [loadingStepIndex, setLoadingStepIndex] = useState(0);

  // Today's discoveries section state
  const [selectedCategory, setSelectedCategory] = useState<DiscoveryCategory>('Hidden History');
  const [discoveries, setDiscoveries] = useState<DiscoveredPlace[]>([]);
  const [isLoadingDiscoveries, setIsLoadingDiscoveries] = useState(false);
  const [discoveryViewMode, setDiscoveryViewMode] = useState<'cards' | 'map'>('cards');

  // Live Local Radar state
  const [radarItems, setRadarItems] = useState<LiveRadarItem[]>([]);
  const [isLoadingRadar, setIsLoadingRadar] = useState(false);
  const [radarLocation, setRadarLocation] = useState('Kolkata');
  const [hasSearchedRadar, setHasSearchedRadar] = useState(false);

  // "I'm Curious" state
  const [curiousSpot, setCuriousSpot] = useState<CuriousSpot | null>(null);
  const [isLoadingCurious, setIsLoadingCurious] = useState(false);

  // Multi-stage loading step rotation
  const loadingSteps = [
    'SEARCHING LOCAL DISCOVERIES...',
    'READING RECENT REPORTS...',
    'VERIFYING LOCATIONS & CITATIONS...',
    'BUILDING YOUR HUNT ROUTE...'
  ];

  useEffect(() => {
    let interval: any;
    if (isSubmittingQuick) {
      setLoadingStepIndex(0);
      interval = setInterval(() => {
        setLoadingStepIndex((prev) => (prev + 1) % loadingSteps.length);
      }, 1600);
    }
    return () => clearInterval(interval);
  }, [isSubmittingQuick]);

  // Fetch discoveries for the selected category
  const fetchNearbyDiscoveries = async (loc: string, cat: DiscoveryCategory) => {
    setIsLoadingDiscoveries(true);
    try {
      const res = await fetch('/api/discover-nearby', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locationName: loc, mode: cat })
      });

      if (res.ok) {
        const data = await res.json();
        setDiscoveries(data.places || []);
      }
    } catch (err) {
      console.warn('Error fetching discoveries:', err);
    } finally {
      setIsLoadingDiscoveries(false);
    }
  };

  // Fetch Live Local Radar
  const fetchLiveRadar = async (loc: string, genre?: string) => {
    setIsLoadingRadar(true);
    setHasSearchedRadar(true);
    try {
      const res = await fetch('/api/live-radar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ location: loc, locationName: loc, genre })
      });
      if (res.ok) {
        const data = await res.json();
        setRadarItems(data.items || []);
      }
    } catch (err) {
      console.warn('Error fetching live radar:', err);
    } finally {
      setIsLoadingRadar(false);
    }
  };

  // Fetch Curious Spot
  const fetchCuriousSpot = async (loc: string) => {
    setIsLoadingCurious(true);
    try {
      const res = await fetch('/api/curious-spot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ location: loc, locationName: loc })
      });
      if (res.ok) {
        const data = await res.json();
        setCuriousSpot(data.spot || null);
      }
    } catch (err) {
      console.warn('Error fetching curious spot:', err);
    } finally {
      setIsLoadingCurious(false);
    }
  };

  useEffect(() => {
    fetchNearbyDiscoveries(quickLocation, selectedCategory);
  }, [selectedCategory]);

  // Geolocation trigger
  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      setQuickLocation('Near My Location');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
        setUserCoords(coords);
        setQuickLocation(`Near My Location (${coords.latitude.toFixed(3)}, ${coords.longitude.toFixed(3)})`);
        setIsLocating(false);
      },
      (_err) => {
        setIsLocating(false);
        setQuickLocation('Near My Location');
      },
      { timeout: 8000 }
    );
  };

  // Submit Quick Hunt Creation
  const handleQuickSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickLocation.trim() || isSubmittingQuick) return;
    if (onClearError) onClearError();

    setIsSubmittingQuick(true);
    const stopsCount = quickDuration <= 15 ? 2 : quickDuration <= 30 ? 3 : 4;

    try {
      if (onQuickGenerateHunt) {
        await onQuickGenerateHunt({
          locationName: quickLocation.trim(),
          mode: quickGenre,
          durationMinutes: quickDuration,
          numberOfStops: stopsCount,
          userCoordinates: userCoords || undefined,
          isLive: quickMode === 'live',
          difficulty: 'EXPLORER'
        });
      } else {
        onCreateHunt(quickLocation.trim(), quickGenre);
      }
    } catch (_err) {
      // Error handled in parent
    } finally {
      setIsSubmittingQuick(false);
    }
  };

  // 13 Core Genres for the Quick Creator
  const coreGenres = GENRE_DEFINITIONS.slice(0, 13);
  const activeGenreDef = getGenreDefinition(quickGenre);

  return (
    <div className="space-y-24 py-8 px-4 sm:px-6 max-w-6xl mx-auto font-sans">
      
      {/* 4. HOME PAGE HERO */}
      <section className="relative text-center space-y-6 pt-6 sm:pt-10 overflow-hidden">
        {/* Subtle Map / Topographic Contour Background Lines */}
        <div className="absolute inset-0 -z-10 pointer-events-none opacity-20 flex items-center justify-center">
          <svg className="w-full max-w-4xl h-96 text-amber-500/30" viewBox="0 0 800 400" fill="none">
            <path d="M50 350 C 200 250, 400 380, 600 260 S 750 150, 800 100" stroke="currentColor" strokeWidth="1" strokeDasharray="4 6" />
            <path d="M100 280 C 250 180, 450 310, 650 190 S 780 120, 820 60" stroke="currentColor" strokeWidth="0.8" />
            <path d="M0 200 C 180 120, 380 220, 580 140 S 720 90, 800 40" stroke="currentColor" strokeWidth="0.6" strokeDasharray="2 4" />
            {/* Coordinate Crosshairs */}
            <circle cx="200" cy="180" r="3" fill="currentColor" />
            <circle cx="600" cy="220" r="3" fill="currentColor" />
            <circle cx="450" cy="120" r="4" fill="currentColor" />
          </svg>
        </div>

        {/* Kicker */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-400 text-xs font-mono font-semibold tracking-wider">
          <span>🏴‍☠️</span>
          <span>HUMAN-POWERED AI</span>
        </div>

        {/* Hero Title */}
        <div className="space-y-1">
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-serif font-extrabold text-slate-100 tracking-tight leading-[1.05] max-w-4xl mx-auto">
            DISCOVER <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-200 to-amber-500">
              WHAT'S AROUND YOU.
            </span>
          </h1>
        </div>

        {/* Subtitle */}
        <p className="text-base sm:text-xl font-sans text-slate-300 max-w-2xl mx-auto leading-relaxed font-normal">
          AI finds real places worth exploring. <br className="hidden sm:inline" />
          You go there. You discover what others miss.
        </p>

        {/* Hero CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
          <button
            onClick={() => {
              const el = document.getElementById('quick-creator');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-serif font-bold text-sm rounded-xl shadow-lg shadow-amber-500/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
          >
            <span>START A HUNT</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              const el = document.getElementById('live-radar-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="w-full sm:w-auto px-7 py-3.5 bg-slate-900/80 hover:bg-slate-800 text-cyan-300 font-mono font-bold text-xs rounded-xl border border-cyan-500/30 hover:border-cyan-400 transition-all flex items-center justify-center gap-2"
          >
            <Zap className="w-3.5 h-3.5 text-cyan-400 fill-current" />
            <span>⚡ LIVE DISCOVERIES</span>
          </button>
        </div>
      </section>

      {/* 5. QUICK HUNT CREATOR (DIRECTLY BELOW HERO) */}
      <section id="quick-creator" className="scroll-mt-24">
        <div className="bg-slate-900/90 border border-slate-800/90 hover:border-slate-700/80 rounded-3xl p-6 sm:p-8 space-y-8 shadow-2xl backdrop-blur-md">
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-400 uppercase tracking-wider mb-1">
                <span>CREATE YOUR ADVENTURE</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 font-sans">
                Set where and what you're in the mood to explore. AI validates real locations before generating your on-site quest.
              </p>
            </div>
            <span className="text-[11px] font-mono text-slate-500 self-start sm:self-auto">
              Ready to explore in ~30 seconds
            </span>
          </div>

          <form onSubmit={handleQuickSubmit} className="space-y-8">
            
            {/* STEP 1: WHERE? */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-mono">
                <label className="text-amber-400 font-bold flex items-center gap-1.5 uppercase tracking-wider">
                  <span>📍 STEP 1: WHERE?</span>
                </label>
                <button
                  type="button"
                  onClick={handleUseLocation}
                  disabled={isLocating}
                  className="text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
                >
                  <Locate className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
                  <span>{isLocating ? 'Locating...' : 'Use My Location'}</span>
                </button>
              </div>

              <div className="relative">
                <MapPin className="w-4 h-4 text-rose-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={quickLocation}
                  onChange={(e) => setQuickLocation(e.target.value)}
                  placeholder="Enter a city, neighborhood or place (e.g. Kolkata, Park Street, London)..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-11 pr-4 py-3.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500/50 font-mono transition-colors"
                />
              </div>

              {/* Preset Quick Chips */}
              <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono text-slate-400">
                <span className="text-slate-500">Popular:</span>
                {['Kolkata', 'Salt Lake', 'Central Park', 'Park Street'].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setQuickLocation(preset)}
                    className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800/80 rounded-lg transition-colors"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* STEP 2: WHAT ARE YOU LOOKING FOR? (GENRE CARDS) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-mono">
                <label className="text-amber-400 font-bold flex items-center gap-1.5 uppercase tracking-wider">
                  <span>🎭 STEP 2: WHAT ARE YOU LOOKING FOR?</span>
                </label>
                <span className="text-slate-500">{quickGenre} selected</span>
              </div>

              {/* Grid of 13 Genre Cards with Icons & Descriptions */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 max-h-80 overflow-y-auto pr-1">
                {coreGenres.map((genre) => {
                  const isSelected = quickGenre === genre.id;
                  return (
                    <button
                      key={genre.id}
                      type="button"
                      onClick={() => setQuickGenre(genre.id)}
                      className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between min-h-[92px] group ${
                        isSelected
                          ? 'bg-amber-500/15 border-amber-500 text-slate-100 shadow-md shadow-amber-500/10 ring-1 ring-amber-500/40'
                          : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <span className="text-xl group-hover:scale-110 transition-transform">
                          {genre.icon}
                        </span>
                        {isSelected && (
                          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                        )}
                      </div>

                      <div>
                        <div className="font-serif font-bold text-xs text-slate-100 group-hover:text-amber-300 transition-colors truncate">
                          {genre.label}
                        </div>
                        <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5 font-sans">
                          {genre.tagline}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Genre Context Banner */}
              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800/80 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-300 flex items-center gap-2">
                  <span>{activeGenreDef.icon}</span>
                  <strong className="text-amber-300">{activeGenreDef.label}:</strong>
                  <span className="text-slate-400 text-[11px] hidden sm:inline">{activeGenreDef.clueFocus}</span>
                </span>
                <span className="text-[10px] text-slate-500 shrink-0">
                  {activeGenreDef.defaultSourceLabel}
                </span>
              </div>
            </div>

            {/* STEP 3 & STEP 4: DURATION & MODE */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-1">
              
              {/* STEP 3: HOW LONG? */}
              <div className="space-y-2">
                <label className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider block">
                  ⏱️ STEP 3: HOW LONG?
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[15, 30, 60].map((dur) => (
                    <button
                      key={dur}
                      type="button"
                      onClick={() => setQuickDuration(dur)}
                      className={`py-2.5 rounded-xl border text-xs font-mono font-bold transition-all ${
                        quickDuration === dur
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500 shadow-sm'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      {dur} min
                    </button>
                  ))}
                </div>
              </div>

              {/* STEP 4: MODE */}
              <div className="space-y-2">
                <label className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider block">
                  ⚡ STEP 4: MODE
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setQuickMode('classic')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-mono transition-all flex items-center justify-center gap-1.5 ${
                      quickMode === 'classic'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500 font-bold shadow-sm'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <span>Classic</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setQuickMode('live')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-mono transition-all flex items-center justify-center gap-1.5 ${
                      quickMode === 'live'
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500 font-bold shadow-sm'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5 text-cyan-400 fill-current" />
                    <span>Live Now</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Error Banner with Graceful Actions (Requirement #22) */}
            {generationError && (
              <div className="p-4 bg-rose-950/40 border border-rose-500/40 rounded-2xl space-y-2 text-xs">
                <div className="flex items-center gap-2 text-rose-300 font-mono font-bold">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{generationError}</span>
                </div>
                <div className="flex flex-wrap items-center gap-2 pt-1 font-mono text-[11px]">
                  <button
                    type="submit"
                    className="px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/40 rounded-lg transition-colors"
                  >
                    TRY AGAIN
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickGenre('Surprise')}
                    className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-lg transition-colors"
                  >
                    CHANGE GENRE
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickLocation('Central City')}
                    className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-lg transition-colors"
                  >
                    CHANGE LOCATION
                  </button>
                </div>
              </div>
            )}

            {/* Multi-Stage Loading Feedback during Hunt Generation (Requirement #21) */}
            {isSubmittingQuick ? (
              <div className="p-5 bg-slate-950 rounded-2xl border border-amber-500/30 text-center space-y-3">
                <div className="relative w-8 h-8 mx-auto">
                  <RefreshCw className="w-8 h-8 text-amber-400 animate-spin" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-mono font-bold text-amber-300 uppercase tracking-wider animate-pulse">
                    {loadingSteps[loadingStepIndex]}
                  </p>
                  <p className="text-[11px] font-mono text-slate-400">
                    Grounded in real-world sources for {quickLocation} ({quickGenre})
                  </p>
                </div>
              </div>
            ) : (
              /* PRIMARY CTA BUTTON */
              <button
                type="submit"
                disabled={!quickLocation.trim()}
                className="w-full py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-serif font-bold text-base rounded-2xl shadow-xl shadow-amber-500/20 transition-all flex items-center justify-center gap-2 hover:scale-[1.01]"
              >
                <span>🏴‍☠️ CREATE HUNT</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </form>
        </div>
      </section>

      {/* 17. "I'M CURIOUS" FEATURE */}
      <section className="bg-gradient-to-br from-amber-950/20 via-slate-900/90 to-slate-950 border border-amber-500/30 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
          <div>
            <span className="text-xs font-mono text-amber-400 font-bold uppercase tracking-wider block">
              🔎 I'M CURIOUS
            </span>
            <p className="text-sm font-serif font-bold text-slate-100">
              "Find something nearby I probably wouldn't search for."
            </p>
          </div>

          <button
            type="button"
            onClick={() => fetchCuriousSpot(quickLocation || 'Kolkata')}
            disabled={isLoadingCurious}
            className="px-5 py-2.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 self-start sm:self-auto"
          >
            {isLoadingCurious ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <span>SURPRISE ME</span>
            )}
          </button>
        </div>

        {curiousSpot && (
          <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="text-lg font-serif font-bold text-amber-300">
                  {curiousSpot.placeName}
                </h4>
                <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span>{curiousSpot.address}</span>
                  {curiousSpot.distanceText && <span>&bull; {curiousSpot.distanceText}</span>}
                </div>
              </div>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 font-mono">
                {curiousSpot.category}
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 font-sans leading-relaxed">
              "{curiousSpot.whyCurious}"
            </p>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs font-mono">
              <a
                href={curiousSpot.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-400 hover:text-amber-300 flex items-center gap-1 underline underline-offset-2 text-[11px]"
              >
                <span>Source: {curiousSpot.sourceTitle}</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>

              <button
                type="button"
                onClick={() => {
                  if (onQuickGenerateHunt) {
                    onQuickGenerateHunt({
                      locationName: curiousSpot.placeName,
                      mode: curiousSpot.category,
                      durationMinutes: 15,
                      numberOfStops: 2
                    });
                  } else {
                    onCreateHunt(curiousSpot.placeName, curiousSpot.category);
                  }
                }}
                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-[11px] rounded-xl flex items-center gap-1 shadow-sm"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>DISCOVER THIS</span>
              </button>
            </div>
          </div>
        )}
      </section>

      {/* 7. LIVE LOCAL RADAR UI */}
      <section id="live-radar-section" className="bg-slate-900/90 border border-slate-800/90 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl scroll-mt-24">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono font-semibold mb-2">
              <Zap className="w-3.5 h-3.5 text-cyan-400 fill-current" />
              <span>LIVE RECENT DISCOVERIES</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-100 flex items-center gap-2">
              <span>⚡ LIVE LOCAL RADAR</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl font-sans">
              "Recent discoveries, reports and unusual things happening around you." Real-time search for newly discovered places, food spots, ghost stories, and heritage news.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            {onOpenArticles && (
              <button
                type="button"
                onClick={() => onOpenArticles(radarLocation || quickLocation, quickGenre)}
                className="px-3.5 py-2 bg-slate-950 hover:bg-slate-800 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>📰 Stories & Cases</span>
              </button>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (radarLocation.trim()) {
                  fetchLiveRadar(radarLocation.trim(), quickGenre);
                }
              }}
              className="flex items-center gap-2"
            >
              <div className="relative">
                <MapPin className="w-4 h-4 text-cyan-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={radarLocation}
                  onChange={(e) => setRadarLocation(e.target.value)}
                  placeholder="Any city or neighborhood..."
                  className="bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 font-mono w-44 sm:w-56"
                />
              </div>
              <button
                type="submit"
                disabled={isLoadingRadar}
                className="px-3.5 py-2 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/30 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 shrink-0 transition-colors"
              >
                {isLoadingRadar ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                <span>Scan Radar</span>
              </button>
            </form>
          </div>
        </div>

        {/* RADAR CARDS GRID */}
        {isLoadingRadar ? (
          <div className="py-12 text-center space-y-3">
            <RefreshCw className="w-7 h-7 text-cyan-400 animate-spin mx-auto" />
            <p className="text-xs font-mono text-slate-400">
              ⚡ Scanning real-world sources around {radarLocation}...
            </p>
          </div>
        ) : radarItems.length === 0 ? (
          <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-6 text-center space-y-2">
            <Radio className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-xs font-mono text-slate-300">
              {hasSearchedRadar 
                ? `No recent live reports found in ${radarLocation}. Tap "Scan Radar" to search any neighborhood or city!`
                : `Tap "Scan Radar" to find what is currently or recently interesting in ${radarLocation}.`}
            </p>
            <button
              type="button"
              onClick={() => fetchLiveRadar(radarLocation || 'Kolkata', quickGenre)}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/30 rounded-xl text-xs font-mono font-semibold inline-flex items-center gap-1.5 mt-2"
            >
              <Zap className="w-3 h-3 text-cyan-400" />
              <span>Search Live Discoveries</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {radarItems.map((item) => (
              <div
                key={item.id}
                className="bg-slate-950 border border-slate-800 hover:border-cyan-500/40 rounded-2xl p-4 flex flex-col justify-between space-y-3 transition-all shadow-lg"
              >
                <div className="space-y-2">
                  {/* Subtle Labels (Requirement #7) */}
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-cyan-400 font-bold uppercase">
                      {item.isRecent ? '⚡ RECENT REPORT' : '📰 REPORTED'}
                    </span>
                    <span className="text-slate-400 truncate">
                      {item.genre}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-base font-serif font-bold text-slate-100 truncate">
                      {item.placeName}
                    </h4>
                    <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono mt-0.5">
                      <MapPin className="w-3 h-3 text-rose-400 shrink-0" />
                      <span className="truncate">{item.address}</span>
                      {item.distanceText && <span>&bull; {item.distanceText}</span>}
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 font-sans line-clamp-3 leading-relaxed">
                    "{item.whyInteresting}"
                  </p>

                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-800/80">
                    <span className="text-amber-400 font-bold">
                      {item.recencyText || 'Recent local discussion'}
                    </span>
                    <span className="truncate text-slate-500 max-w-[120px]">
                      {item.sourceDomain || 'Web report'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-900">
                  <a
                    href={item.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2 px-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 rounded-xl text-[10px] font-mono font-bold transition-all text-center flex items-center justify-center gap-1"
                  >
                    <span>READ SOURCE</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>

                  <button
                    type="button"
                    onClick={() => {
                      if (onQuickGenerateHunt) {
                        onQuickGenerateHunt({
                          locationName: item.address || radarLocation,
                          mode: item.genre,
                          durationMinutes: 30,
                          numberOfStops: 3,
                          isLive: true
                        });
                      } else {
                        onCreateHunt(item.address || radarLocation, item.genre);
                      }
                    }}
                    className="flex-1 py-2 px-2 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-slate-950 rounded-xl text-[10px] font-mono font-bold transition-all text-center flex items-center justify-center gap-1 shadow-sm"
                  >
                    <Compass className="w-3 h-3" />
                    <span>HUNT</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 8. TODAY'S DISCOVERIES SECTION */}
      <section id="discoveries-section" className="space-y-6 scroll-mt-24">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800/80 pb-3 gap-3">
          <div>
            <span className="text-xs font-mono text-amber-400 font-bold uppercase tracking-wider block">
              REAL-WORLD LOCATIONS FOUND
            </span>
            <h2 className="text-2xl font-serif font-bold text-slate-100">
              Today's Discoveries ({selectedCategory})
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs font-mono">
              <button
                type="button"
                onClick={() => setDiscoveryViewMode('cards')}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  discoveryViewMode === 'cards'
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Cards
              </button>
              <button
                type="button"
                onClick={() => setDiscoveryViewMode('map')}
                className={`px-3 py-1 rounded-lg transition-colors flex items-center gap-1.5 ${
                  discoveryViewMode === 'map'
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <MapIcon className="w-3.5 h-3.5" />
                <span>Live Map</span>
              </button>
            </div>

            <button
              onClick={() => fetchNearbyDiscoveries(quickLocation, selectedCategory)}
              className="text-xs font-mono text-amber-400 hover:text-amber-300 flex items-center gap-1 font-bold bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingDiscoveries ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
          {GENRE_DEFINITIONS.map((cat) => {
            const isSelected = normalizeCategory(selectedCategory) === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.shortName}</span>
              </button>
            );
          })}
        </div>

        {/* Discovery Views */}
        {isLoadingDiscoveries ? (
          <div className="py-12 text-center space-y-3 bg-slate-900/60 rounded-3xl border border-slate-800">
            <RefreshCw className="w-8 h-8 text-amber-400 animate-spin mx-auto" />
            <p className="text-xs font-mono text-slate-400">
              Gemini + SerpApi researching verified places in {quickLocation}...
            </p>
          </div>
        ) : discoveryViewMode === 'map' ? (
          /* Google Maps Embed View */
          <div className="space-y-4">
            <div className="relative rounded-3xl overflow-hidden border border-slate-800 bg-slate-950 h-96 shadow-2xl">
              <iframe
                title={`Google Maps embed showing discoveries in ${quickLocation}`}
                src={(import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '').trim()
                  ? `https://www.google.com/maps/embed/v1/search?key=${(import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '').trim()}&q=${encodeURIComponent(
                      selectedCategory + ' heritage places in ' + quickLocation
                    )}`
                  : `https://maps.google.com/maps?q=${encodeURIComponent(
                      selectedCategory + ' heritage places in ' + quickLocation
                    )}&t=&z=14&ie=UTF8&iwloc=&output=embed`}
                width="100%"
                height="100%"
                className="w-full h-full border-0"
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
              />
              <div className="absolute top-4 left-4 bg-slate-950/90 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-slate-800 text-xs font-mono font-bold text-amber-300 shadow flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-rose-400" />
                <span>Google Maps: {quickLocation}</span>
              </div>
            </div>

            {discoveries.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {discoveries.map((p, idx) => (
                  <div key={p.id} className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl space-y-2">
                    <div className="flex items-center gap-2 text-[10px] font-mono text-amber-400 font-bold">
                      <span>#{idx + 1}</span>
                      <span className="truncate">{p.category}</span>
                    </div>
                    <h4 className="text-xs font-serif font-bold text-slate-100 truncate">{p.placeName}</h4>
                    <p className="text-[11px] text-slate-400 line-clamp-2">{p.whyGo}</p>
                    <button
                      onClick={() => onStartPlaceTask(p)}
                      className="w-full py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-mono text-[10px] rounded-lg border border-amber-500/30 flex items-center justify-center gap-1"
                    >
                      <span>Start Hunt Here</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : discoveries.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {discoveries.map((place, idx) => (
              <RealPlaceCard
                key={place.id}
                place={place}
                index={idx}
                onStartTask={onStartPlaceTask}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-400 font-mono text-xs">
            Discovery service temporarily unavailable. Enter a city above to explore.
          </div>
        )}
      </section>

      {/* SAMPLE CURATED HUNTS */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
          <div>
            <span className="text-xs font-mono text-amber-400 font-bold uppercase tracking-wider block">
              CURATED ROUTES
            </span>
            <h2 className="text-2xl font-serif font-bold text-slate-100">
              Sample Real-World Hunts
            </h2>
          </div>

          <button
            onClick={() => onCreateHunt()}
            className="text-xs font-mono text-amber-400 hover:text-amber-300 flex items-center gap-1 font-bold"
          >
            <span>Plan custom route</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {PRESET_HUNTS.map((preset) => (
            <div
              key={preset.id}
              className="bg-slate-900 border border-slate-800 hover:border-amber-500/40 rounded-3xl p-6 space-y-4 transition-all group shadow-xl"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs font-mono text-amber-400 mb-1">
                    <span>{preset.mode} Mode</span>
                    <span>&bull;</span>
                    <span>{preset.durationMinutes} Mins</span>
                    <span>&bull;</span>
                    <span>{preset.totalStops} Stops</span>
                  </div>
                  <h3 className="text-xl font-serif font-bold text-slate-100 group-hover:text-amber-300 transition-colors">
                    {preset.title}
                  </h3>
                </div>

                <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                  {preset.locationName}
                </span>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                {preset.storyBehindThePlaces || 'A curated physical exploration route featuring real verified heritage places and architectural tasks.'}
              </p>

              <button
                onClick={() => onLaunchPresetHunt(preset)}
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-100 font-serif font-bold rounded-2xl text-xs transition-colors flex items-center justify-center gap-2 border border-slate-700"
              >
                <Play className="w-3.5 h-3.5 text-amber-400" />
                <span>START THIS HUNT NOW</span>
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* THE DISCOVERY LOOP */}
      <section className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 sm:p-10 space-y-8">
        <div className="text-center space-y-2">
          <span className="text-xs font-mono text-amber-400 font-bold uppercase tracking-wider">
            THE DISCOVERY LOOP
          </span>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-100">
            How Real-World Discovery Works
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 font-mono font-bold flex items-center justify-center text-sm">
              1
            </div>
            <h3 className="font-serif font-bold text-slate-100 text-base">Select Location & Genre</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Choose your theme (Ghost stories, Architecture, Street Food, etc.) and where you want to walk.
            </p>
          </div>

          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 font-mono font-bold flex items-center justify-center text-sm">
              2
            </div>
            <h3 className="font-serif font-bold text-slate-100 text-base">AI Finds Real Spots</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Gemini + SerpApi research authentic verified places and generate physical visual clues.
            </p>
          </div>

          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 font-mono font-bold flex items-center justify-center text-sm">
              3
            </div>
            <h3 className="font-serif font-bold text-slate-100 text-base">Navigate & Observe</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Follow directions in Google Maps. Search for the subtle physical clue in public view.
            </p>
          </div>

          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 font-mono font-bold flex items-center justify-center text-sm">
              4
            </div>
            <h3 className="font-serif font-bold text-slate-100 text-base">Report & Evolve</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Tap "I Found It" to submit your field findings. The AI adapts the next clue to what you observed.
            </p>
          </div>
        </div>
      </section>

    </div>
  );
};
