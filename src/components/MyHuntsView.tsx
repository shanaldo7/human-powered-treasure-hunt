import React, { useState } from 'react';
import { TreasureHunt } from '../types/hunt';
import { 
  Compass, 
  Award, 
  CheckCircle2, 
  Play, 
  Trash2, 
  ArrowRight, 
  MapPin, 
  ExternalLink,
  BookOpen,
  Camera,
  ChevronDown,
  ChevronUp,
  Share2
} from 'lucide-react';

interface MyHuntsViewProps {
  activeHunt: TreasureHunt | null;
  completedHunts: TreasureHunt[];
  onContinueHunt: () => void;
  onViewReport: (hunt: TreasureHunt) => void;
  onCreateNewHunt: () => void;
  onClearActiveHunt: () => void;
  onDeleteCompletedHunt?: (id: string) => void;
  onClearAllHistory?: () => void;
}

export const MyHuntsView: React.FC<MyHuntsViewProps> = ({
  activeHunt,
  completedHunts,
  onContinueHunt,
  onViewReport,
  onCreateNewHunt,
  onClearActiveHunt,
  onDeleteCompletedHunt,
  onClearAllHistory
}) => {
  const [expandedHuntId, setExpandedHuntId] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  return (
    <div className="py-8 px-4 sm:px-6 max-w-4xl mx-auto font-sans space-y-8">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-semibold mb-2">
            <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
            <span>DISCOVERY JOURNAL</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-slate-100">
            My Discoveries
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 font-sans mt-0.5">
            Your personal record of completed hunts, visited locations, observations, and verified sources.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto font-mono text-xs">
          {completedHunts.length > 0 && onClearAllHistory && (
            <button
              onClick={() => {
                if (confirmClear) {
                  onClearAllHistory();
                  setConfirmClear(false);
                } else {
                  setConfirmClear(true);
                  setTimeout(() => setConfirmClear(false), 4000);
                }
              }}
              className="px-3.5 py-2.5 bg-slate-950 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-500/30 rounded-xl transition-colors flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span>{confirmClear ? 'Confirm Clear All?' : 'Clear History'}</span>
            </button>
          )}

          <button
            onClick={onCreateNewHunt}
            className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-serif font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all"
          >
            <Compass className="w-4 h-4" />
            <span>START A HUNT</span>
          </button>
        </div>
      </div>

      {/* ACTIVE HUNT CARD IF PRESENT */}
      {activeHunt && (
        <div className="bg-slate-900/90 border border-amber-500/40 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-amber-400 mb-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>HUNT IN PROGRESS</span>
                <span>&bull;</span>
                <span>STOP {activeHunt.currentStopNumber} OF {activeHunt.totalStops}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-slate-100">
                {activeHunt.title}
              </h2>
              <p className="text-xs text-slate-400 mt-1 font-mono">
                📍 {activeHunt.locationName} &bull; 🎭 {activeHunt.mode} &bull; ⏱️ {activeHunt.durationMinutes} Mins
              </p>
            </div>

            <button
              onClick={onClearActiveHunt}
              className="p-2 text-slate-500 hover:text-rose-400 bg-slate-950 rounded-xl border border-slate-800 transition-colors"
              title="Cancel Active Hunt"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={onContinueHunt}
              className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-serif font-bold text-xs rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-amber-500/20"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>CONTINUE ACTIVE HUNT</span>
            </button>
          </div>
        </div>
      )}

      {/* COMPLETED HUNTS LIST (DISCOVERY JOURNAL) */}
      <div className="space-y-4">
        {completedHunts.length === 0 ? (
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-10 text-center space-y-4 shadow-xl">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto text-2xl font-bold">
              🗺️
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-serif font-bold text-slate-200">
                "Your discovery journal is empty."
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto font-sans">
                "Start exploring real streets and your completed hunts, visited places, observations, and verified sources will appear here."
              </p>
            </div>
            <button
              onClick={onCreateNewHunt}
              className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-serif font-bold rounded-xl text-xs inline-flex items-center gap-2 shadow-lg shadow-amber-500/20"
            >
              <span>[ START YOUR FIRST HUNT ]</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400 px-1">
              <span>{completedHunts.length} COMPLETED DISCOVERIES RECORDED</span>
              <span className="text-slate-500">Persisted locally in browser</span>
            </div>

            {completedHunts.map(hunt => {
              const formattedDate = hunt.completedAt || hunt.createdAt
                ? new Date(hunt.completedAt || hunt.createdAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })
                : 'Recent';

              const placesCount = Array.isArray(hunt.stops) ? hunt.stops.length : hunt.totalStops;
              const isExpanded = expandedHuntId === hunt.id;
              const userProgress = Array.isArray(hunt.userProgress) ? hunt.userProgress : [];

              return (
                <div
                  key={hunt.id}
                  className="bg-slate-900/90 border border-slate-800 hover:border-slate-750 rounded-2xl p-5 space-y-4 transition-all shadow-lg"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                    <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                      <span className="text-amber-400 font-bold">
                        📍 {hunt.locationName}
                      </span>
                      <span className="text-slate-600">·</span>
                      <span className="text-slate-300">
                        🎭 {hunt.mode}
                      </span>
                      <span className="text-slate-600">·</span>
                      <span className={hunt.isLiveMode ? 'text-cyan-400 font-bold' : 'text-slate-400'}>
                        {hunt.isLiveMode ? '⚡ Live' : 'Classic'}
                      </span>
                      <span className="text-slate-600">·</span>
                      <span className="text-slate-500">
                        📅 {formattedDate}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-emerald-400 text-xs font-mono font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{placesCount} places</span>
                      </span>

                      {onDeleteCompletedHunt && (
                        <button
                          type="button"
                          onClick={() => onDeleteCompletedHunt(hunt.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-950 rounded-lg transition-colors"
                          title="Delete this hunt from journal"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-serif font-bold text-slate-100">
                      🏴‍☠️ {hunt.title}
                    </h3>
                    {hunt.finalTreasureMessage && (
                      <p className="text-xs text-slate-300 font-sans mt-1 line-clamp-2">
                        {hunt.finalTreasureMessage}
                      </p>
                    )}
                  </div>

                  {/* VISITED PLACES & OBSERVATIONS ACCORDION */}
                  {hunt.stops && hunt.stops.length > 0 && (
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => setExpandedHuntId(isExpanded ? null : hunt.id)}
                        className="w-full flex items-center justify-between p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono text-slate-300 hover:text-amber-300 transition-colors"
                      >
                        <span className="font-bold flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-rose-400" />
                          <span>VISITED PLACES & JOURNAL NOTES ({hunt.stops.length})</span>
                        </span>
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>

                      {isExpanded && (
                        <div className="space-y-2.5 pt-1">
                          {hunt.stops.map((stop, sIdx) => {
                            const progress = userProgress.find(p => p.stopNumber === stop.stopNumber);
                            return (
                              <div
                                key={sIdx}
                                className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800/80 space-y-2 text-xs font-sans"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <span className="text-[10px] font-mono text-amber-400 uppercase font-bold block">
                                      STOP #{stop.stopNumber}
                                    </span>
                                    <strong className="text-slate-100 font-serif text-sm">
                                      {stop.placeName}
                                    </strong>
                                    <p className="text-[11px] text-slate-400 font-mono">
                                      {stop.address}
                                    </p>
                                  </div>

                                  <a
                                    href={stop.googleMapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(stop.placeName + ', ' + hunt.locationName)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1.5 bg-slate-900 hover:bg-slate-850 text-amber-400 rounded-lg border border-slate-800 shrink-0"
                                    title="View on Google Maps"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </a>
                                </div>

                                {/* Personal Observation */}
                                {progress?.userObservation && (
                                  <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800/80 space-y-1">
                                    <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold block">
                                      YOUR OBSERVATION:
                                    </span>
                                    <p className="text-slate-200 italic text-[11px]">
                                      "{progress.userObservation}"
                                    </p>
                                  </div>
                                )}

                                {/* Photo Note */}
                                {progress?.photoNote && (
                                  <div className="flex items-center gap-1.5 text-[11px] font-mono text-amber-300">
                                    <Camera className="w-3 h-3 text-amber-400" />
                                    <span>{progress.photoNote}</span>
                                  </div>
                                )}

                                {/* Linked Original Source */}
                                {stop.sourceUrls && stop.sourceUrls.length > 0 && (
                                  <div className="pt-1 flex items-center gap-1.5 text-[11px] font-mono">
                                    <span className="text-slate-500">Original Source:</span>
                                    <a
                                      href={stop.sourceUrls[0]}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-cyan-400 hover:underline flex items-center gap-1 truncate max-w-xs"
                                    >
                                      <span>{stop.sourceTitle || 'View Web Document'}</span>
                                      <ExternalLink className="w-3 h-3 shrink-0" />
                                    </a>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* CARD FOOTER */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                    <span className="text-[11px] font-mono text-slate-400">
                      ⏱️ {hunt.durationMinutes} min exploration
                    </span>

                    <button
                      onClick={() => onViewReport(hunt)}
                      className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-mono font-bold rounded-xl transition-all shadow-md flex items-center gap-1.5"
                    >
                      <Award className="w-3.5 h-3.5" />
                      <span>VIEW FULL REPORT</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
