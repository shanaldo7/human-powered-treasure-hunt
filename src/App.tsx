import React, { useState, useEffect } from 'react';
import { TreasureHunt, DiscoveredPlace, DiscoveryCategory, HuntDifficulty, RealStoryArticle } from './types/hunt';
import { NormalizedDiscoveryRecord } from './types/discovery';
import { Header } from './components/Header';
import { LandingView } from './components/LandingView';
import { CreateHuntView } from './components/CreateHuntView';
import { ActiveHuntView } from './components/ActiveHuntView';
import { MyHuntsView } from './components/MyHuntsView';
import { RealArticlesView } from './components/RealArticlesView';
import { ContinuousDiscoveryView } from './components/ContinuousDiscoveryView';
import { FinalReportModal } from './components/FinalReportModal';
import { ServiceStatusModal } from './components/ServiceStatusModal';
import { HuntGuideDrawer } from './components/HuntGuideDrawer';
import { localStore } from './services/localStorageService';

export default function App() {
  const [activeTab, setActiveTab] = useState<'landing' | 'create' | 'hunt' | 'history' | 'articles' | 'discovery'>('landing');
  const [activeHunt, setActiveHunt] = useState<TreasureHunt | null>(null);
  const [completedHunts, setCompletedHunts] = useState<TreasureHunt[]>([]);
  const [inspectReport, setInspectReport] = useState<TreasureHunt | null>(null);

  // Initial parameters passed from LandingView to CreateHuntView
  const [initialLocation, setInitialLocation] = useState<string>('');
  const [initialMode, setInitialMode] = useState<DiscoveryCategory>('History');

  // Modals & Drawers
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isServicesOpen, setIsServicesOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Load persistent hunt data on startup
  useEffect(() => {
    const savedActive = localStore.loadActiveHunt();
    const savedCompleted = localStore.listCompletedHunts();

    setCompletedHunts(savedCompleted);
    if (savedActive) {
      setActiveHunt(savedActive);
    }
  }, []);

  // Save active hunt to localStorage whenever it changes
  useEffect(() => {
    if (activeHunt) {
      localStore.saveActiveHunt(activeHunt);
    }
  }, [activeHunt]);

  // Generate new Treasure Hunt via Gemini API
  const handleGenerateHunt = async (params: {
    locationName: string;
    mode: DiscoveryCategory;
    durationMinutes: number;
    numberOfStops: number;
    userCoordinates?: { latitude: number; longitude: number };
    isLive?: boolean;
    difficulty?: HuntDifficulty;
    weather?: string;
  }) => {
    setIsLoading(true);
    setGenerationError(null);
    try {
      const res = await fetch('/api/generate-hunt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to generate treasure hunt.');
      }

      const hunt: TreasureHunt = await res.json();
      setActiveHunt(hunt);
      localStore.saveActiveHunt(hunt);
      setActiveTab('hunt');
    } catch (err: any) {
      console.error('[APP] Generate hunt error:', err);
      setGenerationError(err.message || 'No strong discoveries were found for this combination.');
    } finally {
      setIsLoading(false);
    }
  };

  // Start task directly from a DiscoveredPlace card
  const handleStartPlaceTask = (place: DiscoveredPlace) => {
    const hunt: TreasureHunt = {
      id: `hunt_place_${Date.now()}`,
      title: `Discovery Quest: ${place.placeName}`,
      mode: place.category,
      locationName: place.placeName,
      locationQuery: `${place.placeName}, ${place.address}`,
      centerCoordinates: place.coordinates,
      durationMinutes: 15,
      totalStops: 1,
      currentStopNumber: 1,
      status: 'active',
      createdAt: new Date().toISOString(),
      finalTreasureMessage: `You physically explored ${place.placeName} and uncovered its real-world history!`,
      storyBehindThePlaces: place.whyGo,
      sourceUrls: place.sourceUrls,
      stops: [
        {
          taskId: `task_${place.id}`,
          stopNumber: 1,
          placeName: place.placeName,
          address: place.address,
          category: place.category,
          title: `Explore ${place.placeName}`,
          clue: `Approach ${place.placeName}. Look at the entrance and observe the surrounding architectural and historical features.`,
          objective: 'Observe the physical structure and report what you find.',
          taskType: 'OBSERVE',
          question: 'What prominent architectural or decorative feature did you observe?',
          difficulty: 'Easy',
          estimatedMinutes: 10,
          safePublicLocation: true,
          googleMapsUrl: place.googleMapsUrl,
          sourceUrls: place.sourceUrls,
          coordinates: place.coordinates,
          hint: 'Inspect the main facade or central public seating area.'
        }
      ],
      userProgress: [
        { stopNumber: 1, status: 'active' }
      ]
    };

    setActiveHunt(hunt);
    localStore.saveActiveHunt(hunt);
    setActiveTab('hunt');
  };

  // Turn real verified story/case into a physical treasure hunt (Requirement #9)
  const handleTurnArticleIntoHunt = (article: RealStoryArticle) => {
    const locName = article.suggested_task?.location_name || article.location || article.title;
    const clueText = article.suggested_task?.physical_action || `Navigate to ${locName}. Examine the public exterior and observe physical details reported in the source article: "${article.title}".`;
    const questionText = article.suggested_task?.question || `What notable architectural or commemorative feature confirms the history described in the article?`;

    const hunt: TreasureHunt = {
      id: `hunt_article_${Date.now()}`,
      title: `Investigation: ${article.title.slice(0, 45)}...`,
      mode: (article.genre as DiscoveryCategory) || 'Hidden History',
      locationName: locName,
      locationQuery: `${locName}, ${article.location}`,
      durationMinutes: 20,
      totalStops: 1,
      currentStopNumber: 1,
      status: 'active',
      createdAt: new Date().toISOString(),
      finalTreasureMessage: `You completed your real-world investigation of ${locName}!`,
      storyBehindThePlaces: article.summary,
      sourceUrls: [article.source_url],
      rumorRealitySummary: article.rumor_reality ? {
        factStatements: [article.rumor_reality.what_is_verified],
        legendStatements: [article.rumor_reality.what_is_not_verified],
        whyItMattered: article.why_this_story?.evidence_summary || `Grounded in published report from ${article.source_name}.`
      } : undefined,
      stops: [
        {
          taskId: `task_art_${Date.now()}`,
          stopNumber: 1,
          placeName: locName,
          address: article.location,
          category: (article.genre as DiscoveryCategory) || 'Hidden History',
          title: `Investigate: ${locName}`,
          clue: clueText,
          objective: `Observe ${locName} safely from the public sidewalk.`,
          taskType: 'OBSERVE',
          question: questionText,
          questionOptions: [
            'Commemorative stone or foundation date',
            'Historic architectural entrance or masonry',
            'Official municipal plaque or marker',
            'Distinctive facade detail or signage'
          ],
          difficulty: 'Medium',
          estimatedMinutes: 15,
          safePublicLocation: true,
          googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locName + ', ' + article.location)}`,
          sourceUrls: [article.source_url],
          sourceTitle: article.title,
          sourceUrl: article.source_url,
          claimType: article.claim_type,
          evidence: article.summary,
          hint: 'Remain in safe, public pedestrian zones while investigating.'
        }
      ],
      userProgress: [
        { stopNumber: 1, status: 'active' }
      ]
    };

    setActiveHunt(hunt);
    localStore.saveActiveHunt(hunt);
    setActiveTab('hunt');
  };

  // Turn normalized discovery record (from OSM, Wikipedia, or Live research) into a physical hunt
  const handleTurnRecordIntoHunt = (record: NormalizedDiscoveryRecord) => {
    const locName = record.title;
    const clueText = `Navigate to ${locName}. Observe the public exterior and verify the documented details from ${record.source_name}: "${record.description.slice(0, 100)}..."`;

    const hunt: TreasureHunt = {
      id: `hunt_rec_${Date.now()}`,
      title: `Discovery Quest: ${locName}`,
      mode: (record.genre[0] as DiscoveryCategory) || 'Hidden History',
      locationName: locName,
      locationQuery: record.latitude !== null && record.longitude !== null
        ? `${record.latitude}, ${record.longitude}`
        : `${locName}, ${record.location_name}`,
      centerCoordinates: record.latitude !== null && record.longitude !== null
        ? { latitude: record.latitude, longitude: record.longitude }
        : undefined,
      durationMinutes: 20,
      totalStops: 1,
      currentStopNumber: 1,
      status: 'active',
      createdAt: new Date().toISOString(),
      finalTreasureMessage: `You explored ${locName} and verified its open dataset record!`,
      storyBehindThePlaces: record.description,
      sourceUrls: [record.source_url],
      stops: [
        {
          taskId: `task_rec_${Date.now()}`,
          stopNumber: 1,
          placeName: locName,
          address: record.location_name,
          category: (record.genre[0] as DiscoveryCategory) || 'Hidden History',
          title: `Explore: ${locName}`,
          clue: clueText,
          objective: `Observe ${locName} safely from the public pedestrian walkway.`,
          taskType: 'OBSERVE',
          question: 'What physical architectural feature, plaque, or commemorative detail is visible?',
          questionOptions: [
            'Historic foundation or architectural keystone',
            'Commemorative civic plaque or inscription',
            'Distinctive facade stonework or gate',
            'Documented public marker or boundary'
          ],
          difficulty: 'Medium',
          estimatedMinutes: 15,
          safePublicLocation: true,
          googleMapsUrl: record.latitude !== null && record.longitude !== null
            ? `https://www.google.com/maps/search/?api=1&query=${record.latitude},${record.longitude}`
            : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locName + ', ' + record.location_name)}`,
          sourceUrls: [record.source_url],
          sourceTitle: `${record.source_name}: ${record.title}`,
          sourceUrl: record.source_url,
          claimType: record.claim_type,
          evidence: record.evidence?.[0]?.text || record.description,
          hint: 'Keep to public pathways and observe with care.'
        }
      ],
      userProgress: [
        { stopNumber: 1, status: 'active' }
      ]
    };

    setActiveHunt(hunt);
    localStore.saveActiveHunt(hunt);
    setActiveTab('hunt');
  };

  // Convert timeline into a chronological treasure hunt (Feature 5)
  const handleTurnTimelineIntoHunt = (record: NormalizedDiscoveryRecord, timeline: any) => {
    const locName = record.title;
    const entries = timeline?.entries || [];
    const stops = entries.slice(0, 3).map((entry: any, idx: number) => ({
      taskId: `task_tl_${idx + 1}_${Date.now()}`,
      stopNumber: idx + 1,
      placeName: locName,
      address: record.location_name,
      category: (record.genre[0] as DiscoveryCategory) || 'Hidden History',
      title: `${entry.title}`,
      clue: `Investigate ${locName} for physical traces of the ${entry.dateString || 'documented'} era. ${entry.shortSummary}`,
      objective: `Observe physical evidence connected to this historical milestone.`,
      taskType: 'OBSERVE',
      question: `What observable feature confirms the ${entry.dateString || 'historical'} period at this site?`,
      questionOptions: [
        'Foundation stonework or architectural period style',
        'Commemorative plaque or keystone inscription',
        'Preserved facade craftsmanship',
        'Boundary or structural marker'
      ],
      difficulty: 'Medium',
      estimatedMinutes: 12,
      safePublicLocation: true,
      googleMapsUrl: record.latitude !== null && record.longitude !== null
        ? `https://www.google.com/maps/search/?api=1&query=${record.latitude},${record.longitude}`
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locName + ', ' + record.location_name)}`,
      sourceUrls: [entry.sourceUrl || record.source_url],
      sourceTitle: entry.sourceName,
      sourceUrl: entry.sourceUrl,
      claimType: entry.claimClassification,
      evidence: entry.shortSummary
    }));

    const hunt: TreasureHunt = {
      id: `hunt_tl_${Date.now()}`,
      title: `Timeline Chronicle: ${locName}`,
      mode: (record.genre[0] as DiscoveryCategory) || 'Hidden History',
      locationName: locName,
      locationQuery: `${locName}, ${record.location_name}`,
      durationMinutes: stops.length * 15,
      totalStops: stops.length,
      currentStopNumber: 1,
      status: 'active',
      createdAt: new Date().toISOString(),
      finalTreasureMessage: `You explored the verified chronological timeline of ${locName}!`,
      storyBehindThePlaces: timeline.summary || record.description,
      sourceUrls: [record.source_url],
      stops,
      userProgress: stops.map((_: any, i: number) => ({ stopNumber: i + 1, status: i === 0 ? 'active' : 'pending' }))
    };

    setActiveHunt(hunt);
    localStore.saveActiveHunt(hunt);
    setActiveTab('hunt');
  };

  // Submit real-world observation at a stop
  const handleSubmitObservation = async (
    stopNumber: number, 
    observation: string,
    options?: { photoNote?: string; voiceTranscript?: string }
  ) => {
    if (!activeHunt) return;

    setIsLoading(true);
    try {
      const res = await fetch('/api/next-clue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hunt: activeHunt,
          stopNumber,
          userObservation: observation,
          photo_note: options?.photoNote,
          voice_transcript: options?.voiceTranscript
        })
      });

      let evaluation: any = { isAccepted: true, feedback: 'Observation logged!', isHuntComplete: stopNumber >= activeHunt.stops.length };
      if (res.ok) {
        evaluation = await res.json();
      }

      // Update progress
      const updatedProgress = activeHunt.userProgress.map(p => {
        if (p.stopNumber === stopNumber) {
          return {
            ...p,
            status: 'completed' as const,
            completedAt: new Date().toISOString(),
            userObservation: observation,
            feedbackFromAI: evaluation.feedback
          };
        }
        if (p.stopNumber === stopNumber + 1) {
          return { ...p, status: 'active' as const };
        }
        return p;
      });

      const nextStop = stopNumber + 1;
      const isCompleted = evaluation.isHuntComplete || nextStop > activeHunt.totalStops;

      // Adapt next stop if next_clue is returned by the AI Guide
      const updatedStops = activeHunt.stops.map(s => {
        if (s.stopNumber === nextStop && evaluation.next_clue) {
          return {
            ...s,
            clue: evaluation.next_clue,
            objective: evaluation.objective || s.objective,
            hint: evaluation.safety_note ? `Safety: ${evaluation.safety_note}` : s.hint
          };
        }
        return s;
      });

      const updatedHunt: TreasureHunt = {
        ...activeHunt,
        stops: updatedStops,
        userProgress: updatedProgress,
        currentStopNumber: isCompleted ? activeHunt.totalStops : nextStop,
        status: isCompleted ? 'completed' : 'active',
        completedAt: isCompleted ? new Date().toISOString() : undefined,
        discoveryChainActive: Boolean(evaluation.discoveryChainLink) || activeHunt.discoveryChainActive
      };

      setActiveHunt(updatedHunt);
      localStore.saveActiveHunt(updatedHunt);

      if (isCompleted) {
        localStore.saveCompletedHunt(updatedHunt);
        setCompletedHunts(prev => [updatedHunt, ...prev.filter(h => h.id !== updatedHunt.id)]);
        setInspectReport(updatedHunt);
        setIsReportOpen(true);
      }
    } catch (err: any) {
      console.error('[APP] Submit observation error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Launch preset hunt immediately
  const handleLaunchPresetHunt = (preset: TreasureHunt) => {
    const hunt: TreasureHunt = {
      ...preset,
      id: `hunt_${Date.now()}`,
      status: 'active',
      createdAt: new Date().toISOString()
    };
    setActiveHunt(hunt);
    localStore.saveActiveHunt(hunt);
    setActiveTab('hunt');
  };

  // Clear active hunt
  const handleClearActiveHunt = () => {
    setActiveHunt(null);
    localStore.clearActiveHunt();
    setActiveTab('create');
  };

  const handleDeleteCompletedHunt = (id: string) => {
    localStore.deleteCompletedHunt(id);
    setCompletedHunts(localStore.listCompletedHunts());
  };

  const handleClearAllHistory = () => {
    localStore.clearCompletedHunts();
    setCompletedHunts([]);
  };

  const handleNavigateToCreate = (loc?: string, mode?: DiscoveryCategory) => {
    if (loc) setInitialLocation(loc);
    if (mode) setInitialMode(mode);
    setActiveTab('create');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Header
        activeTab={activeTab}
        onNavigate={setActiveTab}
        onOpenGuide={() => setIsGuideOpen(true)}
        onOpenServices={() => setIsServicesOpen(true)}
        hasActiveHunt={Boolean(activeHunt)}
      />

      <main className="flex-1 pb-16">
        {activeTab === 'landing' && (
          <LandingView
            onCreateHunt={handleNavigateToCreate}
            onLaunchPresetHunt={handleLaunchPresetHunt}
            onStartPlaceTask={handleStartPlaceTask}
            onOpenArticles={(loc, genre) => {
              if (loc) setInitialLocation(loc);
              if (genre) setInitialMode(genre);
              setActiveTab('articles');
            }}
            onQuickGenerateHunt={handleGenerateHunt}
          />
        )}

        {activeTab === 'create' && (
          <CreateHuntView
            onGenerateHunt={handleGenerateHunt}
            isLoading={isLoading}
            initialLocation={initialLocation}
            initialMode={initialMode}
          />
        )}

        {activeTab === 'hunt' && activeHunt && (
          <ActiveHuntView
            hunt={activeHunt}
            onSubmitObservation={handleSubmitObservation}
            onOpenReport={() => {
              setInspectReport(activeHunt);
              setIsReportOpen(true);
            }}
            onOpenGuide={() => setIsGuideOpen(true)}
            isLoading={isLoading}
            onSelectStoryBranch={(branch) => {
              // Dynamically append or update next stop based on branch choice
              const newTaskId = `task_branch_${Date.now()}`;
              const updatedStops = [
                ...activeHunt.stops,
                {
                  taskId: newTaskId,
                  stopNumber: activeHunt.stops.length + 1,
                  placeName: branch.targetEntityName,
                  address: branch.targetAddress,
                  category: activeHunt.mode,
                  title: branch.label,
                  clue: branch.previewClue,
                  objective: `Investigate this connected site: ${branch.whyConnected}`,
                  taskType: 'OBSERVE' as const,
                  question: `What physical detail connects this site to ${branch.targetEntityName}?`,
                  questionOptions: [
                    'Architectural similarity or period masonry',
                    'Commemorative plaque or historic inscription',
                    'Direct spatial proximity along public walkway'
                  ],
                  difficulty: 'Medium' as const,
                  estimatedMinutes: 15,
                  safePublicLocation: true,
                  googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(branch.targetEntityName + ', ' + branch.targetAddress)}`,
                  sourceUrls: branch.evidenceSourceUrl ? [branch.evidenceSourceUrl] : []
                }
              ];
              const updatedHunt = {
                ...activeHunt,
                stops: updatedStops,
                totalStops: updatedStops.length
              };
              setActiveHunt(updatedHunt);
              localStore.saveActiveHunt(updatedHunt);
            }}
          />
        )}

        {activeTab === 'history' && (
          <MyHuntsView
            activeHunt={activeHunt}
            completedHunts={completedHunts}
            onContinueHunt={() => setActiveTab('hunt')}
            onViewReport={(hunt) => {
              setInspectReport(hunt);
              setIsReportOpen(true);
            }}
            onCreateNewHunt={() => setActiveTab('create')}
            onClearActiveHunt={handleClearActiveHunt}
            onDeleteCompletedHunt={handleDeleteCompletedHunt}
            onClearAllHistory={handleClearAllHistory}
          />
        )}

        {activeTab === 'articles' && (
          <RealArticlesView
            initialLocation={initialLocation || 'Kolkata'}
            initialGenre={initialMode || 'Hidden History'}
            onTurnIntoHunt={handleTurnArticleIntoHunt}
            onNavigateToCreate={handleNavigateToCreate}
          />
        )}

        {activeTab === 'discovery' && (
          <ContinuousDiscoveryView
            initialLocation={initialLocation || 'Edinburgh'}
            initialGenre={initialMode || 'Hidden History'}
            onTurnRecordIntoHunt={handleTurnRecordIntoHunt}
            onTurnTimelineIntoHunt={handleTurnTimelineIntoHunt}
          />
        )}
      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-6 px-4 text-center text-xs text-slate-500 font-mono space-y-2">
        <p>🏴‍☠️ HUMAN-POWERED TREASURE HUNT &bull; "Discover places you didn't know were there."</p>
        <p className="text-[11px] text-slate-600">
          Powered by Gemini &bull; Google Maps Platform & Static Maps API &bull; SerpApi Research Grounding &bull; Browser Local Storage Persistence
        </p>
      </footer>

      {/* MODALS & DRAWERS */}
      <FinalReportModal
        hunt={inspectReport}
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        onStartNewHunt={() => {
          setIsReportOpen(false);
          setActiveTab('create');
        }}
      />

      <ServiceStatusModal
        isOpen={isServicesOpen}
        onClose={() => setIsServicesOpen(false)}
      />

      <HuntGuideDrawer
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        activeHunt={activeHunt}
        onStartHunt={(params) => {
          handleGenerateHunt({
            locationName: params.locationName,
            mode: params.mode,
            durationMinutes: params.durationMinutes,
            numberOfStops: params.durationMinutes <= 15 ? 2 : 3
          });
        }}
      />
    </div>
  );
}
