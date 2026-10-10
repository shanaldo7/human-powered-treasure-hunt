/**
 * Discovery Engine Types & Normalized Record Schema
 * Continuous Data Intelligence Upgrade
 */

import { DiscoveryCategory } from './hunt';

export type NormalizedClaimType =
  | 'historical'
  | 'recently_published_article'
  | 'newly_reported_event'
  | 'recently_added_dataset_record'
  | 'recently_updated_location'
  | 'local_legend'
  | 'rumor_or_unverified';

export type SourceType =
  | 'web_search'
  | 'news_article'
  | 'official_dataset'
  | 'geographic_dataset'
  | 'cultural_archive'
  | 'environmental_dataset'
  | 'community_registry';

export type FreshnessStatus =
  | 'fresh'
  | 'recent'
  | 'historical_archive'
  | 'cached'
  | 'stale'
  | 'not_assessed';

export interface SourceEvidenceItem {
  type: 'quote' | 'fact' | 'citation' | 'record_id' | 'attribute' | 'coordinate';
  text: string;
  sourceUrl?: string;
  sourceName?: string;
}

export interface CandidateRankingScores {
  locationMatch: number;        // 0.0 - 1.0
  genreRelevance: number;       // 0.0 - 1.0
  sourceQuality: number;        // 0.0 - 1.0
  evidenceStrength: number;     // 0.0 - 1.0
  geographicCompleteness: number; // 0.0 - 1.0
  currentAccessSuitability: number; // 0.0 - 1.0
  recencyWeight: number;        // 0.0 - 1.0
  publicSafetyScore: number;    // 0.0 - 1.0
  compositeScore: number;       // 0.0 - 1.0
}

/**
 * Section 3: Normalized Discovery Record
 */
export interface NormalizedDiscoveryRecord {
  id: string; // Stable source-derived ID
  title: string;
  description: string;
  location_name: string;
  latitude: number | null;
  longitude: number | null;
  genre: string[];
  source_name: string;
  source_url: string;
  source_type: SourceType;
  published_at: string | null;
  retrieved_at: string;
  last_verified_at: string | null;
  dataset_last_updated_at?: string | null;
  claim_type: NormalizedClaimType;
  license: string | null;
  evidence: SourceEvidenceItem[];
  freshness_status: FreshnessStatus;

  // Extensible metadata
  address?: string | null;
  wikipedia_url?: string | null;
  wikidata_id?: string | null;
  osm_id?: string | null;
  osm_type?: string | null;
  heritage_designation?: string | null;
  tags?: Record<string, string>;
  scoring?: CandidateRankingScores;
  why_included?: string;
  is_cached?: boolean;
}

export interface SourceAdapterMetadata {
  id: string;
  name: string;
  type: SourceType;
  description: string;
  supportedGenres: string[];
  geographicCoverage?: string;
  attribution: string;
  license: string | null;
  rateLimitPerMinute: number;
  timeoutMs: number;
  isAvailable: boolean;
  requiresApiKey: boolean;
  isConfigured: boolean;
  lastSuccessfulSync: string | null;
  lastError: string | null;
  totalRecordsRetrieved: number;
  incrementalSyncSupported: boolean;
}

export interface DiscoveryEngineSearchParams {
  location: string;
  genre?: DiscoveryCategory | string;
  radiusMeters?: number;
  durationMinutes?: number;
  explorationMode?: 'walking' | 'biking' | 'transit' | 'casual';
  userCoordinates?: { latitude: number; longitude: number };
  timeFilter?: 'all' | '24h' | '7d' | '30d' | 'historical';
  forceFresh?: boolean;
  sourceFilters?: string[]; // IDs of specific adapters to enable/disable
}

export interface DiscoveryEngineResponse {
  location: string;
  genre: string;
  records: NormalizedDiscoveryRecord[];
  activeSources: SourceAdapterMetadata[];
  stats: {
    totalEvaluated: number;
    returned: number;
    sourceCount: number;
    durationMs: number;
    cachedCount: number;
    freshCount: number;
  };
  searchRadiusNote?: string;
  noMatchReason?: string;
}
