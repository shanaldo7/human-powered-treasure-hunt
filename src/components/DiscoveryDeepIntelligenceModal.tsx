import React, { useState } from 'react';
import { NormalizedDiscoveryRecord } from '../types/discovery';
import { 
  KnowledgeGraphData, 
  ConflictingClaim, 
  StoryTimeline 
} from '../types/intelligence';
import { 
  Network, 
  Scale, 
  GitCommit, 
  ExternalLink, 
  X, 
  Layers, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  BookOpen, 
  RefreshCw, 
  Calendar 
} from 'lucide-react';

interface DiscoveryDeepIntelligenceModalProps {
  record: NormalizedDiscoveryRecord;
  allRecords: NormalizedDiscoveryRecord[];
  isOpen: boolean;
  onClose: () => void;
  onTurnTimelineIntoHunt?: (record: NormalizedDiscoveryRecord, timeline: StoryTimeline) => void;
}

export const DiscoveryDeepIntelligenceModal: React.FC<DiscoveryDeepIntelligenceModalProps> = ({
  record,
  allRecords,
  isOpen,
  onClose,
  onTurnTimelineIntoHunt
}) => {
  const [activeTab, setActiveTab] = useState<'graph' | 'conflicts' | 'timeline'>('graph');
  const [graphData, setGraphData] = useState<KnowledgeGraphData | null>(null);
  const [conflicts, setConflicts] = useState<ConflictingClaim[]>([]);
  const [timeline, setTimeline] = useState<StoryTimeline | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch intelligence data on open or record change
  React.useEffect(() => {
    if (!isOpen || !record) return;

    const fetchIntelligence = async () => {
      setIsLoading(true);
      try {
        // 1. Fetch Knowledge Graph
        const graphRes = await fetch('/api/knowledge-graph', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ records: [record, ...allRecords.slice(0, 5)] })
        });
        if (graphRes.ok) {
          const gData = await graphRes.json();
          setGraphData(gData.graph);
        }

        // 2. Fetch Evidence Conflicts
        const conflictRes = await fetch('/api/evidence/compare', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ records: [record, ...allRecords.slice(0, 5)] })
        });
        if (conflictRes.ok) {
          const cData = await conflictRes.json();
          setConflicts(cData.conflicts || []);
        }

        // 3. Fetch Story Timeline
        const timelineRes = await fetch('/api/timeline', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ record })
        });
        if (timelineRes.ok) {
          const tData = await timelineRes.json();
          setTimeline(tData.timeline);
        }
      } catch (err) {
        console.error('[INTELLIGENCE MODAL] Error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchIntelligence();
  }, [isOpen, record]);

  if (!isOpen || !record) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden font-sans">
        
        {/* MODAL HEADER */}
        <div className="p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="space-y-1">
            <span className="text-[11px] font-mono uppercase text-indigo-400 font-bold tracking-wider">
              DEEP EVIDENCE & KNOWLEDGE INTELLIGENCE
            </span>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-slate-100 truncate max-w-xl">
              {record.title}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* TABS SELECTOR */}
        <div className="px-5 sm:px-6 pt-3 border-b border-slate-800 flex gap-2 font-mono text-xs bg-slate-950/30">
          <button
            type="button"
            onClick={() => setActiveTab('graph')}
            className={`pb-3 px-3 font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'graph'
                ? 'border-indigo-400 text-indigo-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Network className="w-3.5 h-3.5" />
            <span>Hidden Knowledge Graph</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('conflicts')}
            className={`pb-3 px-3 font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'conflicts'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>Evidence Conflict Detector ({conflicts.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('timeline')}
            className={`pb-3 px-3 font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'timeline'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <GitCommit className="w-3.5 h-3.5" />
            <span>Story Timeline Reconstruction</span>
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {isLoading ? (
            <div className="py-16 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mx-auto" />
              <p className="text-slate-400 text-xs font-mono">
                Reconstructing relationships, citations, and conflict matrices...
              </p>
            </div>
          ) : (
            <>
              {/* TAB 1: KNOWLEDGE GRAPH */}
              {activeTab === 'graph' && (
                <div className="space-y-6">
                  <div className="p-4 bg-indigo-950/20 border border-indigo-500/30 rounded-2xl space-y-2">
                    <span className="text-xs font-mono font-bold text-indigo-300 uppercase block">
                      ENTITIES & DOCUMENTED RELATIONSHIPS
                    </span>
                    <p className="text-xs text-slate-300 font-sans leading-relaxed">
                      Relationships constructed solely from real archival records, OpenStreetMap spatial proximity, and verified citations. No fictitious historical ties.
                    </p>
                  </div>

                  {/* Connected Entities */}
                  <div className="space-y-3">
                    <span className="text-xs font-mono font-bold text-slate-400">DISCOVERED NODES ({graphData?.entities.length || 0})</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {graphData?.entities.map(ent => (
                        <div key={ent.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-slate-200">{ent.name}</span>
                            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-mono uppercase">
                              {ent.type}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 font-sans line-clamp-2">{ent.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Edges / Connections */}
                  <div className="space-y-3">
                    <span className="text-xs font-mono font-bold text-slate-400">SUPPORTED RELATIONSHIPS ({graphData?.edges.length || 0})</span>
                    <div className="space-y-2 font-mono text-xs">
                      {graphData?.edges.map(edge => (
                        <div key={edge.id} className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="space-y-1">
                            <span className="text-cyan-400 font-bold uppercase text-[11px]">
                              &bull; {edge.label}
                            </span>
                            <p className="text-[11px] text-slate-400 font-sans">{edge.evidenceText}</p>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 self-start sm:self-auto ${
                            edge.isDocumented ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/10 text-amber-400'
                          }`}>
                            {edge.isDocumented ? 'DOCUMENTED PROVENANCE' : 'INFERRED'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Connected Walk Route */}
                  {graphData?.connectedRoutes && graphData.connectedRoutes.length > 0 && (
                    <div className="p-4 bg-slate-950 rounded-2xl border border-indigo-500/40 space-y-2">
                      <span className="text-xs font-mono font-bold text-indigo-400 uppercase block">
                        PROPOSED CONNECTED EXPLORATION ROUTE
                      </span>
                      <h4 className="text-sm font-bold text-slate-200">{graphData.connectedRoutes[0].title}</h4>
                      <p className="text-xs text-slate-300 font-sans">{graphData.connectedRoutes[0].description}</p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: EVIDENCE CONFLICT DETECTOR */}
              {activeTab === 'conflicts' && (
                <div className="space-y-4">
                  <div className="p-4 bg-amber-950/20 border border-amber-500/30 rounded-2xl space-y-1">
                    <span className="text-xs font-mono font-bold text-amber-300 uppercase block">
                      CROSS-SOURCE AGREEMENT & DISAGREEMENT MATRIX
                    </span>
                    <p className="text-xs text-slate-300 font-sans leading-relaxed">
                      Detects disagreements between historical sources rather than letting Gemini silently decide which answer is true.
                    </p>
                  </div>

                  {conflicts.length === 0 ? (
                    <div className="p-8 text-center bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                      <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                      <h4 className="text-slate-200 font-bold">High Source Consensus</h4>
                      <p className="text-xs text-slate-400 font-mono">
                        No major conflicting claims or disputed timelines detected for this destination.
                      </p>
                    </div>
                  ) : (
                    conflicts.map(con => (
                      <div key={con.id} className="p-5 bg-slate-950 rounded-2xl border border-slate-800 space-y-3 font-mono text-xs">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                          <span className="text-amber-400 font-bold uppercase">{con.topic}</span>
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">
                            {con.field.replace('_', ' ')}
                          </span>
                        </div>

                        {/* Agreements */}
                        <div className="space-y-1">
                          <span className="text-emerald-400 text-[11px] font-bold block">✓ WHAT SOURCES AGREE ON:</span>
                          {con.agreements.map((agr, i) => (
                            <div key={i} className="p-2.5 bg-emerald-950/20 rounded-xl border border-emerald-500/30 text-slate-200">
                              <p className="font-sans text-xs">{agr.claimValue}</p>
                              <span className="text-[10px] text-slate-400 block mt-1">
                                Supported by: {agr.supportingSources.map(s => s.name).join(', ')}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Disagreements */}
                        <div className="space-y-1">
                          <span className="text-rose-400 text-[11px] font-bold block">⚠️ WHAT SOURCES DISAGREE ON:</span>
                          {con.disagreements.map((dis, i) => (
                            <div key={i} className="p-2.5 bg-rose-950/20 rounded-xl border border-rose-500/30 text-slate-200">
                              <p className="font-sans text-xs">{dis.claimValue}</p>
                              <p className="text-[11px] text-rose-300 font-sans mt-0.5">{dis.disagreementReason}</p>
                            </div>
                          ))}
                        </div>

                        {/* Unknowns & Verdict */}
                        <div className="pt-2 border-t border-slate-800/80 space-y-1 text-[11px]">
                          <span className="text-slate-400 block font-bold">ANALYSIS VERDICT:</span>
                          <p className="text-slate-300 font-sans">{con.verdictSummary}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 3: STORY TIMELINE RECONSTRUCTION */}
              {activeTab === 'timeline' && (
                <div className="space-y-6">
                  <div className="p-4 bg-cyan-950/20 border border-cyan-500/30 rounded-2xl space-y-1">
                    <span className="text-xs font-mono font-bold text-cyan-300 uppercase block">
                      CHRONOLOGICAL SOURCE TIMELINE
                    </span>
                    <p className="text-xs text-slate-300 font-sans leading-relaxed">
                      Distinct separation between when the historical event happened, when the article was published, and when the dataset was updated.
                    </p>
                  </div>

                  {timeline && (
                    <div className="relative border-l-2 border-slate-800 ml-4 space-y-6 pl-6 font-mono text-xs">
                      {timeline.entries.map((entry, idx) => (
                        <div key={entry.id} className="relative space-y-1.5">
                          {/* Dot on line */}
                          <div className="absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full bg-cyan-500 border-2 border-slate-900" />

                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="px-2 py-0.5 rounded bg-slate-800 text-cyan-300 text-[11px] font-bold">
                              {entry.dateString || 'Undated Chronicle'}
                            </span>
                            <span className="text-[10px] text-slate-500 uppercase">
                              [{entry.dateReferenceType.replace('_', ' ')}]
                            </span>
                          </div>

                          <h4 className="font-serif font-bold text-slate-100 text-sm">{entry.title}</h4>
                          <p className="text-slate-300 font-sans text-xs">{entry.shortSummary}</p>
                          <span className="text-[10px] text-slate-500 block">Source: {entry.sourceName}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {timeline && onTurnTimelineIntoHunt && (
                    <div className="pt-4 border-t border-slate-800">
                      <button
                        type="button"
                        onClick={() => {
                          onTurnTimelineIntoHunt(record, timeline);
                          onClose();
                        }}
                        className="w-full py-3 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-serif font-bold text-sm rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2"
                      >
                        <Calendar className="w-4 h-4" />
                        <span>CONVERT TIMELINE INTO THEMED TREASURE HUNT</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

      </div>
    </div>
  );
};
