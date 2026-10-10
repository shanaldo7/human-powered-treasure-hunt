import React, { useState } from 'react';
import { TreasureHunt } from '../types/hunt';
import { Award, CheckCircle2, X, Compass, Sparkles, ExternalLink, Share2, Check, Copy } from 'lucide-react';

interface FinalReportModalProps {
  hunt: TreasureHunt | null;
  isOpen: boolean;
  onClose: () => void;
  onStartNewHunt: () => void;
}

export const FinalReportModal: React.FC<FinalReportModalProps> = ({
  hunt,
  isOpen,
  onClose,
  onStartNewHunt
}) => {
  const [isSharing, setIsSharing] = useState(false);
  const [shareNotice, setShareNotice] = useState<string | null>(null);

  if (!isOpen || !hunt) return null;

  const stops = Array.isArray(hunt.stops) ? hunt.stops : [];
  const userProgress = Array.isArray(hunt.userProgress) ? hunt.userProgress : [];

  const handleShare = async () => {
    setIsSharing(true);
    const summaryText = `🏴‍☠️ DISCOVERY REPORT: ${hunt.title}\n📍 ${hunt.locationName} (${hunt.mode})\nStops Discovered: ${stops.length} of ${hunt.totalStops || stops.length}\nExploration Time: ${hunt.durationMinutes} mins\n${hunt.finalTreasureMessage || ''}\n${hunt.rumorRealitySummary?.whyItMattered ? `Why it mattered: ${hunt.rumorRealitySummary.whyItMattered}` : ''}`;

    try {
      // Optional backend link creation (Requirement #8: without mandatory DB or auth)
      let shareUrl = window.location.href;
      try {
        const res = await fetch('/api/share-hunt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ hunt, includeCoordinates: false })
        });
        if (res.ok) {
          const data = await res.json();
          if (data.shareUrl) {
            shareUrl = `${window.location.origin}${data.shareUrl}`;
          }
        }
      } catch (_e) {
        // Fallback to current URL if backend unavailable
      }

      if (navigator.share) {
        await navigator.share({
          title: hunt.title,
          text: summaryText,
          url: shareUrl
        });
        setShareNotice('Shared successfully!');
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(`${summaryText}\nLink: ${shareUrl}`);
        setShareNotice('Summary & share link copied to clipboard!');
      }
    } catch (_err) {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(summaryText);
        setShareNotice('Summary copied to clipboard!');
      }
    } finally {
      setIsSharing(false);
      setTimeout(() => setShareNotice(null), 4000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto font-sans">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl my-8">
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold text-xl">
              🏴‍☠️
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
                <span>QUEST CONQUERED &bull; REAL DISCOVERY UNLOCKED</span>
              </div>
              <h3 className="text-2xl font-serif font-bold text-slate-100">
                Final Discovery Report
              </h3>
            </div>
          </div>

          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-200 bg-slate-800 rounded-xl">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* HUNT TITLE & METRICS */}
        <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-mono text-amber-400 font-bold uppercase block">
                {hunt.mode} MODE &bull; {hunt.locationName}
              </span>
              <h2 className="text-xl font-serif font-bold text-slate-100">
                {hunt.title}
              </h2>
            </div>
            {hunt.difficulty && (
              <span className="px-2.5 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-mono font-bold">
                {hunt.difficulty}
              </span>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2 text-center font-mono text-xs pt-1 border-t border-slate-900">
            <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-500 block uppercase">STOPS DISCOVERED</span>
              <strong className="text-emerald-400 font-bold text-sm">{stops.length} / {hunt.totalStops || stops.length}</strong>
            </div>

            <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-500 block uppercase">DISTANCE</span>
              <strong className="text-amber-400 font-bold text-sm">~{(stops.length * 0.7).toFixed(1)} km</strong>
            </div>

            <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-500 block uppercase">EXPLORATION TIME</span>
              <strong className="text-emerald-400 font-bold text-sm">{hunt.durationMinutes} Mins</strong>
            </div>
          </div>
        </div>

        {/* FINAL TREASURE MESSAGE */}
        <div className="bg-emerald-950/40 border border-emerald-500/40 p-4 sm:p-5 rounded-2xl space-y-2 text-xs">
          <span className="font-mono font-bold text-emerald-400 uppercase tracking-wider block flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            FINAL DISCOVERY REVEAL
          </span>
          <p className="text-slate-200 leading-relaxed font-sans text-sm">
            {hunt.finalTreasureMessage}
          </p>

          {hunt.storyBehindThePlaces && (
            <div className="pt-2 border-t border-emerald-500/30 text-xs text-amber-200">
              <span className="font-mono font-bold text-amber-400 block text-[10px] uppercase">THE STORY BEHIND THE PLACES:</span>
              <p className="leading-relaxed">{hunt.storyBehindThePlaces}</p>
            </div>
          )}
        </div>

        {/* RUMOR vs REALITY: WHAT WAS FACT? vs WHAT WAS STORY? (Requirement #19) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {/* WHAT WAS FACT? */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-emerald-500/30 space-y-2">
            <span className="text-[11px] font-mono font-bold text-emerald-400 uppercase flex items-center gap-1.5">
              <span>✓</span>
              <span>WHAT WAS FACT?</span>
            </span>
            <ul className="space-y-1.5 text-slate-300 font-sans text-[11px]">
              {hunt.rumorRealitySummary?.factStatements && hunt.rumorRealitySummary.factStatements.length > 0 ? (
                hunt.rumorRealitySummary.factStatements.map((fact, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-emerald-400 font-bold shrink-0">&bull;</span>
                    <span>{fact}</span>
                  </li>
                ))
              ) : (
                <>
                  <li className="flex items-start gap-1.5">
                    <span className="text-emerald-400 font-bold shrink-0">&bull;</span>
                    <span>Verified public architectural and civic structures in {hunt.locationName}.</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-emerald-400 font-bold shrink-0">&bull;</span>
                    <span>Source-backed municipal historical context.</span>
                  </li>
                </>
              )}
            </ul>
          </div>

          {/* WHAT WAS STORY? */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-amber-500/30 space-y-2">
            <span className="text-[11px] font-mono font-bold text-amber-400 uppercase flex items-center gap-1.5">
              <span>👻</span>
              <span>WHAT WAS STORY?</span>
            </span>
            <ul className="space-y-1.5 text-slate-300 font-sans text-[11px]">
              {hunt.rumorRealitySummary?.legendStatements && hunt.rumorRealitySummary.legendStatements.length > 0 ? (
                hunt.rumorRealitySummary.legendStatements.map((leg, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-amber-400 font-bold shrink-0">&bull;</span>
                    <span>{leg}</span>
                  </li>
                ))
              ) : (
                <>
                  <li className="flex items-start gap-1.5">
                    <span className="text-amber-400 font-bold shrink-0">&bull;</span>
                    <span>Reported community folklore & oral traditions.</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-amber-400 font-bold shrink-0">&bull;</span>
                    <span>Unverified neighborhood ghost stories.</span>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>

        {/* WHY IT MATTERED (Requirement #19) */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1.5 text-xs">
          <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider block">
            WHY IT MATTERED:
          </span>
          <p className="text-slate-300 font-sans leading-relaxed text-xs">
            {hunt.rumorRealitySummary?.whyItMattered || `Visiting these locations in ${hunt.locationName} allowed you to physically connect with genuine urban craftsmanship, see real stone carvings in person, and experience tangible local history rather than viewing a screen.`}
          </p>
        </div>

        {/* STOPS & DISCOVERIES SUMMARY */}
        <div className="space-y-2">
          <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider block">
            YOUR PHYSICAL DISCOVERIES:
          </span>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {stops.map((stop, idx) => {
              const progress = userProgress.find(p => p.stopNumber === stop.stopNumber);
              return (
                <div key={idx} className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1 text-xs">
                  <div className="flex items-center justify-between font-mono font-bold text-slate-200">
                    <span className="flex items-center gap-1.5 text-amber-400">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      Stop #{stop.stopNumber}: {stop.placeName} ({stop.address})
                    </span>
                  </div>
                  {progress?.userObservation && (
                    <p className="text-slate-300 font-sans text-xs italic bg-slate-900 p-2 rounded-xl border border-slate-800/80">
                      "{progress.userObservation}"
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {shareNotice && (
          <div className="p-3 bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-mono rounded-xl text-center">
            ✓ {shareNotice}
          </div>
        )}

        {/* FOOTER ACTIONS */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-800">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleShare}
              disabled={isSharing}
              className="w-full sm:w-auto px-5 py-3 bg-slate-800 hover:bg-slate-700 text-cyan-300 font-mono font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 border border-slate-700"
            >
              <Share2 className="w-4 h-4 text-cyan-400" />
              <span>{isSharing ? 'Sharing...' : 'SHARE SUMMARY'}</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onStartNewHunt();
              }}
              className="w-full sm:w-auto px-5 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-serif font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <Compass className="w-4 h-4" />
              <span>START ANOTHER</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-3 bg-slate-900 text-slate-300 hover:text-slate-100 font-semibold text-xs rounded-xl hover:bg-slate-800 border border-slate-800 transition-colors"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
};
