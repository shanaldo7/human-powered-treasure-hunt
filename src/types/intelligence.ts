/**
 * Types for Knowledge Graph, Evidence Conflict Detection, 
 * Timeline Reconstruction, Branching Story Routes, and Offline Field Kit.
 */

import { NormalizedDiscoveryRecord, SourceType, FreshnessStatus } from './discovery';
import { DiscoveryCategory } from './hunt';

// -------------------------------------------------------------
// FEATURE 2: Hidden Knowledge Graph Types
// -------------------------------------------------------------
export type EntityType = 
  | 'place'
  | 'building'
  | 'person'
  | 'event'
  | 'article'
  | 'legend'
  | 'museum_or_attraction';

export type RelationshipType =
  | 'located_near'
  | 'built_during'
  | 'associated_with'
  | 'mentioned_in'
  | 'documented_by'
  | 'historically_connected_to'
  | 'reportedly_associated_with';

export interface KnowledgeGraphEntity {
  id: string;
  name: string;
  type: EntityType;
  description: string;
  location?: string;
  coordinates?: { latitude: number; longitude: number };
  sourceId?: string;
  sourceUrl?: string;
  sourceName?: string;
}

export interface KnowledgeGraphEdge {
  id: string;
  sourceEntityId: string;
  targetEntityId: string;
  relationship: RelationshipType;
  label: string;
  isDocumented: boolean; // documented vs inferred
  evidenceText: string;
  sourceUrl?: string;
  sourceName?: string;
}

export interface KnowledgeGraphData {
  entities: KnowledgeGraphEntity[];
  edges: KnowledgeGraphEdge[];
  connectedRoutes?: Array<{
    title: string;
    description: string;
    entityIds: string[];
  }>;
}

// -------------------------------------------------------------
// FEATURE 4: Evidence Conflict Detector Types
// -------------------------------------------------------------
export type ConflictField = 
  | 'historical_date'
  | 'place_name'
  | 'address_or_location'
  | 'construction_period'
  | 'event_timeline'
  | 'reported_incident'
  | 'current_access';

export interface ConflictingClaim {
  id: string;
  field: ConflictField;
  topic: string;
  agreements: Array<{
    claimValue: string;
    supportingSources: Array<{ name: string; url: string; citation: string; isIndependent: boolean }>;
  }>;
  disagreements: Array<{
    claimValue: string;
    supportingSources: Array<{ name: string; url: string; citation: string; isIndependent: boolean }>;
    disagreementReason: string;
  }>;
  unknowns: string[];
  verdictSummary: string;
  isUncertain: boolean;
}

// -------------------------------------------------------------
// FEATURE 5: Story Timeline Reconstruction Types
// -------------------------------------------------------------
export interface TimelineEntry {
  id: string;
  title: string;
  dateString?: string;
  year?: number;
  shortSummary: string;
  sourceName: string;
  sourceUrl: string;
  sourceType: SourceType;
  claimClassification: string;
  dateReferenceType: 'event_occurred' | 'article_published' | 'dataset_updated' | 'retrieval_date';
  confidence: 'high' | 'moderate' | 'uncertain';
}

export interface StoryTimeline {
  subject: string;
  location: string;
  summary: string;
  entries: TimelineEntry[];
  earliestDate?: string;
  latestDate?: string;
}

// -------------------------------------------------------------
// FEATURE 11: Branching Discovery Stories
// -------------------------------------------------------------
export interface StoryBranchOption {
  branchId: string;
  label: string;
  previewClue: string;
  targetEntityName: string;
  targetAddress: string;
  branchType: 'architecture' | 'documented_history' | 'historical_event' | 'connected_landmark';
  whyConnected: string;
  evidenceSourceUrl?: string;
  isSupportedDestination: boolean;
}

export interface BranchingDecisionState {
  currentStopNumber: number;
  visitedPlaceName: string;
  userObservation: string;
  availableBranches: StoryBranchOption[];
  chosenBranchId?: string;
}

// -------------------------------------------------------------
// FEATURE 12: Offline Field Kit
// -------------------------------------------------------------
export interface OfflineFieldKitData {
  huntId: string;
  downloadedAt: string;
  huntTitle: string;
  locationName: string;
  clues: Array<{
    stopNumber: number;
    title: string;
    clue: string;
    objective: string;
    placeName: string;
    address: string;
    sourceUrls: string[];
  }>;
  savedObservations: Array<{
    stopNumber: number;
    observation: string;
    timestamp: string;
    syncStatus: 'saved_locally' | 'pending_sync' | 'synced';
  }>;
  isStale: boolean;
  offlineNotice: string;
}

// -------------------------------------------------------------
// FEATURE 13: Personal Discovery Memory
// -------------------------------------------------------------
export interface PersonalDiscoveryProfile {
  favoriteGenres: DiscoveryCategory[];
  savedPlaceIds: string[];
  previouslySeenDiscoveries: string[]; // IDs/names to avoid repetition
  completedHuntCount: number;
  preferredDurationMinutes: number;
  feedbackRecords: Array<{
    discoveryId: string;
    liked: boolean;
    timestamp: string;
  }>;
}
