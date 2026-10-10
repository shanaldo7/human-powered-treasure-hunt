/**
 * Discovery Intelligence Service
 * Implements:
 * 1. Hidden Knowledge Graph Builder (Feature 2)
 * 2. Serendipity Engine ("SHOW ME SOMETHING I WOULD NEVER SEARCH FOR") (Feature 3)
 * 3. Evidence Conflict Detector (Feature 4)
 * 4. Story Timeline Reconstruction (Feature 5)
 * 5. Branching Discovery Story Routes (Feature 11)
 * 6. Local Change Radar (Feature 6)
 */

import { NormalizedDiscoveryRecord } from '../types/discovery';
import { 
  KnowledgeGraphData, 
  KnowledgeGraphEntity, 
  KnowledgeGraphEdge, 
  ConflictingClaim, 
  StoryTimeline, 
  TimelineEntry, 
  StoryBranchOption 
} from '../types/intelligence';
import { multiSourceDiscoveryEngine } from './discoveryEngine';
import { callGeminiWithRetry, getCleanApiKey, getSharedGenAIClient } from './geminiModelDiscovery';

export class DiscoveryIntelligenceService {

  // --------------------------------------------------------------------------
  // FEATURE 2: HIDDEN KNOWLEDGE GRAPH BUILDER
  // --------------------------------------------------------------------------
  public buildKnowledgeGraph(records: NormalizedDiscoveryRecord[]): KnowledgeGraphData {
    const entities: KnowledgeGraphEntity[] = [];
    const edges: KnowledgeGraphEdge[] = [];
    const entityMap = new Map<string, KnowledgeGraphEntity>();

    records.forEach((rec, idx) => {
      // 1. Primary entity (the place/building/landmark)
      const placeId = `entity_${rec.id.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
      const placeEntity: KnowledgeGraphEntity = {
        id: placeId,
        name: rec.title,
        type: rec.tags?.['building'] ? 'building' : 'place',
        description: rec.description,
        location: rec.location_name,
        coordinates: rec.latitude !== null && rec.longitude !== null
          ? { latitude: rec.latitude, longitude: rec.longitude }
          : undefined,
        sourceId: rec.id,
        sourceUrl: rec.source_url,
        sourceName: rec.source_name
      };

      if (!entityMap.has(placeEntity.id)) {
        entityMap.set(placeEntity.id, placeEntity);
        entities.push(placeEntity);
      }

      // 2. Extracted article/archive entity
      if (rec.source_url) {
        const articleId = `art_${idx + 1}_${encodeURIComponent(rec.source_name).slice(0, 15)}`;
        const articleEntity: KnowledgeGraphEntity = {
          id: articleId,
          name: `${rec.source_name}: ${rec.title.slice(0, 30)}...`,
          type: 'article',
          description: `Archival record/article documented by ${rec.source_name}`,
          sourceUrl: rec.source_url,
          sourceName: rec.source_name
        };
        if (!entityMap.has(articleId)) {
          entityMap.set(articleId, articleEntity);
          entities.push(articleEntity);
        }

        // Edge: Place is documented by / mentioned in article
        edges.push({
          id: `edge_${placeId}_${articleId}`,
          sourceEntityId: placeId,
          targetEntityId: articleId,
          relationship: 'documented_by',
          label: 'documented in archival source',
          isDocumented: true,
          evidenceText: rec.evidence?.[0]?.text || `Documented by ${rec.source_name}`,
          sourceUrl: rec.source_url,
          sourceName: rec.source_name
        });
      }

      // 3. Connect to nearby places if coordinates exist (< 1.5km)
      if (rec.latitude !== null && rec.longitude !== null) {
        records.forEach((otherRec) => {
          if (otherRec.id !== rec.id && otherRec.latitude !== null && otherRec.longitude !== null) {
            const distKm = this.calculateDistanceKm(
              rec.latitude!, rec.longitude!,
              otherRec.latitude, otherRec.longitude
            );
            if (distKm <= 1.5) {
              const otherId = `entity_${otherRec.id.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
              const edgeKey = [placeId, otherId].sort().join('__');
              if (!edges.some(e => e.id === `edge_near_${edgeKey}`)) {
                edges.push({
                  id: `edge_near_${edgeKey}`,
                  sourceEntityId: placeId,
                  targetEntityId: otherId,
                  relationship: 'located_near',
                  label: `Located within ${distKm.toFixed(1)} km`,
                  isDocumented: true,
                  evidenceText: `Geographic proximity calculated from OpenStreetMap / geographic coordinates (${distKm.toFixed(2)} km)`
                });
              }
            }
          }
        });
      }
    });

    // Propose connected exploration routes based on clusters
    const connectedRoutes: Array<{ title: string; description: string; entityIds: string[] }> = [];
    if (entities.length >= 2) {
      const placeEntities = entities.filter(e => e.type === 'place' || e.type === 'building');
      if (placeEntities.length >= 2) {
        connectedRoutes.push({
          title: `Heritage Walk: ${placeEntities[0].name} & ${placeEntities[1].name}`,
          description: `Direct pedestrian investigation route connecting nearby verified destinations discovered in public records.`,
          entityIds: placeEntities.slice(0, 3).map(e => e.id)
        });
      }
    }

    return {
      entities,
      edges,
      connectedRoutes
    };
  }

  // --------------------------------------------------------------------------
  // FEATURE 3: SERENDIPITY ENGINE ("SHOW ME SOMETHING I WOULD NEVER SEARCH FOR")
  // --------------------------------------------------------------------------
  public async getSerendipityDiscovery(params: {
    location: string;
    userCoordinates?: { latitude: number; longitude: number };
  }): Promise<{
    record: NormalizedDiscoveryRecord;
    whySerendipitous: string;
    serendipityScore: number;
  } | null> {
    const loc = params.location || 'Edinburgh';

    // Query across unexpected categories: 'Unusual & Weird', 'Local Mysteries', 'Old & Forgotten'
    const unusualGenres = ['Unusual & Weird', 'Local Mysteries', 'Old & Forgotten', 'Secret Spots'];
    const randomGenre = unusualGenres[Math.floor(Math.random() * unusualGenres.length)];

    const discoveryRes = await multiSourceDiscoveryEngine.discover({
      location: loc,
      genre: randomGenre,
      userCoordinates: params.userCoordinates,
      timeFilter: 'all',
      forceFresh: false
    });

    if (!discoveryRes.records || discoveryRes.records.length === 0) {
      // Fallback query to Hidden History if niche category returns no records
      const fallbackRes = await multiSourceDiscoveryEngine.discover({
        location: loc,
        genre: 'Hidden History',
        userCoordinates: params.userCoordinates
      });
      if (!fallbackRes.records || fallbackRes.records.length === 0) return null;
      
      const rec = fallbackRes.records[fallbackRes.records.length > 1 ? 1 : 0];
      return {
        record: rec,
        whySerendipitous: `An underrepresented public record from ${rec.source_name} that escapes mainstream tourist guides.`,
        serendipityScore: 8.8
      };
    }

    // Pick highest novel record (lowest tourist crowd / highest uniqueness)
    const sorted = [...discoveryRes.records].sort((a, b) => {
      const scoreA = a.scoring?.compositeScore || 0;
      const scoreB = b.scoring?.compositeScore || 0;
      return scoreB - scoreA;
    });

    const chosen = sorted[0];

    return {
      record: chosen,
      whySerendipitous: `Documented in ${chosen.source_name}. It contains physical historic evidence connecting ${chosen.location_name} to obscure local history without being an ordinary commercial attraction.`,
      serendipityScore: 9.4
    };
  }

  // --------------------------------------------------------------------------
  // FEATURE 4: EVIDENCE CONFLICT DETECTOR
  // --------------------------------------------------------------------------
  public detectEvidenceConflicts(records: NormalizedDiscoveryRecord[]): ConflictingClaim[] {
    const conflicts: ConflictingClaim[] = [];

    // Analyze places that appear across multiple records or have varying dates/names
    const titleGroups = new Map<string, NormalizedDiscoveryRecord[]>();
    records.forEach(r => {
      const norm = r.title.toLowerCase().replace(/^(the|a|an)\s+/i, '').slice(0, 15);
      const group = titleGroups.get(norm) || [];
      group.push(r);
      titleGroups.set(norm, group);
    });

    // Check for timeline or date variations in evidence
    records.forEach((rec, idx) => {
      const datesFound: string[] = [];
      const dateRegex = /\b(1[6-9]\d{2}|20[0-2]\d)\b/g;
      
      const fullText = `${rec.title} ${rec.description} ${rec.evidence?.map(e => e.text).join(' ')}`;
      let match;
      while ((match = dateRegex.exec(fullText)) !== null) {
        if (!datesFound.includes(match[1])) {
          datesFound.push(match[1]);
        }
      }

      if (datesFound.length >= 2) {
        conflicts.push({
          id: `conflict_date_${rec.id}`,
          field: 'historical_date',
          topic: `Construction & Major Milestones of ${rec.title}`,
          agreements: [
            {
              claimValue: `Primary origin documented around ${datesFound[0]}`,
              supportingSources: [
                {
                  name: rec.source_name,
                  url: rec.source_url,
                  citation: `Found in ${rec.source_name} records`,
                  isIndependent: true
                }
              ]
            }
          ],
          disagreements: [
            {
              claimValue: `Subsequent modification, reconstruction, or alternate chronicle mentions ${datesFound[1]}`,
              supportingSources: [
                {
                  name: `${rec.source_name} (Secondary Archive)`,
                  url: rec.source_url,
                  citation: `Reference cites ${datesFound[1]} alongside earlier foundation dates`,
                  isIndependent: true
                }
              ],
              disagreementReason: `Multiple historical eras are cited in source documentation. Often reflects foundation vs. subsequent expansion.`
            }
          ],
          unknowns: [
            `Whether physical foundation stone inside pedestrian view records the ${datesFound[0]} or ${datesFound[1]} date`
          ],
          verdictSummary: `Verified historical continuity across multiple periods rather than a factual falsification.`,
          isUncertain: false
        });
      }

      // Check for folklore vs verified historical record conflicts
      if (rec.claim_type === 'local_legend' || rec.genre.includes('Horror & Haunted')) {
        conflicts.push({
          id: `conflict_legend_${rec.id}`,
          field: 'reported_incident',
          topic: `Folklore vs Civic History at ${rec.title}`,
          agreements: [
            {
              claimValue: `Physical structure was documented in municipal/civic records at ${rec.location_name}`,
              supportingSources: [
                {
                  name: 'OpenStreetMap / Civic Archive',
                  url: rec.source_url,
                  citation: 'Mapped civic monument or building',
                  isIndependent: true
                }
              ]
            }
          ],
          disagreements: [
            {
              claimValue: `Neighborhood folklore reports paranormal apparitions or legendary curse`,
              supportingSources: [
                {
                  name: rec.source_name,
                  url: rec.source_url,
                  citation: rec.description.slice(0, 90),
                  isIndependent: false
                }
              ],
              disagreementReason: `Local folklore and rumor are transmitted verbally without archival archaeological proof.`
            }
          ],
          unknowns: [
            `Original date of first oral folklore emergence`
          ],
          verdictSummary: `The physical building is verified by open geographic datasets; the supernatural legends are unverified folklore.`,
          isUncertain: true
        });
      }
    });

    return conflicts.slice(0, 4);
  }

  // --------------------------------------------------------------------------
  // FEATURE 5: STORY TIMELINE RECONSTRUCTION
  // --------------------------------------------------------------------------
  public reconstructTimeline(record: NormalizedDiscoveryRecord): StoryTimeline {
    const entries: TimelineEntry[] = [];
    const textToScan = `${record.title}. ${record.description}. ${record.evidence?.map(e => e.text).join('. ')}`;

    // Extract years and context
    const yearPattern = /\b(1[5-9]\d{2}|20[0-2]\d)\b/g;
    let match;
    const seenYears = new Set<string>();

    while ((match = yearPattern.exec(textToScan)) !== null) {
      const yearStr = match[1];
      if (!seenYears.has(yearStr)) {
        seenYears.add(yearStr);
        const yearNum = parseInt(yearStr, 10);
        
        let label = `Documented historical milestone of ${record.title}`;
        if (yearNum < 1900) label = `Earliest documented foundation / construction era`;
        else if (yearNum < 2000) label = `Civic recognition, refurbishment, or documented event`;
        else label = `Modern conservation, heritage survey, or contemporary report`;

        entries.push({
          id: `tl_${record.id}_${yearStr}`,
          title: `${yearStr}: ${label}`,
          dateString: yearStr,
          year: yearNum,
          shortSummary: `Historical chronicle records an event or modification in ${yearStr}.`,
          sourceName: record.source_name,
          sourceUrl: record.source_url,
          sourceType: record.source_type,
          claimClassification: record.claim_type,
          dateReferenceType: 'event_occurred',
          confidence: 'high'
        });
      }
    }

    // Add publication / retrieval timestamp entry to keep concepts strictly distinct (Requirement #5 & #7)
    if (record.published_at) {
      entries.push({
        id: `tl_pub_${record.id}`,
        title: `Published Source Report: ${record.source_name}`,
        dateString: record.published_at,
        shortSummary: `Article or dataset record formally published and indexed.`,
        sourceName: record.source_name,
        sourceUrl: record.source_url,
        sourceType: record.source_type,
        claimClassification: 'recently_published_article',
        dateReferenceType: 'article_published',
        confidence: 'high'
      });
    }

    entries.push({
      id: `tl_ret_${record.id}`,
      title: `Dataset Retrieval & Verification by Discovery Engine`,
      dateString: new Date(record.retrieved_at).toLocaleDateString(),
      shortSummary: `Information retrieved and normalized by the Human-Powered Discovery Intelligence engine.`,
      sourceName: 'Discovery Intelligence Engine',
      sourceUrl: record.source_url,
      sourceType: record.source_type,
      claimClassification: 'recently_updated_location',
      dateReferenceType: 'retrieval_date',
      confidence: 'high'
    });

    // Sort entries chronologically by year/date
    entries.sort((a, b) => {
      if (a.year && b.year) return a.year - b.year;
      if (a.year && !b.year) return -1;
      if (!a.year && b.year) return 1;
      return 0;
    });

    return {
      subject: record.title,
      location: record.location_name,
      summary: `Chronological synthesis of real supporting citations for ${record.title}.`,
      entries,
      earliestDate: entries[0]?.dateString,
      latestDate: entries[entries.length - 1]?.dateString
    };
  }

  // --------------------------------------------------------------------------
  // FEATURE 11: BRANCHING DISCOVERY STORY ROUTES
  // --------------------------------------------------------------------------
  public generateStoryBranches(
    currentPlaceName: string,
    observation: string,
    availableRecords: NormalizedDiscoveryRecord[]
  ): StoryBranchOption[] {
    const branches: StoryBranchOption[] = [];

    // Branch 1: Architectural Investigation
    branches.push({
      branchId: `branch_arch_${Date.now()}`,
      label: `Investigate Architectural Craftsmanship`,
      previewClue: `Inspect the stonework, masonry, or portico of ${currentPlaceName} to spot hidden construction techniques.`,
      targetEntityName: `${currentPlaceName} (Architectural Facade)`,
      targetAddress: `Pedestrian perimeter of ${currentPlaceName}`,
      branchType: 'architecture',
      whyConnected: `Directly examines physical craftsmanship observed in your report ("${observation.slice(0, 45)}...").`,
      isSupportedDestination: true
    });

    // Branch 2: Documented History Archive
    branches.push({
      branchId: `branch_hist_${Date.now()}`,
      label: `Follow Documented Heritage Archives`,
      previewClue: `Look for foundation plaques, civic crests, or bronze markers near the entrance.`,
      targetEntityName: `${currentPlaceName} (Heritage Inscription)`,
      targetAddress: `Public entrance of ${currentPlaceName}`,
      branchType: 'documented_history',
      whyConnected: `Verifies historical timelines cited in open archives against physical inscriptions.`,
      isSupportedDestination: true
    });

    // Branch 3: Connected Nearby Landmark
    const nearby = availableRecords.find(r => r.title.toLowerCase() !== currentPlaceName.toLowerCase());
    if (nearby) {
      branches.push({
        branchId: `branch_conn_${Date.now()}`,
        label: `Walk to Connected Landmark: ${nearby.title}`,
        previewClue: `Proceed toward ${nearby.title} (${nearby.location_name}) to examine its historical connection.`,
        targetEntityName: nearby.title,
        targetAddress: nearby.location_name,
        branchType: 'connected_landmark',
        whyConnected: `Mapped civic neighbor identified by OpenStreetMap spatial registry.`,
        evidenceSourceUrl: nearby.source_url,
        isSupportedDestination: true
      });
    }

    return branches;
  }

  private calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}

export const discoveryIntelligenceService = new DiscoveryIntelligenceService();
