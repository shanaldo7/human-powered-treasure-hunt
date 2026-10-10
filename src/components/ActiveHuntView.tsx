import React, { useState, useEffect } from 'react';
import { TreasureHunt, HuntTask } from '../types/hunt';
import { 
  MapPin, 
  Navigation, 
  Sparkles, 
  HelpCircle, 
  Send, 
  Award, 
  Compass, 
  ExternalLink, 
  Map as MapIcon, 
  Camera, 
  Mic, 
  MicOff, 
  CheckCircle2, 
  ShieldAlert, 
  Link as LinkIcon, 
  Eye,
  ChevronDown,
  ChevronUp,
  Clock,
  ArrowRight,
  Volume2,
  VolumeX,
  Share2,
  Lightbulb,
  Sliders,
  CloudRain,
  AlertTriangle,
  Sun,
  Download,
  Check,
  GitBranch,
  Bookmark
} from 'lucide-react';
import { localStore } from '../services/localStorageService';
import { StoryBranchOption } from '../types/intelligence';
import { GoogleLensDiscoveryModal } from './GoogleLensDiscoveryModal';
import { GoogleLensDiscoveryResult, LensVerificationAnalysis } from '../types/lens';

interface ActiveHuntViewProps {
  hunt: TreasureHunt;
  onSubmitObservation: (
    stopNumber: number, 
    observation: string,
    options?: { photoNote?: string; voiceTranscript?: string }
  ) => Promise<void>;
  onOpenReport: () => void;
  onOpenGuide: () => void;
  isLoading: boolean;
  onSelectStoryBranch?: (branch: StoryBranchOption) => void;
}

export const ActiveHuntView: React.FC<ActiveHuntViewProps> = ({
  hunt,
  onSubmitObservation,
  onOpenReport,
  onOpenGuide,
  isLoading,
  onSelectStoryBranch
}) => {
  const [userObservation, setUserObservation] = useState('');
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [photoNote, setPhotoNote] = useState('');
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showFoundItForm, setShowFoundItForm] = useState(false);
  const [hintLevel, setHintLevel] = useState<number>(0);
  const [difficultySetting, setDifficultySetting] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [showSourcePanel, setShowSourcePanel] = useState(false);
  const [mapMode, setMapMode] = useState<'place' | 'directions'>('place');
  const [shareNotice, setShareNotice] = useState<string | null>(null);

  // Feature 12 & 13: Offline Field Kit and Personal Memory
  const [isSavedOffline, setIsSavedOffline] = useState(false);
  const [offlineNotice, setOfflineNotice] = useState<string | null>(null);

  // Feature 11: Branching Story Routes State
  const [availableBranches, setAvailableBranches] = useState<StoryBranchOption[]>([]);
  const [isBranchLoading, setIsBranchLoading] = useState(false);

  // FEATURE UPGRADE: Google Lens Visual Discovery
  const [isLensModalOpen, setIsLensModalOpen] = useState(false);
  const [lastLensVerification, setLastLensVerification] = useState<{
    analysis: LensVerificationAnalysis;
    discovery: GoogleLensDiscoveryResult;
  } | null>(null);

  // Stop speaking if component unmounts
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const toggleSpeech = (text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  const handleShareHunt = async () => {
    const text = `🏴‍☠️ Human-Powered Treasure Hunt: ${hunt.title}\n📍 Location: ${hunt.locationName}\n🎭 Genre: ${hunt.mode}\nStop ${hunt.currentStopNumber}/${hunt.totalStops}: ${currentStop?.placeName || ''}\nExplore real history and hidden places!`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: hunt.title,
          text: text,
          url: window.location.href
        });
        return;
      } catch (_e) {}
    }
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      setShareNotice('Hunt summary copied to clipboard!');
      setTimeout(() => setShareNotice(null), 3000);
    }
  };

  // FEATURE 12: SAVE OFFLINE FIELD KIT
  const handleSaveOfflineFieldKit = () => {
    try {
      localStore.saveOfflineFieldKit({
        huntId: hunt.id,
        downloadedAt: new Date().toISOString(),
        huntTitle: hunt.title,
        locationName: hunt.locationName,
        clues: (hunt.stops || []).map(s => ({
          stopNumber: s.stopNumber,
          title: s.title,
          clue: s.clue,
          objective: s.objective,
          placeName: s.placeName,
          address: s.address,
          sourceUrls: s.sourceUrls || []
        })),
        savedObservations: [],
        isStale: false,
        offlineNotice: 'Offline Field Kit saved. Clues and notes are accessible without internet.'
      });
      setIsSavedOffline(true);
      setOfflineNotice('Field Kit saved locally for offline exploration!');
      setTimeout(() => setOfflineNotice(null), 4000);
    } catch (_e) {
      setOfflineNotice('Could not save field kit locally.');
    }
  };

  // Check if previously saved offline
  useEffect(() => {
    if (hunt?.id) {
      const saved = localStore.getOfflineFieldKit(hunt.id);
      if (saved) setIsSavedOffline(true);
    }
  }, [hunt?.id]);

  const hasStops = Array.isArray(hunt.stops) && hunt.stops.length > 0;
  const currentStopIndex = hasStops 
    ? Math.max(0, Math.min(hunt.currentStopNumber - 1, hunt.stops.length - 1))
    : 0;
  const currentStop: HuntTask | undefined = hasStops 
    ? (hunt.stops[currentStopIndex] || hunt.stops[0]) 
    : undefined;
  const isCompleted = hunt.status === 'completed';

  // Last completed stop's AI feedback
  const previousProgress = Array.isArray(hunt.userProgress) 
    ? hunt.userProgress.find(p => p.stopNumber === hunt.currentStopNumber - 1)
    : undefined;
  const lastAIFeedback = previousProgress?.feedbackFromAI;

  // Build real Google Maps navigation URL
  const googleMapsUrl = currentStop?.googleMapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    currentStop ? `${currentStop.placeName}, ${currentStop.address || hunt.locationName}` : hunt.locationName
  )}`;

  // Google Maps Embed URL with official attribution
  const mapsApiKey = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '').trim();
  const mapSearchQuery = currentStop 
    ? `${currentStop.placeName}, ${currentStop.address || hunt.locationName}`
    : hunt.locationName;
  const embedMapUrl = mapsApiKey
    ? mapMode === 'directions'
      ? `https://www.google.com/maps/embed/v1/directions?key=${mapsApiKey}&origin=${encodeURIComponent(hunt.locationName)}&destination=${encodeURIComponent(mapSearchQuery)}&mode=walking`
      : `https://www.google.com/maps/embed/v1/place?key=${mapsApiKey}&q=${encodeURIComponent(mapSearchQuery)}`
    : `https://maps.google.com/maps?q=${encodeURIComponent(mapSearchQuery)}&t=&z=16&ie=UTF8&iwloc=&output=embed`;

  // Voice recording toggle using browser SpeechRecognition if supported
  const toggleVoiceRecording = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      const simulated = prompt('Voice observation note (optional):', voiceTranscript || '');
      if (simulated !== null) {
        setVoiceTranscript(simulated);
        if (!userObservation.trim()) {
          setUserObservation(simulated);
        }
      }
      return;
    }

    if (isRecording) {
      setIsRecording(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => setIsRecording(true);
      recognition.onend = () => setIsRecording(false);
      recognition.onerror = () => setIsRecording(false);
      recognition.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        setVoiceTranscript(text);
        if (!userObservation.trim()) {
          setUserObservation(text);
        }
        setIsRecording(false);
      };

      recognition.start();
    } catch (_err) {
      setIsRecording(false);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoNote(`Photo attached: ${file.name}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentStop) return;

    const finalReport = selectedOption 
      ? `Selected option: ${selectedOption}. ${userObservation}`.trim()
      : userObservation.trim();

    if (!finalReport && !isLoading) return;

    try {
      const observationText = finalReport || 'I arrived at the landmark and observed the physical feature.';
      await onSubmitObservation(
        currentStop.stopNumber, 
        observationText,
        {
          photoNote: photoNote.trim() || undefined,
          voiceTranscript: voiceTranscript.trim() || undefined
        }
      );

      // FEATURE 13: Update Personal Discovery Memory
      localStore.updatePersonalProfile({
        previouslySeenDiscoveries: Array.from(new Set([
          ...localStore.getPersonalProfile().previouslySeenDiscoveries,
          currentStop.placeName
        ]))
      });

      // FEATURE 11: Fetch Adaptive Story Branches for the visited place
      setIsBranchLoading(true);
      try {
        const branchRes = await fetch('/api/story-branches', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            currentPlaceName: currentStop.placeName,
            observation: observationText,
            availableRecords: []
          })
        });
        if (branchRes.ok) {
          const bData = await branchRes.json();
          setAvailableBranches(bData.branches || []);
        }
      } catch (_bErr) {}
      setIsBranchLoading(false);

      setUserObservation('');
      setSelectedOption(null);
      setPhotoNote('');
      setVoiceTranscript('');
      setHintLevel(0);
      setShowFoundItForm(false);
    } catch (err) {
      console.warn('Error submitting observation:', err);
    }
  };

  // FEATURE UPGRADE: Handler when user returns from Google Lens and verifies discovery
  const handleApplyVerifiedLensDiscovery = async (
    analysis: LensVerificationAnalysis,
    discoveryResult: GoogleLensDiscoveryResult
  ) => {
    if (!currentStop) return;

    setLastLensVerification({ analysis, discovery: discoveryResult });

    const observationNote = `[Google Lens Identified: ${discoveryResult.objectName}] ${discoveryResult.lensDescription ? `· Details: ${discoveryResult.lensDescription}` : ''} ${discoveryResult.userObservation ? `· Observation: ${discoveryResult.userObservation}` : ''}`.trim();

    try {
      await onSubmitObservation(
        currentStop.stopNumber,
        observationNote,
        {
          photoNote: `Google Lens: ${discoveryResult.objectName}`,
          voiceTranscript: undefined
        }
      );

      // Update personal discovery memory
      localStore.updatePersonalProfile({
        previouslySeenDiscoveries: Array.from(new Set([
          ...localStore.getPersonalProfile().previouslySeenDiscoveries,
          `${currentStop.placeName} (${discoveryResult.objectName})`
        ]))
      });

      // Fetch story branches
      setIsBranchLoading(true);
      try {
        const branchRes = await fetch('/api/story-branches', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            currentPlaceName: currentStop.placeName,
            observation: observationNote,
            availableRecords: []
          })
        });
        if (branchRes.ok) {
          const bData = await branchRes.json();
          setAvailableBranches(bData.branches || []);
        }
      } catch (_bErr) {}
      setIsBranchLoading(false);

      setUserObservation('');
      setPhotoNote('');
      setShowFoundItForm(false);
    } catch (err) {
      console.warn('Error applying verified Lens discovery:', err);
    }
  };

  const walkingMins = hunt.walkingTimeMinutes || Math.round(hunt.totalStops * 7);
  const explorationMins = hunt.explorationTimeMinutes || Math.round(hunt.totalStops * 8);

  const isMysteryOrHorror = ['Horror & Haunted', 'Horror', 'Local Stories', 'Local Mysteries', 'Legends & Folklore', 'Folklore'].some(
    theme => (hunt.mode || '').toLowerCase().includes(theme.toLowerCase())
  );

  return (
    <div className="py-6 px-4 sm:px-6 max-w-3xl mx-auto font-sans space-y-6">
      
      {/* 9. TOP: HUNT IN PROGRESS BANNER */}
      <div className="bg-slate-900/90 border border-slate-800/80 rounded-3xl p-5 sm:p-6 space-y-5 shadow-xl backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-400 mb-1">
              <span>🏴‍☠️ HUNT IN PROGRESS</span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-300">{hunt.mode}</span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-400">{hunt.locationName}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-serif font-bold text-slate-100">
              {hunt.title}
            </h1>
          </div>

          <div className="text-right shrink-0 flex items-center gap-2">
            {/* FEATURE 12: OFFLINE FIELD KIT BUTTON */}
            <button
              type="button"
              onClick={handleSaveOfflineFieldKit}
              title="Save clues, routes, and observations to device for offline exploration"
              className={`px-3 py-1 rounded-xl text-xs font-mono font-bold border flex items-center gap-1.5 transition-all ${
                isSavedOffline
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 shadow-sm'
                  : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border-slate-800'
              }`}
            >
              {isSavedOffline ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Download className="w-3.5 h-3.5 text-cyan-400" />}
              <span>{isSavedOffline ? 'OFFLINE KIT SAVED' : 'SAVE FOR OFFLINE'}</span>
            </button>

            <span className="text-xs font-mono font-bold text-amber-300 bg-amber-500/10 px-3 py-1 rounded-xl border border-amber-500/30">
              STOP {hunt.currentStopNumber} / {hunt.totalStops}
            </span>
          </div>
        </div>

        {/* Visual Progress Track (Requirement #9): ●━━━━━━○━━━━━━○ */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>Route Progress</span>
            <span>{Math.round((hunt.currentStopNumber / Math.max(1, hunt.totalStops)) * 100)}%</span>
          </div>

          <div className="flex items-center w-full px-2">
            {Array.from({ length: hunt.totalStops || 3 }).map((_, idx) => {
              const stopNum = idx + 1;
              const isPast = stopNum < hunt.currentStopNumber;
              const isCurrent = stopNum === hunt.currentStopNumber;
              const isFuture = stopNum > hunt.currentStopNumber;

              return (
                <React.Fragment key={idx}>
                  {/* Dot */}
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-mono font-bold transition-all ${
                        isPast
                          ? 'bg-emerald-500 text-slate-950'
                          : isCurrent
                          ? 'bg-amber-400 text-slate-950 ring-4 ring-amber-500/20 animate-hunt-pulse'
                          : 'bg-slate-800 text-slate-500 border border-slate-700'
                      }`}
                    >
                      {isPast ? '✓' : stopNum}
                    </div>
                  </div>

                  {/* Connecting Line */}
                  {idx < (hunt.totalStops || 3) - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-1 transition-all ${
                        isPast ? 'bg-emerald-500/80' : isCurrent ? 'bg-amber-500/50' : 'bg-slate-800'
                      }`}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Route Timings */}
        <div className="grid grid-cols-3 gap-2 bg-slate-950 p-2.5 rounded-2xl border border-slate-800/80 text-center font-mono text-[11px]">
          <div>
            <span className="text-slate-500 block text-[9px] uppercase">WALKING</span>
            <span className="text-slate-200 font-bold">🚶 ~{walkingMins} min</span>
          </div>
          <div className="border-x border-slate-800">
            <span className="text-slate-500 block text-[9px] uppercase">EXPLORATION</span>
            <span className="text-amber-300 font-bold">🔎 ~{explorationMins} min</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[9px] uppercase">ESTIMATED TOTAL</span>
            <span className="text-emerald-400 font-bold">⏱️ ~{hunt.durationMinutes} min</span>
          </div>
        </div>
      </div>

      {/* CURRENT WEATHER ADVISORY (Requirement: Weather integration & safe pedestrian routing) */}
      {(hunt.weatherAdvisory || hunt.weatherNote) && (
        <div className={`p-4 rounded-2xl border transition-all ${
          hunt.weatherAdvisory?.isExtreme 
            ? 'bg-rose-950/40 border-rose-500/50 text-rose-200' 
            : 'bg-slate-900/90 border-sky-500/40 text-slate-200'
        } shadow-lg space-y-2`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {hunt.weatherAdvisory?.isExtreme ? (
                <div className="p-1.5 bg-rose-500/20 text-rose-400 rounded-lg border border-rose-500/40">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              ) : (
                <div className="p-1.5 bg-sky-500/20 text-sky-400 rounded-lg border border-sky-500/40">
                  <Sun className="w-4 h-4" />
                </div>
              )}
              <div>
                <span className={`text-xs font-mono font-bold tracking-wider uppercase ${
                  hunt.weatherAdvisory?.isExtreme ? 'text-rose-400' : 'text-sky-400'
                }`}>
                  {hunt.weatherAdvisory?.isExtreme ? '⚠️ WEATHER ADVISORY' : '🌤️ CURRENT WEATHER'}
                </span>
                {hunt.weatherAdvisory && (
                  <span className="ml-2 text-xs font-mono text-slate-400">
                    {hunt.weatherAdvisory.temperatureC}°C / {hunt.weatherAdvisory.temperatureF}°F · {hunt.weatherAdvisory.condition}
                  </span>
                )}
              </div>
            </div>
            
            {hunt.weatherAdvisory?.isExtreme ? (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold uppercase">
                Sheltered Route Active
              </span>
            ) : (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold uppercase">
                Pedestrian Safe
              </span>
            )}
          </div>

          <p className="text-xs sm:text-sm font-sans leading-relaxed text-slate-300">
            {hunt.weatherAdvisory?.advisoryMessage || hunt.weatherNote}
          </p>

          {hunt.weatherAdvisory?.isExtreme && (
            <div className="text-[11px] font-mono text-rose-300/90 bg-rose-950/60 p-2 rounded-xl border border-rose-900/60 flex items-center gap-2">
              <span>🛡️</span>
              <span>All generated clue checkpoints prioritize covered arcades, entrance awnings, and sheltered vistas.</span>
            </div>
          )}
        </div>
      )}

      {/* 16. DISCOVERY CHAIN UI (Requirement #16) */}
      {hunt.discoveryChainActive && (
        <div className="bg-slate-900/90 border border-amber-500/30 rounded-2xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
            <LinkIcon className="w-3.5 h-3.5 text-amber-400" />
            <span>DISCOVERY CHAIN</span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono text-slate-300">
            <span className="text-emerald-400 font-bold">✓ Stop {Math.max(1, hunt.currentStopNumber - 1)}</span>
            <span className="text-slate-500">→</span>
            <span className="text-emerald-400 font-bold">✓ Observation</span>
            <span className="text-slate-500">→</span>
            <span className="text-amber-300 font-bold">→ New Clue</span>
            <span className="text-slate-500">→</span>
            <span className="text-slate-400">○ Stop {hunt.currentStopNumber}</span>
          </div>
        </div>
      )}

      {/* 12. AI GUIDE CONTEXTUAL CARD (Requirement #12) */}
      {lastAIFeedback && !isCompleted && (
        <div className="p-4 bg-slate-900/90 border border-emerald-500/40 rounded-2xl space-y-2 shadow-lg">
          <div className="flex items-center gap-2 font-mono font-bold text-emerald-400 uppercase text-xs">
            <span>🏴‍☠️ HUNT GUIDE</span>
          </div>
          <p className="text-slate-200 font-sans text-xs sm:text-sm leading-relaxed">
            "{lastAIFeedback}"
          </p>
          <div className="pt-1 text-[11px] font-mono text-amber-400/90 font-semibold flex items-center gap-1">
            <span>NEXT CLUE REVEALED BELOW</span>
            <ArrowRight className="w-3 h-3" />
          </div>
        </div>
      )}

      {/* FEATURE 11: BRANCHING DISCOVERY STORY ROUTES */}
      {availableBranches.length > 0 && !isCompleted && (
        <div className="p-5 bg-gradient-to-br from-indigo-950/40 to-slate-950 border border-indigo-500/40 rounded-3xl space-y-3 shadow-xl">
          <div className="flex items-center justify-between font-mono text-xs">
            <span className="text-indigo-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <GitBranch className="w-4 h-4 text-indigo-400" />
              <span>CHOOSE YOUR DISCOVERY BRANCH</span>
            </span>
            <span className="text-[10px] text-slate-400">Adaptive Route</span>
          </div>
          <p className="text-xs text-slate-300 font-sans">
            Based on what you reported in the field, explore where your investigation leads:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
            {availableBranches.map((branch) => (
              <div 
                key={branch.branchId}
                className="p-3.5 bg-slate-900/90 rounded-2xl border border-slate-800 hover:border-indigo-400 flex flex-col justify-between space-y-2 transition-all group"
              >
                <div className="space-y-1">
                  <span className="text-[10px] font-mono font-bold text-indigo-300 uppercase block">
                    [{branch.branchType.replace('_', ' ')}]
                  </span>
                  <h4 className="text-xs font-serif font-bold text-slate-100 group-hover:text-indigo-300 transition-colors">
                    {branch.label}
                  </h4>
                  <p className="text-[11px] text-slate-400 font-sans line-clamp-2">
                    {branch.whyConnected}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (onSelectStoryBranch) onSelectStoryBranch(branch);
                    setAvailableBranches([]);
                  }}
                  className="w-full py-2 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40 rounded-xl text-[11px] font-mono font-bold transition-all text-center flex items-center justify-center gap-1"
                >
                  <span>FOLLOW BRANCH</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* NO MATCH FOUND OR COMPLETED HUNT STATE */}
      {hunt.noMatchFound ? (
        <div className="bg-slate-900 border border-amber-500/40 rounded-3xl p-6 sm:p-8 text-center space-y-4 shadow-2xl">
          <div className="w-12 h-12 bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded-2xl flex items-center justify-center mx-auto text-2xl font-bold">
            🔍
          </div>
          <div className="space-y-2 max-w-md mx-auto">
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-slate-100">
              No Strong {hunt.mode} Discovery Found
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 font-sans leading-relaxed">
              {hunt.finalTreasureMessage || `No strong ${hunt.mode} discovery was found in ${hunt.locationName} right now. We strictly require verified research evidence and refuse to fabricate generic destinations.`}
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={onOpenGuide}
              className="w-full sm:w-auto px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all font-mono"
            >
              <Compass className="w-4 h-4" />
              <span>Ask Hunt Guide for Recommendations</span>
            </button>
          </div>
        </div>
      ) : isCompleted ? (
        <div className="bg-emerald-950/60 border border-emerald-500/50 rounded-3xl p-6 text-center space-y-4 shadow-2xl">
          <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-2xl flex items-center justify-center mx-auto text-2xl font-bold">
            🏴‍☠️
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-serif font-bold text-slate-100">DISCOVERY QUEST COMPLETE!</h2>
            <p className="text-xs text-slate-300 font-sans max-w-md mx-auto leading-relaxed">
              {hunt.finalTreasureMessage}
            </p>
            {hunt.storyBehindThePlaces && (
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl text-xs text-amber-200 text-left space-y-1 max-w-lg mx-auto">
                <span className="font-mono font-bold text-amber-400 block text-[10px] uppercase">THE STORY BEHIND THE PLACES:</span>
                <p>{hunt.storyBehindThePlaces}</p>
              </div>
            )}
          </div>
          <button
            onClick={onOpenReport}
            className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 mx-auto shadow-lg shadow-emerald-500/20 transition-all"
          >
            <Award className="w-4 h-4" />
            <span>VIEW FINAL DISCOVERY REPORT</span>
          </button>
        </div>
      ) : currentStop ? (
        /* ACTIVE STOP CONTENTS */
        <div className="space-y-6">
          
          {/* DESTINATION CARD */}
          <div className="bg-slate-900/90 border border-slate-800/80 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <span className="text-[11px] font-mono text-amber-400 font-bold uppercase tracking-wider block">
                  DESTINATION
                </span>
                <h2 className="text-2xl font-serif font-bold text-slate-100">
                  {currentStop.placeName}
                </h2>
                <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
                  <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span>{currentStop.address}</span>
                </div>
              </div>

              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-serif font-bold text-xs rounded-xl shadow-md shadow-amber-500/20 flex items-center gap-1.5 shrink-0 transition-transform hover:scale-105"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>OPEN IN GOOGLE MAPS</span>
              </a>
            </div>

            {/* Google Maps Embed with Controls */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-slate-400 flex items-center gap-1">
                  <MapIcon className="w-3.5 h-3.5 text-amber-400" />
                  <span>Map Preview</span>
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setMapMode('place')}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                      mapMode === 'place' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    📍 Place
                  </button>
                  <button
                    type="button"
                    onClick={() => setMapMode('directions')}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                      mapMode === 'directions' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    🚶 Walk Route
                  </button>
                </div>
              </div>

              <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 h-56 sm:h-64 shadow-inner">
                <iframe
                  title={`Google Maps for ${currentStop.placeName}`}
                  src={embedMapUrl}
                  width="100%"
                  height="100%"
                  className="w-full h-full border-0"
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </div>

            {/* 15. SOURCE PANEL: WHY THIS PLACE? (Requirement #15) */}
            <div className="border-t border-slate-800/80 pt-3">
              <button
                type="button"
                onClick={() => setShowSourcePanel(!showSourcePanel)}
                className="w-full flex items-center justify-between text-xs font-mono text-slate-400 hover:text-amber-300 transition-colors"
              >
                <span className="font-bold flex items-center gap-1.5 text-amber-400">
                  <span>WHY THIS PLACE? (SOURCE & EVIDENCE)</span>
                </span>
                {showSourcePanel ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showSourcePanel && (
                <div className="mt-3 p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-2 text-xs font-sans text-slate-300">
                  <p className="leading-relaxed">
                    "{currentStop.evidence || currentStop.objective}"
                  </p>
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 font-mono text-[11px] text-slate-400">
                    <div>
                      <span className="text-slate-500 block">Claim Type:</span>
                      <span className="text-slate-200">{currentStop.claimType || 'Documented record'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Genre Relevance:</span>
                      <span className="text-emerald-400 font-bold">
                        {currentStop.genreRelevanceScore ? `${Math.round(currentStop.genreRelevanceScore * 100)}% match` : 'Verified'}
                      </span>
                    </div>
                  </div>
                  {currentStop.sourceUrls && currentStop.sourceUrls.length > 0 && (
                    <div className="pt-1">
                      <a
                        href={currentStop.sourceUrls[0]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-amber-400 hover:text-amber-300 flex items-center gap-1 underline underline-offset-2 font-mono text-[11px]"
                      >
                        <span>[ READ SOURCE: {currentStop.sourceTitle || 'Web record'} ]</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 14. RUMOR → REALITY UI (Requirement #14) */}
            {isMysteryOrHorror && (
              <div className="p-4 bg-slate-950 rounded-2xl border border-amber-500/25 space-y-2 text-xs font-sans">
                <div className="flex items-center justify-between font-mono">
                  <span className="text-amber-400 font-bold uppercase tracking-wider">
                    👻 RUMOR → REALITY
                  </span>
                  <span className="text-[10px] text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                    STATUS: UNVERIFIED CLAIM
                  </span>
                </div>
                <div className="space-y-1 text-slate-300">
                  <p className="font-semibold text-slate-200">LOCAL STORY:</p>
                  <p className="italic text-slate-400">
                    "{currentStop.evidence || 'Local folklore associates this physical location with unexplained historical accounts.'}"
                  </p>
                </div>
                <div className="pt-2 border-t border-slate-900 space-y-1 font-mono text-[11px]">
                  <span className="text-slate-400 block font-bold">WHAT WE KNOW:</span>
                  <div className="text-emerald-400">✓ Historical location confirmed & accessible from public street</div>
                  <div className="text-amber-300">✓ Local story documented in regional folklore archives</div>
                  <div className="text-rose-400">⚠️ Paranormal claims remain unverified legend</div>
                </div>
              </div>
            )}
          </div>

          {/* 10. HUNT STOP CARD: PHYSICAL DISCOVERY CLUE */}
          <div className="bg-slate-900/90 border border-slate-800/80 rounded-3xl p-6 sm:p-7 space-y-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 font-mono text-xs">
              <span className="text-amber-400 font-bold uppercase tracking-wider">
                STOP {currentStop.stopNumber} &bull; 🔎 PHYSICAL DISCOVERY
              </span>
              <div className="flex items-center gap-2 text-slate-400">
                <span>⏱️ ~{currentStop.estimatedMinutes || 10} min</span>
                <span>&bull;</span>
                <span>🚶 4 min walk</span>
              </div>
            </div>

            {/* Clue Text & Voice Controls (Requirement #6: Voice-First Hunt Guide) */}
            <div className="space-y-3">
              {/* Voice Read Aloud and Share bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 pb-1">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleSpeech(`${currentStop.clue}. Objective: ${currentStop.objective}. ${currentStop.question || ''}`)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 border transition-all ${
                      isSpeaking 
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 animate-pulse'
                        : 'bg-slate-950 hover:bg-slate-800 text-amber-300 border-slate-800'
                    }`}
                    title="Read clue aloud with speech synthesis"
                  >
                    {isSpeaking ? (
                      <VolumeX className="w-4 h-4 text-rose-400" />
                    ) : (
                      <Volume2 className="w-4 h-4 text-amber-400" />
                    )}
                    <span>{isSpeaking ? 'STOP AUDIO GUIDE' : '🔊 READ CLUE ALOUD'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleShareHunt}
                    className="px-3 py-2 bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-xl text-xs font-mono flex items-center gap-1.5 transition-colors"
                    title="Share hunt summary"
                  >
                    <Share2 className="w-3.5 h-3.5 text-cyan-400" />
                    <span>SHARE</span>
                  </button>
                </div>

                {/* Adjustable Clue Difficulty (Requirement #2: Adaptive Clue Engine) */}
                <div className="flex items-center gap-1.5 text-[10px] font-mono bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-800">
                  <span className="text-slate-500">DIFFICULTY:</span>
                  {(['Easy', 'Medium', 'Hard'] as const).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setDifficultySetting(lvl)}
                      className={`px-1.5 py-0.5 rounded transition-colors ${
                        difficultySetting === lvl
                          ? 'bg-amber-500 text-slate-950 font-bold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              {shareNotice && (
                <div className="p-2 bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs font-mono rounded-xl">
                  ✓ {shareNotice}
                </div>
              )}

              <p className="text-base sm:text-lg font-serif text-slate-100 leading-relaxed bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
                "{currentStop.clue}"
              </p>
              
              <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl text-xs text-amber-300 flex items-start gap-2">
                <span className="font-mono font-bold text-amber-400 uppercase text-[10px] shrink-0 mt-0.5">OBJECTIVE:</span>
                <span>{currentStop.objective}</span>
              </div>
            </div>

            {/* PROGRESSIVELY REVEALED HINTS (Requirement #2: Adaptive Clue Engine) */}
            <div className="space-y-2 pt-2 border-t border-slate-800/80">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                  <span>PROGRESSIVE FIELD HINTS:</span>
                </span>
                <span className="text-[11px] text-amber-400">
                  {hintLevel === 0 ? 'No hints revealed' : `Level ${hintLevel} of 3 revealed`}
                </span>
              </div>

              {/* Revealed Hints */}
              {hintLevel > 0 && (
                <div className="space-y-2">
                  {hintLevel >= 1 && (
                    <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-300 space-y-1">
                      <span className="text-amber-400 font-bold block text-[10px]">HINT 1 · AREA CONTEXT:</span>
                      <p>{(currentStop.hints && currentStop.hints[0]) || `Locate ${currentStop.placeName} along the accessible pedestrian walkway in ${currentStop.address || hunt.locationName}.`}</p>
                    </div>
                  )}

                  {hintLevel >= 2 && (
                    <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-cyan-300 space-y-1">
                      <span className="text-cyan-400 font-bold block text-[10px]">HINT 2 · ARCHITECTURAL FEATURE:</span>
                      <p>{(currentStop.hints && currentStop.hints[1]) || `Look for the main public entranceway, boundary stone, or distinct facade elements.`}</p>
                    </div>
                  )}

                  {hintLevel >= 3 && (
                    <div className="p-3 bg-slate-950 border border-amber-500/40 rounded-xl text-xs font-mono text-amber-200 space-y-1">
                      <span className="text-amber-300 font-bold block text-[10px]">HINT 3 · DIRECT LANDMARK POINTER:</span>
                      <p>{(currentStop.hints && currentStop.hints[2]) || currentStop.hint || `Examine the exterior inscriptions, cornerstone carvings, or entrance signage up close.`}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Reveal Next Hint Button */}
              {hintLevel < 3 && (
                <button
                  type="button"
                  onClick={() => setHintLevel(prev => Math.min(3, prev + 1))}
                  className="w-full py-2 bg-slate-950 hover:bg-slate-850 text-slate-300 hover:text-amber-300 border border-slate-800 rounded-xl text-xs font-mono flex items-center justify-center gap-1.5 transition-colors"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                  <span>
                    {hintLevel === 0 && '💡 Reveal Hint 1 (General Area & Direction)'}
                    {hintLevel === 1 && '💡 Reveal Hint 2 (Architectural Feature)'}
                    {hintLevel === 2 && '💡 Reveal Hint 3 (Precise Landmark Pointer)'}
                  </span>
                </button>
              )}
            </div>

            {/* Question / Selectable Options */}
            {currentStop.question && (
              <div className="space-y-3 pt-2">
                <label className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider block">
                  QUESTION: {currentStop.question}
                </label>

                {currentStop.questionOptions && currentStop.questionOptions.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {currentStop.questionOptions.map((opt, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setSelectedOption(opt)}
                        className={`p-3 rounded-xl text-xs font-mono text-left transition-all border ${
                          selectedOption === opt
                            ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                            : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <span className="text-amber-400 font-bold mr-2">[{String.fromCharCode(65 + i)}]</span>
                        {opt}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* FEATURE UPGRADE: GOOGLE LENS REAL-WORLD DISCOVERY BUTTON & ACTIONS */}
            <div className="pt-3 border-t border-slate-800/80 space-y-3">
              {/* Highlight Banner if last verification succeeded */}
              {lastLensVerification && (
                <div className={`p-4 rounded-2xl border space-y-1.5 text-xs font-sans ${
                  lastLensVerification.analysis.status === 'confirmed'
                    ? 'bg-emerald-950/40 border-emerald-500/40'
                    : 'bg-amber-950/40 border-amber-500/40'
                }`}>
                  <div className="flex items-center justify-between font-mono text-[11px]">
                    <span className="font-bold flex items-center gap-1.5 text-emerald-400">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>LENS VERIFICATION APPLIED: {lastLensVerification.discovery.objectName}</span>
                    </span>
                    <span className="text-slate-400">
                      {Math.round(lastLensVerification.analysis.matchConfidence * 100)}% match
                    </span>
                  </div>
                  <p className="text-slate-200">
                    {lastLensVerification.analysis.explanation}
                  </p>
                </div>
              )}

              {/* Action Buttons: Google Lens (Primary Visual Recognition) + Standard "I Found It" */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setIsLensModalOpen(true)}
                  className="w-full py-4 px-4 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-serif font-bold text-xs sm:text-sm rounded-2xl shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 transition-transform hover:scale-[1.01] active:scale-[0.99]"
                >
                  <Camera className="w-4 h-4 text-slate-950" />
                  <span>IDENTIFY WITH GOOGLE LENS</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowFoundItForm(!showFoundItForm)}
                  className="w-full py-4 px-4 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-serif font-bold text-xs sm:text-sm rounded-2xl shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 transition-transform hover:scale-[1.01]"
                >
                  <CheckCircle2 className="w-4 h-4 text-slate-950" />
                  <span>✓ I FOUND IT (MANUAL LOG)</span>
                </button>
              </div>

              {/* Polished Observation Panel */}
              {showFoundItForm && (
                <form onSubmit={handleSubmit} className="p-5 bg-slate-950 rounded-2xl border border-slate-800 space-y-4">
                  <div>
                    <h3 className="text-sm font-mono font-bold text-amber-400 uppercase tracking-wider">
                      WHAT DID YOU DISCOVER?
                    </h3>
                    <p className="text-xs text-slate-400 font-sans mt-0.5">
                      Tell your Hunt Guide what you found in the real world.
                    </p>
                  </div>

                  <div className="space-y-1">
                    <textarea
                      value={userObservation}
                      onChange={(e) => setUserObservation(e.target.value)}
                      placeholder="Describe what you observed in person (e.g. 'I noticed an iron monogram on the stone gate', foundation date, architectural motif)..."
                      rows={3}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500/50 font-mono resize-none"
                    />
                  </div>

                  {/* Photo & Voice Controls */}
                  <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
                    <label className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-xl cursor-pointer flex items-center gap-1.5 transition-colors">
                      <Camera className="w-3.5 h-3.5 text-amber-400" />
                      <span>📷 Add Photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                    </label>

                    <button
                      type="button"
                      onClick={toggleVoiceRecording}
                      className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition-colors ${
                        isRecording
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500 animate-pulse'
                          : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                      }`}
                    >
                      {isRecording ? <MicOff className="w-3.5 h-3.5 text-rose-400" /> : <Mic className="w-3.5 h-3.5 text-amber-400" />}
                      <span>🎙️ Voice</span>
                    </button>

                    {photoNote && (
                      <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                        {photoNote}
                      </span>
                    )}

                    {voiceTranscript && (
                      <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30 truncate max-w-xs">
                        🎙️ "{voiceTranscript}"
                      </span>
                    )}
                  </div>

                  {/* Quick Progressive Hint Trigger */}
                  {currentStop.hint && (
                    <div>
                      {hintLevel > 0 ? (
                        <div className="p-3 bg-slate-900 border border-amber-500/30 rounded-xl text-xs text-amber-200 font-mono space-y-1">
                          <strong className="text-amber-400 block text-[10px]">REVEALED HINT (LEVEL {hintLevel}/3):</strong>
                          <p>{(currentStop.hints && currentStop.hints[hintLevel - 1]) || currentStop.hint}</p>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setHintLevel(1)}
                          className="text-xs font-mono text-slate-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
                        >
                          <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                          <span>Need a field hint?</span>
                        </button>
                      )}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading || (!selectedOption && !userObservation.trim() && !voiceTranscript.trim())}
                    className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-40 text-slate-950 font-bold rounded-xl text-xs font-serif transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isLoading ? 'AI Analyzing Report...' : 'SEND OBSERVATION'}</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Fallback when no stops available */
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 text-center space-y-4 shadow-xl">
          <div className="w-12 h-12 bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded-2xl flex items-center justify-center mx-auto text-2xl font-bold">
            🔍
          </div>
          <div className="space-y-2 max-w-md mx-auto">
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-slate-100">
              No Exploration Stops Available
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 font-sans leading-relaxed">
              No physical stops were found for this hunt route. Try selecting another neighborhood or genre.
            </p>
          </div>
          <button
            onClick={onOpenGuide}
            className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs font-mono inline-flex items-center gap-2"
          >
            <Compass className="w-4 h-4" />
            <span>Ask Hunt Guide for Recommendations</span>
          </button>
        </div>
      )}

      {/* FEATURE UPGRADE: GOOGLE LENS VISUAL DISCOVERY MODAL */}
      {currentStop && (
        <GoogleLensDiscoveryModal
          isOpen={isLensModalOpen}
          onClose={() => setIsLensModalOpen(false)}
          hunt={hunt}
          currentStop={currentStop}
          onApplyVerifiedDiscovery={handleApplyVerifiedLensDiscovery}
        />
      )}
    </div>
  );
};
