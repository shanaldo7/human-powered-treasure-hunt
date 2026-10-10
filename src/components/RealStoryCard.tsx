import React, { useState } from 'react';
import { 
  RealStoryArticle, 
  DiscoveryCategory 
} from '../types/hunt';
import { 
  ExternalLink, 
  MapPin, 
  Compass, 
  ShieldCheck, 
  ShieldAlert, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  Clock, 
  Layers, 
  BookOpen, 
  Ghost, 
  CheckCircle2, 
  AlertTriangle,
  ArrowRight
} from 'lucide-react';

interface RealStoryCardProps {
  article: RealStoryArticle;
  onTurnIntoHunt: (article: RealStoryArticle) => void;
}

export const RealStoryCard: React.FC<RealStoryCardProps> = ({ article, onTurnIntoHunt }) => {
  const [showWhyModal, setShowWhyModal] = useState(false);
  const [showRumorReality, setShowRumorReality] = useState(false);

  // Claim type badge configuration
  const getClaimBadge = (claim: string) => {
    const c = claim.toLowerCase();
    if (c === 'verified') {
      return {
        bg: 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300',
        dot: 'bg-emerald-400',
        label: '🟢 VERIFIED REPORT'
      };
    }
    if (c === 'reported') {
      return {
        bg: 'bg-cyan-950/80 border-cyan-500/40 text-cyan-300',
        dot: 'bg-cyan-400',
        label: '🔵 REPORTED JOURNALISM'
      };
    }
    if (c === 'historical') {
      return {
        bg: 'bg-amber-950/80 border-amber-500/40 text-amber-300',
        dot: 'bg-amber-400',
        label: '🏛️ HISTORICAL ACCOUNT'
      };
    }
    if (c === 'local_legend' || c === 'legend') {
      return {
        bg: 'bg-purple-950/80 border-purple-500/40 text-purple-300',
        dot: 'bg-purple-400',
        label: '👻 LOCAL LEGEND'
      };
    }
    if (c === 'rumor') {
      return {
        bg: 'bg-rose-950/80 border-rose-500/40 text-rose-300',
        dot: 'bg-rose-400',
        label: '⚠️ NEIGHBORHOOD RUMOR'
      };
    }
    return {
      bg: 'bg-slate-900 border-slate-700 text-slate-300',
      dot: 'bg-slate-400',
      label: '⚪ UNVERIFIED CLAIM'
    };
  };

  // Freshness badge
  const getFreshnessDisplay = (freshness?: string, date?: string) => {
    const text = freshness || date || 'Historical';
    if (/hour|min/i.test(text)) {
      return { icon: '🟢', text, style: 'text-emerald-400' };
    }
    if (/day/i.test(text)) {
      return { icon: '🟡', text, style: 'text-amber-400' };
    }
    if (/week|month/i.test(text)) {
      return { icon: '🔵', text, style: 'text-cyan-400' };
    }
    return { icon: '📜', text, style: 'text-slate-400' };
  };

  const claimBadge = getClaimBadge(article.claim_type);
  const freshnessInfo = getFreshnessDisplay(article.freshness, article.published_at);
  const isFolkloreOrRumor = ['local_legend', 'rumor', 'unverified'].includes(article.claim_type.toLowerCase());

  return (
    <div className="bg-slate-900/95 border border-slate-800 hover:border-slate-700 rounded-3xl p-5 sm:p-6 flex flex-col justify-between space-y-4 shadow-xl transition-all relative overflow-hidden group">
      
      {/* Top Banner: Recency & Source Count */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-950 border border-slate-800 text-[11px] font-semibold text-slate-300">
              <span className="text-xs">{freshnessInfo.icon}</span>
              <span className={freshnessInfo.style}>{freshnessInfo.text}</span>
            </span>

            {article.source_count > 1 && (
              <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[10px] flex items-center gap-1">
                <Layers className="w-2.5 h-2.5" />
                <span>{article.source_count} sources</span>
              </span>
            )}
          </div>

          <span className="text-slate-400 text-[11px] uppercase tracking-wider font-semibold">
            {article.genre}
          </span>
        </div>

        {/* ACTUAL SOURCE HEADLINE (Preserved verbatim) */}
        <div>
          <h3 className="text-lg sm:text-xl font-serif font-bold text-slate-100 group-hover:text-amber-300 transition-colors leading-snug">
            {article.title}
          </h3>

          {/* Location & Publisher Metadata */}
          <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-slate-400 font-mono mt-2">
            <div className="flex items-center gap-1 text-rose-300 font-medium">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span>{article.location}</span>
            </div>
            
            <div className="flex items-center gap-1 text-slate-300">
              <BookOpen className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span className="truncate max-w-[200px]">{article.source_name}</span>
            </div>
          </div>
        </div>

        {/* AI-GENERATED SUMMARY BASED ONLY ON THE SOURCE */}
        <p className="text-xs sm:text-sm text-slate-300 font-sans leading-relaxed border-l-2 border-slate-800 pl-3 py-1">
          {article.summary}
        </p>

        {/* CLAIM TYPE BADGE & "WHY AM I SEEING THIS?" TOGGLE */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className={`px-3 py-1 rounded-xl border text-[11px] font-mono font-bold flex items-center gap-1.5 ${claimBadge.bg}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${claimBadge.dot}`} />
            <span>{claimBadge.label}</span>
          </div>

          <button
            type="button"
            onClick={() => setShowWhyModal(!showWhyModal)}
            className="text-[11px] font-mono text-slate-400 hover:text-amber-300 flex items-center gap-1 underline underline-offset-2 transition-colors"
          >
            <HelpCircle className="w-3 h-3 text-amber-400" />
            <span>Why am I seeing this?</span>
          </button>
        </div>

        {/* 8. SOURCE TRANSPARENCY PANEL: "WHY AM I SEEING THIS?" */}
        {showWhyModal && (
          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2 text-xs font-mono text-slate-300 animate-in fade-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
              <strong className="text-amber-400 text-[11px] uppercase tracking-wider">
                SOURCE TRANSPARENCY & EVIDENCE
              </strong>
              <button 
                type="button" 
                onClick={() => setShowWhyModal(false)}
                className="text-slate-500 hover:text-slate-300 text-sm leading-none"
              >
                &times;
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px]">
              <div>
                <span className="text-slate-500 block">📍 Location match:</span>
                <span className="text-slate-200 font-bold">{article.why_this_story?.location_match || 'Strong'} ({article.location})</span>
              </div>
              <div>
                <span className="text-slate-500 block">🏷️ Genre match:</span>
                <span className="text-slate-200 font-bold">{article.why_this_story?.genre_match || 'Strong'} ({article.genre})</span>
              </div>
              <div>
                <span className="text-slate-500 block">📰 Original Publisher:</span>
                <span className="text-slate-200 truncate block">{article.source_name}</span>
              </div>
              <div>
                <span className="text-slate-500 block">🕒 Published:</span>
                <span className="text-slate-200">{article.published_at || article.freshness || 'Verified source archive'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">🔎 Supporting Evidence:</span>
                <span className="text-slate-200">{article.source_count} independent published source(s)</span>
              </div>
              <div>
                <span className="text-slate-500 block">⚖️ Claim Classification:</span>
                <span className="text-slate-200 uppercase font-semibold">{article.claim_type.replace('_', ' ')}</span>
              </div>
            </div>

            {article.why_this_story?.evidence_summary && (
              <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-800 font-sans">
                {article.why_this_story.evidence_summary}
              </p>
            )}

            {article.supporting_sources && article.supporting_sources.length > 0 && (
              <div className="pt-2 border-t border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase block">Other Supporting Links:</span>
                {article.supporting_sources.map((src, i) => (
                  <a
                    key={i}
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 underline truncate"
                  >
                    <span>&bull; {src.name}: {src.title}</span>
                    <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                  </a>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 10. RUMOR → REALITY INTERFACE */}
        {isFolkloreOrRumor && article.rumor_reality && (
          <div className="bg-purple-950/20 border border-purple-500/30 rounded-2xl p-4 space-y-3">
            <button
              type="button"
              onClick={() => setShowRumorReality(!showRumorReality)}
              className="w-full flex items-center justify-between text-left text-xs font-mono font-bold text-purple-300"
            >
              <div className="flex items-center gap-1.5">
                <Ghost className="w-4 h-4 text-purple-400" />
                <span>👻 RUMOR &rarr; REALITY BREAKDOWN</span>
              </div>
              {showRumorReality ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showRumorReality && (
              <div className="space-y-3 text-xs pt-1 border-t border-purple-500/20 animate-in fade-in duration-150 font-sans">
                <div>
                  <span className="text-[10px] font-mono text-purple-400 font-bold uppercase block tracking-wider">
                    LOCAL STORY / WHAT IS CLAIMED
                  </span>
                  <p className="text-slate-300 mt-0.5">
                    "{article.rumor_reality.local_story}"
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-950/80 rounded-xl border border-emerald-500/30 space-y-1">
                    <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      <span>WHAT IS VERIFIED</span>
                    </span>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      {article.rumor_reality.what_is_verified}
                    </p>
                  </div>

                  <div className="p-3 bg-slate-950/80 rounded-xl border border-rose-500/30 space-y-1">
                    <span className="text-[10px] font-mono text-rose-400 font-bold uppercase flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-rose-400" />
                      <span>WHAT IS NOT VERIFIED</span>
                    </span>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      {article.rumor_reality.what_is_not_verified}
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-slate-950/90 rounded-xl border border-purple-500/30 text-xs">
                  <span className="text-[10px] font-mono text-purple-300 font-bold uppercase block">
                    YOUR PHYSICAL INVESTIGATION TASK
                  </span>
                  <p className="text-slate-200 mt-0.5">
                    {article.rumor_reality.investigation_task}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* BOTTOM ACTION BUTTONS */}
      <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center gap-2">
        {/* READ ORIGINAL ARTICLE BUTTON (Opens the real URL) */}
        <a
          href={article.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full sm:flex-1 py-3 px-3 bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 rounded-xl text-xs font-mono font-bold transition-all text-center flex items-center justify-center gap-1.5 shadow-sm"
        >
          <span>READ ORIGINAL ARTICLE</span>
          <ExternalLink className="w-3 h-3" />
        </a>

        {/* TURN INTO HUNT BUTTON */}
        <button
          type="button"
          onClick={() => onTurnIntoHunt(article)}
          className="w-full sm:flex-1 py-3 px-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-xl text-xs font-serif font-bold transition-all text-center flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/10 hover:scale-[1.01]"
        >
          <Compass className="w-3.5 h-3.5" />
          <span>TURN INTO HUNT</span>
        </button>
      </div>

    </div>
  );
};
