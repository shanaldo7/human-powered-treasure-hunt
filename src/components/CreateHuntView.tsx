import React, { useState } from 'react';
import { Compass, MapPin, Navigation, Sparkles, RefreshCw, Map as MapIcon, ExternalLink, ShieldAlert, CheckCircle2, Zap, CloudRain, Sun } from 'lucide-react';
import { DiscoveryCategory, HuntDifficulty } from '../types/hunt';
import { GENRE_DEFINITIONS, getGenreDefinition, normalizeCategory } from '../data/genreDefinitions';

interface CreateHuntViewProps {
  onGenerateHunt: (params: {
    locationName: string;
    mode: DiscoveryCategory;
    durationMinutes: number;
    numberOfStops: number;
    userCoordinates?: { latitude: number; longitude: number };
    isLive?: boolean;
    difficulty?: HuntDifficulty;
    weather?: string;
  }) => Promise<void>;
  isLoading: boolean;
  initialLocation?: string;
  initialMode?: DiscoveryCategory;
}

export const CreateHuntView: React.FC<CreateHuntViewProps> = ({
  onGenerateHunt,
  isLoading,
  initialLocation,
  initialMode
}) => {
  const [locationName, setLocationName] = useState(initialLocation || '');
  const [userCoords, setUserCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [showNearbyMap, setShowNearbyMap] = useState(false);
  const [locationNotice, setLocationNotice] = useState<string | null>('Location access is optional. You can enter any city or place manually.');

  const [mode, setMode] = useState<DiscoveryCategory>(initialMode ? normalizeCategory(initialMode) : 'Hidden History');
  const [huntFlowMode, setHuntFlowMode] = useState<'classic' | 'live' | 'surprise'>('classic');
  const [difficulty, setDifficulty] = useState<HuntDifficulty>('EXPLORER');
  const [weatherCondition, setWeatherCondition] = useState<string>('Clear');
  const [durationMinutes, setDurationMinutes] = useState<number>(30);
  const [numberOfStops, setNumberOfStops] = useState<number>(3);

  const presetExamples = ['Kolkata', 'Salt Lake', 'New Town', 'Central Park', 'Park Street'];
  const activeGenre = getGenreDefinition(huntFlowMode === 'surprise' ? 'Surprise' : mode);

  // Handle Browser Geolocation & Google Maps Nearby Integration
  const handleUseMyLocation = () => {
    setShowNearbyMap(true);
    setLocationNotice('📍 Showing places near your location on Google Maps below.');
    if (!locationName.trim() || locationName === 'Central City Park') {
      setLocationName('Near My Location');
    }

    if (navigator.geolocation) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
          setUserCoordinates(coords);
          setLocationName(`Near My Location (${coords.latitude.toFixed(3)}, ${coords.longitude.toFixed(3)})`);
          setIsLocating(false);
          setLocationNotice('📍 Showing places near your location on Google Maps below.');
        },
        (_err) => {
          setIsLocating(false);
          setLocationNotice('📍 Showing places near your location on Google Maps below.');
        },
        { timeout: 8000, enableHighAccuracy: true }
      );
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalLocation = locationName.trim() || 'Central City Park';
    onGenerateHunt({
      locationName: finalLocation,
      mode: huntFlowMode === 'surprise' ? 'Surprise' : mode,
      durationMinutes,
      numberOfStops,
      userCoordinates: userCoords || undefined,
      isLive: huntFlowMode === 'live',
      difficulty,
      weather: weatherCondition !== 'Clear' ? weatherCondition : undefined
    });
  };

  const walkingMins = numberOfStops * 7;
  const exploreMins = numberOfStops * 8;

  return (
    <div className="py-8 px-4 sm:px-6 max-w-3xl mx-auto font-sans space-y-8">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono font-semibold">
          <Compass className="w-3.5 h-3.5 text-amber-400" />
          <span>REAL-WORLD ROUTE BUILDER</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-slate-100">
          Plan a Discovery Hunt
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
          Specify where you want to explore. Gemini + SerpApi will discover real lesser-known places and build your physical treasure hunt.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
        {/* LOCATION SELECTOR */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400">
              WHERE DO YOU WANT TO EXPLORE?
            </label>
            <span className="text-[10px] font-mono text-slate-500">Location required (Manual or GPS)</span>
          </div>

          <div className="relative">
            <MapPin className="w-4 h-4 text-rose-400 absolute left-4 top-4" />
            <input
              type="text"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              placeholder="Search a city, park, landmark or area..."
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-11 pr-4 py-3.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500/50 transition-colors font-mono"
            />
          </div>

          {/* SUGGESTION PILLS */}
          <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono text-slate-400">
            <span>Examples:</span>
            {presetExamples.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => setLocationName(ex)}
                className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-lg transition-colors"
              >
                {ex}
              </button>
            ))}
          </div>

          {/* OR USE MY LOCATION */}
          <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-[11px] font-mono text-slate-400">
              {locationNotice || 'Location access is optional. You can enter any city or place manually.'}
            </p>

            <button
              type="button"
              onClick={handleUseMyLocation}
              disabled={isLocating || isLoading}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 rounded-xl text-xs font-mono font-semibold flex items-center gap-2 transition-colors shrink-0"
            >
              <Navigation className={`w-3.5 h-3.5 text-amber-400 ${isLocating ? 'animate-spin' : ''}`} />
              <span>{isLocating ? 'Locating...' : '📍 Use My Location'}</span>
            </button>
          </div>

          {/* INTERACTIVE GOOGLE MAP FOR NEARBY PLACES */}
          {showNearbyMap && (
            <div className="pt-3 space-y-2 border-t border-slate-800">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="flex items-center gap-1.5 text-amber-300 font-bold">
                  <MapIcon className="w-3.5 h-3.5 text-amber-400" />
                  <span>Google Map — Places Near Your Location</span>
                </span>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('historic heritage landmarks near me')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-400 hover:text-amber-300 flex items-center gap-1 text-[10px] font-semibold"
                >
                  <span>Open Fullscreen</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 h-64 sm:h-72 shadow-2xl">
                <iframe
                  title="Google Maps places near me"
                  src={(import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '').trim()
                    ? `https://www.google.com/maps/embed/v1/search?key=${(import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '').trim()}&q=${encodeURIComponent('historic heritage landmarks near me')}`
                    : `https://maps.google.com/maps?q=${encodeURIComponent('historic heritage landmarks near me')}&t=&z=14&ie=UTF8&iwloc=&output=embed`}
                  width="100%"
                  height="100%"
                  className="w-full h-full border-0"
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
              <p className="text-[10px] font-mono text-slate-400">
                🗺️ Google Map is live! Browse nearby heritage landmarks above or customize your hunt below.
              </p>
            </div>
          )}
        </div>

        {/* DISCOVERY MODE (GENRES) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400 block">
              WHAT ARE YOU IN THE MOOD TO DISCOVER? (GENRE)
            </label>
            <span className="text-[10px] font-mono text-slate-500">{GENRE_DEFINITIONS.length} themes available</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 text-xs font-mono max-h-72 overflow-y-auto pr-1">
            {GENRE_DEFINITIONS.map((cat) => {
              const isSelected = mode === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setMode(cat.id)}
                  className={`p-3 rounded-2xl border text-left transition-all flex flex-col gap-1 ${
                    isSelected
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 ring-1 ring-amber-500/50'
                      : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-base">{cat.icon}</span>
                    {isSelected && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/30 text-amber-200">
                        SELECTED
                      </span>
                    )}
                  </div>
                  <div className="font-bold text-xs truncate text-slate-100">
                    {cat.label}
                  </div>
                  <div className="text-[10px] text-slate-400 line-clamp-1">
                    {cat.tagline}
                  </div>
                </button>
              );
            })}
          </div>

          {/* ACTIVE GENRE SAFETY & FOCUS GUIDANCE */}
          <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-amber-300 font-bold flex items-center gap-1.5">
                <span>{activeGenre.icon}</span>
                <span>{activeGenre.label}</span>
                <span className="text-slate-500">&bull;</span>
                <span className="text-slate-400">{activeGenre.taskType}</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                {activeGenre.defaultSourceLabel}
              </span>
            </div>
            <p className="text-[11px] text-slate-300 font-sans">
              <strong>Clue Focus:</strong> {activeGenre.clueFocus}
            </p>
            <p className="text-[10px] text-amber-400/90 font-mono flex items-center gap-1">
              <ShieldAlert className="w-3 h-3 text-amber-400 shrink-0" />
              <span>Safety Rule: {activeGenre.safetyGuidance}</span>
            </p>
          </div>
        </div>

        {/* HUNT MODE & FLOW (Requirement #17 & #18) */}
        <div className="space-y-2">
          <label className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400 block">
            HUNT MODE & RESEARCH STYLE
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setHuntFlowMode('classic')}
              className={`p-3 rounded-2xl border text-xs font-mono transition-all text-center flex flex-col items-center gap-1 ${
                huntFlowMode === 'classic'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500 ring-1 ring-amber-500/40 font-bold'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              <span className="text-base">🏛️</span>
              <span>Classic</span>
              <span className="text-[10px] text-slate-500 font-normal">Documented spots</span>
            </button>

            <button
              type="button"
              onClick={() => setHuntFlowMode('live')}
              className={`p-3 rounded-2xl border text-xs font-mono transition-all text-center flex flex-col items-center gap-1 ${
                huntFlowMode === 'live'
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500 ring-1 ring-rose-500/40 font-bold'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              <span className="text-base">⚡</span>
              <span>Live Now</span>
              <span className="text-[10px] text-rose-400/80 font-normal">Recent news & stories</span>
            </button>

            <button
              type="button"
              onClick={() => setHuntFlowMode('surprise')}
              className={`p-3 rounded-2xl border text-xs font-mono transition-all text-center flex flex-col items-center gap-1 ${
                huntFlowMode === 'surprise'
                  ? 'bg-purple-500/20 text-purple-300 border-purple-500 ring-1 ring-purple-500/40 font-bold'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              <span className="text-base">🎲</span>
              <span>Surprise Me</span>
              <span className="text-[10px] text-purple-400/80 font-normal">AI chooses genre</span>
            </button>
          </div>
        </div>

        {/* HUNT DIFFICULTY (Requirement #15) */}
        <div className="space-y-2">
          <label className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400 block">
            HUNT DIFFICULTY (CLUE COMPLEXITY)
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'CASUAL' as const, label: '🟢 CASUAL', desc: 'Direct visual cues' },
              { id: 'EXPLORER' as const, label: '🟡 EXPLORER', desc: 'Craftsmanship & details' },
              { id: 'DETECTIVE' as const, label: '🔴 DETECTIVE', desc: 'Multi-clue deductions' }
            ].map(diff => (
              <button
                key={diff.id}
                type="button"
                onClick={() => setDifficulty(diff.id)}
                className={`p-2.5 rounded-xl border text-xs font-mono transition-all text-center flex flex-col items-center gap-0.5 ${
                  difficulty === diff.id
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500 font-bold'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                <span>{diff.label}</span>
                <span className="text-[9px] text-slate-500">{diff.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* WEATHER CONDITION (Requirement #14) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400 block">
              WEATHER ADAPTATION
            </label>
            <span className="text-[10px] font-mono text-slate-500">Adapts outdoor vs covered spots</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setWeatherCondition('Clear')}
              className={`p-2.5 rounded-xl border text-xs font-mono transition-all flex items-center justify-center gap-1.5 ${
                weatherCondition === 'Clear'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500 font-bold'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span>☀️ Clear / Outdoor Normal</span>
            </button>
            <button
              type="button"
              onClick={() => setWeatherCondition('Rain')}
              className={`p-2.5 rounded-xl border text-xs font-mono transition-all flex items-center justify-center gap-1.5 ${
                weatherCondition === 'Rain'
                  ? 'bg-blue-500/20 text-blue-300 border-blue-500 font-bold'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              <CloudRain className="w-3.5 h-3.5 text-blue-400" />
              <span>🌧️ Rain / Covered Arcades Preferred</span>
            </button>
          </div>
        </div>

        {/* DURATION & STOPS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400 block">
              ESTIMATED DURATION
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[15, 30, 45, 60].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setDurationMinutes(mins)}
                  className={`py-2 rounded-xl border text-[11px] font-mono font-bold transition-all ${
                    durationMinutes === mins
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  {mins}m
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400 block">
              NUMBER OF STOPS
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[3, 5, 7].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setNumberOfStops(num)}
                  className={`py-2 rounded-xl border text-[11px] font-mono font-bold transition-all ${
                    numberOfStops === num
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  {num} Stops
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ROUTE TIMINGS PREVIEW (Requirement #12) */}
        <div className="grid grid-cols-3 gap-2 bg-slate-950 p-3 rounded-2xl border border-slate-800/80 text-center font-mono text-xs">
          <div>
            <span className="text-[10px] text-slate-500 block uppercase">WALKING</span>
            <span className="text-slate-200 font-bold">🚶 ~{walkingMins} min</span>
          </div>
          <div className="border-x border-slate-800">
            <span className="text-[10px] text-slate-500 block uppercase">EXPLORATION</span>
            <span className="text-amber-300 font-bold">🔎 ~{exploreMins} min</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block uppercase">ESTIMATED TOTAL</span>
            <span className="text-emerald-400 font-bold">⏱️ ~{durationMinutes} min</span>
          </div>
        </div>

        {/* GENRE + LOCATION + DURATION SYNTHESIS SUMMARY */}
        <div className="p-3.5 bg-gradient-to-r from-amber-500/10 via-slate-950 to-amber-500/10 border border-amber-500/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
            <div className="text-xs font-mono">
              <span className="text-slate-400">Target Hunt Formula: </span>
              <span className="text-amber-300 font-bold">
                {locationName.trim() || 'Location'} + {huntFlowMode === 'surprise' ? '🎲 Surprise Me' : activeGenre.label} + {durationMinutes} mins
              </span>
            </div>
          </div>
          <div className="text-[11px] font-mono font-bold text-amber-400 px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-500/30 self-start sm:self-auto">
            {huntFlowMode === 'live' ? '⚡ Live Now' : 'Classic'} &bull; {difficulty}
          </div>
        </div>

        {/* SUBMIT BUTTON WITH MULTI-STAGE LOADING */}
        <div className="pt-2">
          {isLoading ? (
            <div className="p-4 bg-slate-950 rounded-2xl border border-amber-500/30 text-center space-y-2">
              <RefreshCw className="w-6 h-6 text-amber-400 animate-spin mx-auto" />
              <p className="text-xs font-mono font-bold text-amber-300 uppercase tracking-wider animate-pulse">
                BUILDING YOUR HUNT &bull; VERIFYING REAL-WORLD CITATIONS...
              </p>
              <p className="text-[11px] font-mono text-slate-400">
                Grounded in web research for {locationName} ({activeGenre.label})
              </p>
            </div>
          ) : (
            <button
              type="submit"
              disabled={isLoading || !locationName.trim()}
              className="w-full py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 text-slate-950 font-serif font-bold text-base rounded-2xl shadow-xl shadow-amber-500/20 transition-all flex items-center justify-center gap-2.5 hover:scale-[1.01]"
            >
              <span>🏴‍☠️ DISCOVER REAL PLACES</span>
              <Navigation className="w-4 h-4 ml-1" />
            </button>
          )}
        </div>
      </form>
    </div>
  );
};
