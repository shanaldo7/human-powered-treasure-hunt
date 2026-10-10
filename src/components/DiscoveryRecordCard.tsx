import React, { useState } from 'react';
import { NormalizedDiscoveryRecord } from '../types/discovery';
import { 
  ExternalLink, 
  MapPin, 
  Compass, 
  HelpCircle, 
  Clock, 
  Layers, 
  Database, 
  Globe, 
  ShieldCheck, 
  BookOpen, 
  Info,
  ChevronDown,
  ChevronUp,
  Network
} from 'lucide-react';

interface DiscoveryRecordCardProps {
  record: NormalizedDiscoveryRecord;
  onTurnIntoHunt?: (record: NormalizedDiscoveryRecord) => void;
  onOpenIntelligence?: (record: NormalizedDiscoveryRecord) => void;
}

export const DiscoveryRecordCard: React.FC<DiscoveryRecordCardProps> = ({ 
  record, 
  onTurnIntoHunt,
  onOpenIntelligence 
}) => {
  const [showProvenance, setShowProvenance] = useState(false);
  const [showEvidence, setShowEvidence] = useState(false);

  // Claim category formatting (Requirement #7: Keep historical and live information distinct)
  const getClaimBadge = (claim: string) => {
    switch (claim) {
      case 'newly_reported_event':
        return { bg: 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300', label: '⚡ NEWLY REPORTED EVENT' };
      case 'recently_published_article':
        return { bg: 'bg-cyan-950/80 border-cyan-500/40 text-cyan-300', label: '📰 RECENTLY PUBLISHED ARTICLE' };
      case 'recently_added_dataset_record':
        return { bg: 'bg-indigo-950/80 border-indigo-500/40 text-indigo-300', label: '📦 NEW DATASET RECORD' };
      case 'recently_updated_location':
        return { bg: 'bg-teal-950/80 border-teal-500/40 text-teal-300', label: '📍 UPDATED LOCATION INFO' };
      case 'local_legend':
        return { bg: 'bg-purple-950/80 border-purple-500/40 text-purple-300', label: '👻 LOCAL LEGEND' };
      case 'rumor_or_unverified':
        return { bg: 'bg-rose-950/80 border-rose-500/40 text-rose-300', label: '⚠️ UNVERIFIED CLAIM' };
      case 'historical':
      default:
        return { bg: 'bg-amber-950/80 border-amber-500/40 text-amber-300', label: '🏛️ HISTORICAL RECORD' };
    }
  };

  // Freshness status badge
  const getFreshnessBadge = (status: string, isCached?: boolean) => {
    if (isCached || status === 'cached') {
      return { bg: 'bg-slate-800 text-slate-300 border-slate-700', label: '💾 Cached' };
    }
    switch (status) {
      case 'fresh':
        return { bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30', label: '🟢 Fresh' };
      case 'recent':
        return { bg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30', label: '🔵 Recent' };
      case 'stale':
        return { bg: 'bg-rose-500/10 text-rose-400 border-rose-500/30', label: '⚠️ Stale' };
      case 'historical_archive':
      default:
        return { bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30', label: '📜 Archive' };
    }
  };

  const claimBadge = getClaimBadge(record.claim_type);
  const freshnessBadge = getFreshnessBadge(record.freshness_status, record.is_cached);

  const getSourceIcon = (type: string) => {
    switch (type) {
      case 'geographic_dataset':
      case 'official_dataset':
        return <Database className="w-3.5 h-3.5 text-indigo-400 shrink-0" />;
      case 'cultural_archive':
        return <BookOpen className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
      case 'news_article':
      case 'web_search':
      default:
        return <Globe className="w-3.5 h-3.5 text-cyan-400 shrink-0" />;
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-3xl p-5 sm:p-6 flex flex-col justify-between space-y-4 shadow-xl transition-all relative overflow-hidden group">
      
      {/* TOP HEADER: Source Type, Freshness & Claim Badge */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-semibold flex items-center gap-1 ${freshnessBadge.bg}`}>
              <span>{freshnessBadge.label}</span>
            </span>

            <div className="flex items-center gap-1 text-slate-400 text-[11px]">
              {getSourceIcon(record.source_type)}
              <span className="font-semibold text-slate-300">{record.source_name}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {record.scoring?.compositeScore && (
              <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-bold">
                ⭐ Score {(record.scoring.compositeScore * 10).toFixed(1)}
              </span>
            )}
          </div>
        </div>

        {/* TITLE & LOCATION */}
        <div>
          <h3 className="text-lg sm:text-xl font-serif font-bold text-slate-100 group-hover:text-amber-300 transition-colors leading-snug">
            {record.title}
          </h3>

          <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-slate-400 font-mono mt-1.5">
            <div className="flex items-center gap-1 text-rose-300 font-medium">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span>{record.location_name}</span>
            </div>

            {record.latitude !== null && record.longitude !== null && (
              <span className="text-[11px] text-slate-500">
                GPS: {record.latitude.toFixed(4)}, {record.longitude.toFixed(4)}
              </span>
            )}
          </div>
        </div>

        {/* DESCRIPTION / SNIPPET */}
        <p className="text-xs sm:text-sm text-slate-300 font-sans leading-relaxed border-l-2 border-slate-800 pl-3 py-1">
          {record.description}
        </p>

        {/* CLAIM TYPE BADGE & EXPAND PROVENANCE TOGGLE */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className={`px-3 py-1 rounded-xl border text-[11px] font-mono font-bold flex items-center gap-1.5 ${claimBadge.bg}`}>
            <span>{claimBadge.label}</span>
          </div>

          <button
            type="button"
            onClick={() => setShowProvenance(!showProvenance)}
            className="text-[11px] font-mono text-slate-400 hover:text-cyan-300 flex items-center gap-1 underline underline-offset-2 transition-colors"
          >
            <HelpCircle className="w-3 h-3 text-cyan-400" />
            <span>Provenance & Metadata</span>
            {showProvenance ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>

        {/* FULL PROVENANCE & TIMESTAMPS DETAILS PANEL (Requirement #9) */}
        {showProvenance && (
          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3 text-xs font-mono text-slate-300 animate-in fade-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
              <strong className="text-cyan-400 text-[11px] uppercase tracking-wider flex items-center gap-1">
                <Info className="w-3.5 h-3.5" />
                <span>DATASET PROVENANCE & VERIFICATION</span>
              </strong>
              <button 
                type="button" 
                onClick={() => setShowProvenance(false)}
                className="text-slate-500 hover:text-slate-300 text-sm leading-none"
              >
                &times;
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-slate-500 block">Source Name:</span>
                <span className="text-slate-200 font-bold">{record.source_name}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Source Type:</span>
                <span className="text-slate-200 uppercase">{record.source_type.replace('_', ' ')}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Publication Date:</span>
                <span className="text-slate-200">{record.published_at || 'Not specified'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Last Retrieved:</span>
                <span className="text-slate-200">{new Date(record.retrieved_at).toLocaleString()}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Last Verified:</span>
                <span className="text-slate-200">{record.last_verified_at ? new Date(record.last_verified_at).toLocaleDateString() : 'Not assessed'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Dataset Updated:</span>
                <span className="text-slate-200">{record.dataset_last_updated_at || 'Continuous'}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-slate-500 block">License / Attribution:</span>
                <span className="text-slate-400 text-[10px] break-words">{record.license || 'Public domain / Open access'}</span>
              </div>
            </div>

            {/* Transparent Scoring Breakdown (Requirement #6) */}
            {record.scoring && (
              <div className="pt-2 border-t border-slate-800/80 space-y-1">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                  Ranking Signals Breakdown (Explainable Ranking)
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-[10px]">
                  <div>Location match: <span className="text-slate-200 font-bold">{(record.scoring.locationMatch * 100).toFixed(0)}%</span></div>
                  <div>Genre match: <span className="text-slate-200 font-bold">{(record.scoring.genreRelevance * 100).toFixed(0)}%</span></div>
                  <div>Source quality: <span className="text-slate-200 font-bold">{(record.scoring.sourceQuality * 100).toFixed(0)}%</span></div>
                  <div>Evidence strength: <span className="text-slate-200 font-bold">{(record.scoring.evidenceStrength * 100).toFixed(0)}%</span></div>
                  <div>Public safety: <span className="text-slate-200 font-bold">{(record.scoring.publicSafetyScore * 100).toFixed(0)}%</span></div>
                  <div>Access suitability: <span className="text-slate-200 font-bold">{(record.scoring.currentAccessSuitability * 100).toFixed(0)}%</span></div>
                </div>
              </div>
            )}

            {/* Evidence items */}
            {record.evidence && record.evidence.length > 0 && (
              <div className="pt-2 border-t border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase block">Supporting Citations:</span>
                {record.evidence.map((ev, i) => (
                  <div key={i} className="text-[11px] text-slate-300 bg-slate-900 p-2 rounded-lg border border-slate-800/60">
                    <span className="text-cyan-400 text-[10px] uppercase block font-semibold">[{ev.type}]</span>
                    <p className="mt-0.5">{ev.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* BOTTOM ACTION BUTTONS */}
      <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center gap-2">
        <a
          href={record.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full sm:flex-1 py-2.5 px-3 bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 rounded-xl text-xs font-mono font-bold transition-all text-center flex items-center justify-center gap-1.5 shadow-sm"
        >
          <span>ORIGINAL SOURCE</span>
          <ExternalLink className="w-3 h-3" />
        </a>

        {onOpenIntelligence && (
          <button
            type="button"
            onClick={() => onOpenIntelligence(record)}
            className="w-full sm:flex-1 py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-indigo-300 hover:text-indigo-200 border border-indigo-500/40 rounded-xl text-xs font-mono font-bold transition-all text-center flex items-center justify-center gap-1.5 shadow-sm"
          >
            <Network className="w-3.5 h-3.5 text-indigo-400" />
            <span>INTELLIGENCE</span>
          </button>
        )}

        {onTurnIntoHunt && (
          <button
            type="button"
            onClick={() => onTurnIntoHunt(record)}
            className="w-full sm:flex-1 py-2.5 px-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-xl text-xs font-serif font-bold transition-all text-center flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/10 hover:scale-[1.01]"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>EXPLORE HUNT</span>
          </button>
        )}
      </div>
    </div>
  );
};
