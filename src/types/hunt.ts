export type DiscoveryCategory = 
  | 'Hidden History'
  | 'Architecture'
  | 'Art & Culture'
  | 'Nature & Wildlife'
  | 'Local Mysteries'
  | 'Literary Trail'
  | 'Horror & Haunted'
  | 'Food & Street Eats'
  | 'Photography'
  | 'Unusual & Weird'
  | 'Legends & Folklore'
  | 'Old & Forgotten'
  | 'Secret Spots'
  | 'Cinema & Pop Culture'
  | 'Religious & Spiritual Heritage'
  | 'Markets & Street Life'
  | 'Surprise'
  // Backward-compatibility aliases
  | 'History'
  | 'Culture'
  | 'Nature'
  | 'Local Stories'
  | 'Odd & Curious'
  | 'Literary';

export type SourceFactLabel = 
  | 'VERIFIED HISTORY'
  | 'LOCAL LEGEND'
  | 'REPORTED STORY'
  | 'FOLKLORE'
  | 'UNVERIFIED CLAIM'
  | 'CULINARY TRADITION'
  | 'ARCHITECTURAL RECORD';

export type ClaimType =
  | 'VERIFIED'
  | 'REPORTED'
  | 'HISTORICAL'
  | 'LOCAL LEGEND'
  | 'RUMOR'
  | 'UNVERIFIED'
  | 'verified'
  | 'reported'
  | 'historical'
  | 'local_legend'
  | 'rumor'
  | 'unverified';

export interface RealStoryArticle {
  title: string;
  summary: string;
  location: string;
  source_name: string;
  source_url: string;
  published_at?: string;
  freshness?: string;
  claim_type: 'verified' | 'reported' | 'historical' | 'local_legend' | 'rumor' | 'unverified';
  genre: string;
  relevance_score: number;
  source_count: number;
  supporting_sources?: Array<{ name: string; url: string; title: string }>;
  suggested_task?: {
    location_name: string;
    physical_action: string;
    question: string;
    is_safe: boolean;
  };
  rumor_reality?: {
    local_story: string;
    what_is_verified: string;
    what_is_not_verified: string;
    investigation_task: string;
  };
  why_this_story?: {
    location_match: 'Strong' | 'Moderate' | 'General';
    genre_match: 'Strong' | 'Moderate' | 'General';
    evidence_summary: string;
  };
}

export interface ResearchApiResponse {
  location: string;
  genre: string;
  mode: string;
  results: RealStoryArticle[];
  source_available: boolean;
  message?: string;
}

export type HuntDifficulty = 'CASUAL' | 'EXPLORER' | 'DETECTIVE';

export interface LiveRadarItem {
  id: string;
  placeName: string;
  address: string;
  genre: DiscoveryCategory;
  whyInteresting: string;
  recencyText: string;
  claimType: ClaimType | string;
  sourceTitle: string;
  sourceUrl: string;
  sourceDomain?: string;
  publishedDate?: string;
  distanceText?: string;
  evidence?: string;
  isRecent: boolean;
  googleMapsUrl: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface CuriousSpot {
  id: string;
  placeName: string;
  address: string;
  category: DiscoveryCategory;
  whyCurious: string;
  sourceTitle: string;
  sourceUrl: string;
  googleMapsUrl: string;
  distanceText?: string;
}

export interface NextClueEvaluation {
  isAccepted: boolean;
  feedback: string;
  next_clue?: string;
  objective?: string;
  safety_note?: string;
  reasoning_summary?: string;
  isHuntComplete: boolean;
  adapted_discovery?: DiscoveredPlace;
  discoveryChainLink?: {
    keywordFound: string;
    connectedPlaceName: string;
    connectionReason: string;
    sourceUrl?: string;
  };
}

export interface DiscoveryScoreBreakdown {
  interestingness: number; // 1-10
  uniqueness: number;      // 1-10
  history: number;         // 1-10
  accessibility: number;   // 1-10
  crowdLevel: number;      // 1-10 (higher = less crowded)
}

export interface DiscoveredPlace {
  id: string;
  placeName: string;
  address: string;
  category: DiscoveryCategory;
  whyGo: string;
  discoveryScore: number; // 1.0 - 10.0
  scoreBreakdown: DiscoveryScoreBreakdown;
  distanceText?: string;
  walkingTimeMinutes?: number;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  googleMapsUrl: string;
  sourceUrls: string[];
  verifiedHours?: string;
  safePublicLocation: boolean;
  sourceLabel?: SourceFactLabel;
  claimType?: string;
  evidence?: string;
  genreRelevanceScore?: number;
  sourceTitle?: string;
  sourceUrl?: string;
  isRecentReport?: boolean;
  publishedDate?: string;
  genreTag?: string;
}

export interface HuntTask {
  taskId: string;
  stopNumber: number;
  placeName: string;
  address: string;
  category: DiscoveryCategory;
  title: string;
  clue: string;
  objective: string;
  taskType: 'FIND' | 'OBSERVE' | 'LOOK FOR A DETAIL' | 'COMPARE' | 'HISTORY' | 'PHOTO OPTIONAL';
  question?: string;
  questionOptions?: string[];
  difficulty: 'Easy' | 'Medium' | 'Hard';
  estimatedMinutes: number;
  safePublicLocation: boolean;
  googleMapsUrl: string;
  sourceUrls: string[];
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  hint?: string;
  hints?: string[];
  sourceLabel?: SourceFactLabel;
  claimType?: string;
  evidence?: string;
  genreRelevanceScore?: number;
  sourceTitle?: string;
  sourceUrl?: string;
  isRecentReport?: boolean;
  genreTag?: string;
}

export interface UserStopProgress {
  stopNumber: number;
  completedAt?: string;
  userObservation?: string;
  photoNote?: string;
  voiceTranscript?: string;
  feedbackFromAI?: string;
  status: 'pending' | 'active' | 'completed' | 'skipped';
}

export interface ResearchedCandidate {
  name: string;
  address: string;
  location: string;
  source_url: string;
  source_title: string;
  published_date?: string;
  genre: string;
  claim_type: string;
  evidence: string;
  genre_relevance_score: number;
  isRecentReport?: boolean;
}

export interface TreasureHunt {
  id: string;
  title: string;
  mode: DiscoveryCategory;
  locationName: string;
  locationQuery: string;
  centerCoordinates?: {
    latitude: number;
    longitude: number;
  };
  durationMinutes: number; // 15, 30, 45, 60
  totalStops: number; // 2, 3, 5
  stops: HuntTask[];
  userProgress: UserStopProgress[];
  currentStopNumber: number;
  status: 'created' | 'active' | 'completed';
  createdAt: string;
  completedAt?: string;
  finalTreasureMessage: string;
  storyBehindThePlaces?: string;
  sourceUrls?: string[];
  isLiveMode?: boolean;
  relevanceScore?: number;
  noMatchFound?: boolean;
  noMatchMessage?: string;
  searchRadiusNote?: string;
  difficulty?: HuntDifficulty;
  walkingTimeMinutes?: number;
  explorationTimeMinutes?: number;
  totalEstimatedMinutes?: number;
  timeOfDay?: 'Morning' | 'Afternoon' | 'Evening' | 'Night';
  weatherNote?: string;
  weatherAdvisory?: {
    condition: string;
    temperatureC: number;
    temperatureF: number;
    isExtreme: boolean;
    extremeReason?: string;
    advisoryMessage: string;
    windSpeedKmh?: number;
    precipitationMm?: number;
  };
  rumorRealitySummary?: {
    factStatements: string[];
    legendStatements: string[];
    whyItMattered: string;
  };
  discoveryChainActive?: boolean;
}

export interface ServiceHealth {
  ai: {
    status: 'connected' | 'not_configured';
    model: string;
    details: string;
  };
  serpApi: {
    status: 'connected' | 'optional';
    details: string;
  };
  maps: {
    status: 'available' | 'configured';
    details: string;
  };
  location: {
    status: 'granted' | 'prompt' | 'denied';
    details: string;
  };
  storage: {
    status: 'active';
    details: string;
  };
}
