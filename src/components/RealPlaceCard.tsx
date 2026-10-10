import React from 'react';
import { DiscoveredPlace } from '../types/hunt';
import { MapPin, Compass, ExternalLink, Navigation, Sparkles } from 'lucide-react';

interface RealPlaceCardProps {
  place: DiscoveredPlace;
  index: number;
  onStartTask?: (place: DiscoveredPlace) => void;
}

export const RealPlaceCard: React.FC<RealPlaceCardProps> = ({
  place,
  index,
  onStartTask
}) => {
  const mapsUrl = place.googleMapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.placeName + ', ' + place.address)}`;

  return (
    <div className="bg-slate-900/80 border border-slate-800/80 hover:border-amber-500/40 rounded-3xl p-5 sm:p-6 space-y-4 transition-all shadow-xl hover:shadow-2xl flex flex-col justify-between group">
      <div className="space-y-3">
        {/* Top Genre and Discovery Number */}
        <div className="flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="text-amber-400 font-bold uppercase tracking-wider">
              {place.category}
            </span>
            {place.claimType && (
              <>
                <span className="text-slate-600">·</span>
                <span className="text-slate-400 font-medium">
                  {place.claimType}
                </span>
              </>
            )}
          </div>

          <span className="text-[11px] text-slate-500 font-mono">
            #{String(index + 1).padStart(2, '0')}
          </span>
        </div>

        {/* Place Name and Address */}
        <div className="space-y-1">
          <h3 className="text-xl font-serif font-bold text-slate-100 group-hover:text-amber-300 transition-colors">
            {place.placeName}
          </h3>

          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
            <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span className="truncate">{place.address}</span>
          </div>
        </div>

        {/* Short One-Line Description / Why Go */}
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans line-clamp-3">
          "{place.evidence || place.whyGo}"
        </p>

        {/* Authentic Metadata details */}
        <div className="pt-2 border-t border-slate-800/60 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-mono text-slate-400">
          {place.isRecentReport && (
            <span className="text-rose-400 font-semibold flex items-center gap-1">
              <span>⚡</span>
              <span>Reported Recently</span>
            </span>
          )}

          {place.genreRelevanceScore && (
            <span className="text-emerald-400 font-medium">
              Match: {Math.round(place.genreRelevanceScore * 100)}%
            </span>
          )}

          {place.sourceUrls && place.sourceUrls.length > 0 && (
            <a
              href={place.sourceUrls[0]}
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-400/90 hover:text-amber-300 flex items-center gap-1 underline underline-offset-2 ml-auto"
            >
              <span>Source</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          )}
        </div>
      </div>

      {/* Button Actions */}
      <div className="flex items-center gap-2 pt-2">
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="p-3 bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 rounded-2xl text-xs font-mono font-bold transition-all flex items-center justify-center shrink-0"
          title="Open in Google Maps"
        >
          <Navigation className="w-4 h-4 text-amber-400" />
        </a>

        {onStartTask ? (
          <button
            onClick={() => onStartTask(place)}
            className="flex-1 py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-serif font-bold text-xs rounded-2xl shadow-lg shadow-amber-500/15 transition-all flex items-center justify-center gap-2"
          >
            <Compass className="w-4 h-4" />
            <span>DISCOVER THIS</span>
          </button>
        ) : (
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-serif font-bold text-xs rounded-2xl shadow-lg shadow-amber-500/15 transition-all flex items-center justify-center gap-2 text-center"
          >
            <Compass className="w-4 h-4" />
            <span>DISCOVER THIS</span>
          </a>
        )}
      </div>
    </div>
  );
};

