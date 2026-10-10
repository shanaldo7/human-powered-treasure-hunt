/**
 * Discovery Engine Source Adapters and Registry
 * Extensible architecture: each adapter specifies metadata, query logic,
 * rate limits, licenses, provenance, and normalization.
 */

import { 
  NormalizedDiscoveryRecord, 
  SourceAdapterMetadata, 
  SourceType, 
  DiscoveryEngineSearchParams 
} from '../types/discovery';
import { searchEnvironmentalKnowledge } from './serpapi';
import { geocodeLocationToCoords, queryOverpassOsm, queryWikipediaGeosearch } from './openDatasetsClient';

export interface SourceAdapter {
  metadata: SourceAdapterMetadata;
  search(params: DiscoveryEngineSearchParams): Promise<NormalizedDiscoveryRecord[]>;
  testConnection?(): Promise<boolean>;
}

// -------------------------------------------------------------
// 1. Live Web Search & News Adapter (SerpApi)
// -------------------------------------------------------------
export class SerpApiSearchAdapter implements SourceAdapter {
  metadata: SourceAdapterMetadata = {
    id: 'serpapi_web_news',
    name: 'SerpApi Live Web & News Research',
    type: 'web_search',
    description: 'Real-time live Google Search and Google News articles, municipal news, and local reports.',
    supportedGenres: ['all'],
    attribution: 'Google Search & News index via SerpApi',
    license: 'Subject to original publishers’ copyright and licensing terms',
    rateLimitPerMinute: 60,
    timeoutMs: 15000,
    isAvailable: true,
    requiresApiKey: true,
    isConfigured: Boolean(process.env.SERPAPI_KEY || process.env.SERPAPI_API_KEY),
    lastSuccessfulSync: null,
    lastError: null,
    totalRecordsRetrieved: 0,
    incrementalSyncSupported: true
  };

  async search(params: DiscoveryEngineSearchParams): Promise<NormalizedDiscoveryRecord[]> {
    const loc = params.location;
    const genre = params.genre || 'Hidden History';
    const recency = params.timeFilter === '24h' ? 'day' : params.timeFilter === '7d' ? 'week' : params.timeFilter === '30d' ? 'month' : 'any';

    const queries = [
      `${loc} ${genre} places history news`,
      `"${loc}" ${genre} local discoveries`
    ];

    const records: NormalizedDiscoveryRecord[] = [];
    const retrievedAt = new Date().toISOString();

    for (const q of queries.slice(0, 2)) {
      try {
        const res = await searchEnvironmentalKnowledge(q, {
          recency,
          skipCache: params.forceFresh,
          num: 5
        });

        if (res.success && res.results.length > 0) {
          for (const item of res.results) {
            let claimType: any = 'recently_published_article';
            if (genre.toString().toLowerCase().includes('haunt') || genre.toString().toLowerCase().includes('horror')) {
              claimType = 'local_legend';
            } else if (item.isRecent) {
              claimType = 'newly_reported_event';
            } else if (recency === 'any') {
              claimType = 'historical';
            }

            // Freshness status
            let freshness: any = 'fresh';
            if (item.date) {
              if (/hour|min|today/i.test(item.date)) freshness = 'fresh';
              else if (/day|week/i.test(item.date)) freshness = 'recent';
              else freshness = 'historical_archive';
            }

            records.push({
              id: `serp-${encodeURIComponent(item.url)}`,
              title: item.title,
              description: item.snippet,
              location_name: loc,
              latitude: null,
              longitude: null,
              genre: [genre.toString()],
              source_name: item.source || 'Live Web Source',
              source_url: item.url,
              source_type: item.isRecent ? 'news_article' : 'web_search',
              published_at: item.date || null,
              retrieved_at: retrievedAt,
              last_verified_at: null,
              claim_type: claimType,
              license: 'Publisher copyright / Fair use excerpt',
              evidence: [
                {
                  type: 'quote',
                  text: item.snippet,
                  sourceUrl: item.url,
                  sourceName: item.source
                }
              ],
              freshness_status: freshness
            });
          }
          this.metadata.lastSuccessfulSync = retrievedAt;
          this.metadata.totalRecordsRetrieved += res.results.length;
        }
      } catch (err: any) {
        this.metadata.lastError = err?.message || 'Search failed';
      }
    }

    return records;
  }
}

// -------------------------------------------------------------
// 2. OpenStreetMap Overpass Geographic Dataset Adapter
// -------------------------------------------------------------
export class OpenStreetMapAdapter implements SourceAdapter {
  metadata: SourceAdapterMetadata = {
    id: 'osm_overpass',
    name: 'OpenStreetMap Civic Geography & Heritage Register',
    type: 'geographic_dataset',
    description: 'Open spatial database of documented public landmarks, heritage sites, memorials, and parks.',
    supportedGenres: ['Architecture', 'Hidden History', 'Nature & Wildlife', 'Horror & Haunted', 'Art & Culture'],
    attribution: '© OpenStreetMap contributors, ODbL 1.0',
    license: 'Open Data Commons Open Database License (ODbL)',
    rateLimitPerMinute: 30,
    timeoutMs: 10000,
    isAvailable: true,
    requiresApiKey: false,
    isConfigured: true,
    lastSuccessfulSync: null,
    lastError: null,
    totalRecordsRetrieved: 0,
    incrementalSyncSupported: false
  };

  async search(params: DiscoveryEngineSearchParams): Promise<NormalizedDiscoveryRecord[]> {
    let lat = params.userCoordinates?.latitude;
    let lon = params.userCoordinates?.longitude;

    if (!lat || !lon) {
      const geo = await geocodeLocationToCoords(params.location);
      if (geo) {
        lat = geo.lat;
        lon = geo.lon;
      }
    }

    if (!lat || !lon) return [];

    try {
      const records = await queryOverpassOsm(lat, lon, params.genre?.toString() || 'Hidden History', params.radiusMeters || 2500);
      if (records.length > 0) {
        this.metadata.lastSuccessfulSync = new Date().toISOString();
        this.metadata.totalRecordsRetrieved += records.length;
      }
      return records;
    } catch (err: any) {
      this.metadata.lastError = err?.message || 'OSM query failed';
      return [];
    }
  }
}

// -------------------------------------------------------------
// 3. Wikipedia & Wikimedia Cultural Archive Adapter
// -------------------------------------------------------------
export class WikipediaArchiveAdapter implements SourceAdapter {
  metadata: SourceAdapterMetadata = {
    id: 'wikipedia_archive',
    name: 'Wikipedia & Wikimedia Cultural Knowledge Base',
    type: 'cultural_archive',
    description: 'Documented historical biographies, civic landmarks, citations, and archival summaries.',
    supportedGenres: ['all'],
    attribution: 'Wikipedia and Wikimedia projects',
    license: 'CC BY-SA 4.0 International',
    rateLimitPerMinute: 60,
    timeoutMs: 8000,
    isAvailable: true,
    requiresApiKey: false,
    isConfigured: true,
    lastSuccessfulSync: null,
    lastError: null,
    totalRecordsRetrieved: 0,
    incrementalSyncSupported: false
  };

  async search(params: DiscoveryEngineSearchParams): Promise<NormalizedDiscoveryRecord[]> {
    let lat = params.userCoordinates?.latitude;
    let lon = params.userCoordinates?.longitude;

    if (!lat || !lon) {
      const geo = await geocodeLocationToCoords(params.location);
      if (geo) {
        lat = geo.lat;
        lon = geo.lon;
      }
    }

    if (!lat || !lon) return [];

    try {
      const records = await queryWikipediaGeosearch(lat, lon, params.genre?.toString() || 'Hidden History', params.radiusMeters || 3000);
      if (records.length > 0) {
        this.metadata.lastSuccessfulSync = new Date().toISOString();
        this.metadata.totalRecordsRetrieved += records.length;
      }
      return records;
    } catch (err: any) {
      this.metadata.lastError = err?.message || 'Wikipedia query failed';
      return [];
    }
  }
}

// -------------------------------------------------------------
// 4. Central Dataset Adapter Registry (Requirement #2)
// -------------------------------------------------------------
export class DiscoverySourceRegistry {
  private adapters: Map<string, SourceAdapter> = new Map();

  constructor() {
    this.register(new SerpApiSearchAdapter());
    this.register(new OpenStreetMapAdapter());
    this.register(new WikipediaArchiveAdapter());
  }

  public register(adapter: SourceAdapter): void {
    this.adapters.set(adapter.metadata.id, adapter);
  }

  public getAdapter(id: string): SourceAdapter | undefined {
    return this.adapters.get(id);
  }

  public listAdapters(): SourceAdapterMetadata[] {
    return Array.from(this.adapters.values()).map(a => a.metadata);
  }

  public getActiveAdapters(filters?: string[]): SourceAdapter[] {
    return Array.from(this.adapters.values()).filter(a => {
      if (!a.metadata.isAvailable) return false;
      if (filters && filters.length > 0) {
        return filters.includes(a.metadata.id);
      }
      return true;
    });
  }
}

export const sourceRegistry = new DiscoverySourceRegistry();
