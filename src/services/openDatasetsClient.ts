/**
 * Open Datasets Client: Overpass API (OSM) & Wikimedia/Wikidata APIs
 * Real, un-fabricated public data queries for geographic & cultural heritage.
 */

import { NormalizedDiscoveryRecord, SourceEvidenceItem } from '../types/discovery';

// Helper for geocoding a location string to bounding box/center coords via Nominatim / Open-Meteo
export async function geocodeLocationToCoords(loc: string): Promise<{
  lat: number;
  lon: number;
  displayName: string;
  boundingBox?: [number, number, number, number]; // [minLat, maxLat, minLon, maxLon]
} | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(loc)}&format=json&limit=1`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'HumanPoweredTreasureHuntDiscoveryEngine/1.0 (educational-geo-tool)'
      },
      signal: AbortSignal.timeout(6000)
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      const item = data[0];
      const lat = parseFloat(item.lat);
      const lon = parseFloat(item.lon);
      const bb = item.boundingbox ? [
        parseFloat(item.boundingbox[0]),
        parseFloat(item.boundingbox[1]),
        parseFloat(item.boundingbox[2]),
        parseFloat(item.boundingbox[3])
      ] as [number, number, number, number] : undefined;
      return {
        lat,
        lon,
        displayName: item.display_name,
        boundingBox: bb
      };
    }
    return null;
  } catch (_e) {
    return null;
  }
}

/**
 * 1. OpenStreetMap Overpass API
 * Queries real mapped features: historic monuments, ruins, castles, heritage, memorials, gardens, public architecture
 */
export async function queryOverpassOsm(
  lat: number,
  lon: number,
  genre: string,
  radiusMeters: number = 2500
): Promise<NormalizedDiscoveryRecord[]> {
  try {
    // Map genre to Overpass tag filters
    let tagFilters = '["historic"]';
    if (genre.toLowerCase().includes('architecture')) {
      tagFilters = '["historic"]["building"]';
    } else if (genre.toLowerCase().includes('nature') || genre.toLowerCase().includes('wildlife')) {
      tagFilters = '["leisure"="park"]';
    } else if (genre.toLowerCase().includes('food') || genre.toLowerCase().includes('eat')) {
      tagFilters = '["amenity"="marketplace"]';
    } else if (genre.toLowerCase().includes('horror') || genre.toLowerCase().includes('haunt')) {
      tagFilters = '["historic"~"monument|memorial|castle|ruins|tomb|cemetery"]';
    } else if (genre.toLowerCase().includes('art') || genre.toLowerCase().includes('culture')) {
      tagFilters = '["tourism"~"artwork|gallery|museum"]';
    }

    const query = `
      [out:json][timeout:8];
      (
        nwr(around:${radiusMeters},${lat},${lon})${tagFilters}["name"];
      );
      out center 15;
    `;

    const res = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'HumanPoweredTreasureHuntDiscoveryEngine/1.0'
      },
      body: `data=${encodeURIComponent(query)}`,
      signal: AbortSignal.timeout(9000)
    });

    if (!res.ok) return [];
    const data = await res.json();
    if (!data.elements || !Array.isArray(data.elements)) return [];

    const retrievedAt = new Date().toISOString();
    const records: NormalizedDiscoveryRecord[] = [];

    for (const el of data.elements) {
      const tags = el.tags || {};
      const name = tags.name || tags['name:en'];
      if (!name) continue;

      const elementLat = el.lat ?? el.center?.lat ?? null;
      const elementLon = el.lon ?? el.center?.lon ?? null;

      const historicType = tags.historic || tags.tourism || tags.leisure || tags.amenity || 'landmark';
      const heritageDesignation = tags['heritage:operator'] || tags.heritage || tags['heritage:designation'] || null;
      const startYear = tags.start_date || tags['historic:civilization'] || null;

      const evidence: SourceEvidenceItem[] = [
        {
          type: 'attribute',
          text: `OSM Node/Way ${el.type}/${el.id} with classification: ${historicType}`
        }
      ];

      if (tags.description) {
        evidence.push({ type: 'quote', text: tags.description });
      }
      if (startYear) {
        evidence.push({ type: 'fact', text: `Documented construction or origin date: ${startYear}` });
      }

      records.push({
        id: `osm-${el.type}-${el.id}`,
        title: name,
        description: tags.description || `Registered ${historicType} in OpenStreetMap civic geographic dataset (${name}).`,
        location_name: tags['addr:city'] || tags['addr:suburb'] || `${lat.toFixed(4)}, ${lon.toFixed(4)}`,
        latitude: elementLat,
        longitude: elementLon,
        genre: [genre, 'geographic_dataset'],
        source_name: 'OpenStreetMap Overpass API',
        source_url: `https://www.openstreetmap.org/${el.type}/${el.id}`,
        source_type: 'geographic_dataset',
        published_at: null,
        retrieved_at: retrievedAt,
        last_verified_at: tags['check_date'] || null,
        dataset_last_updated_at: tags['timestamp'] || null,
        claim_type: 'historical',
        license: 'Open Data Commons Open Database License (ODbL) / OpenStreetMap contributors',
        evidence,
        freshness_status: 'recent',
        osm_id: String(el.id),
        osm_type: el.type,
        heritage_designation: heritageDesignation,
        tags
      });
    }

    return records;
  } catch (_e) {
    return [];
  }
}

/**
 * 2. Wikipedia & Wikimedia Geosearch API
 * Official open encyclopedia API providing source-grounded references and verified summaries.
 */
export async function queryWikipediaGeosearch(
  lat: number,
  lon: number,
  genre: string,
  radiusMeters: number = 3000
): Promise<NormalizedDiscoveryRecord[]> {
  try {
    const url = `https://en.wikipedia.org/w/api.php?action=query&list=geosearch&gscoord=${lat}|${lon}&gsradius=${radiusMeters}&gslimit=10&format=json&origin=*`;
    const res = await fetch(url, { signal: AbortSignal.timeout(7000) });
    if (!res.ok) return [];
    const data = await res.json();
    const geosearch = data.query?.geosearch;
    if (!Array.isArray(geosearch) || geosearch.length === 0) return [];

    // Fetch brief descriptions for these page IDs in parallel
    const pageIds = geosearch.map((item: any) => item.pageid).join('|');
    const extractUrl = `https://en.wikipedia.org/w/api.php?action=query&pageids=${pageIds}&prop=extracts|pageprops|info&exintro=1&explaintext=1&exchars=240&inprop=url&format=json&origin=*`;
    const extractRes = await fetch(extractUrl, { signal: AbortSignal.timeout(7000) });
    const extractData = extractRes.ok ? await extractRes.json() : {};
    const pages = extractData.query?.pages || {};

    const retrievedAt = new Date().toISOString();
    const records: NormalizedDiscoveryRecord[] = [];

    for (const item of geosearch) {
      const pageInfo = pages[item.pageid];
      const snippet = pageInfo?.extract || `Article on ${item.title} documented on Wikipedia.`;
      const fullUrl = pageInfo?.fullurl || `https://en.wikipedia.org/?curid=${item.pageid}`;
      const wikidataId = pageInfo?.pageprops?.wikibase_item || null;

      records.push({
        id: `wiki-page-${item.pageid}`,
        title: item.title,
        description: snippet,
        location_name: `${lat.toFixed(4)}, ${lon.toFixed(4)}`,
        latitude: item.lat ?? null,
        longitude: item.lon ?? null,
        genre: [genre, 'history'],
        source_name: 'Wikipedia & Wikimedia Open Knowledge API',
        source_url: fullUrl,
        source_type: 'cultural_archive',
        published_at: null,
        retrieved_at: retrievedAt,
        last_verified_at: pageInfo?.touched || null,
        dataset_last_updated_at: pageInfo?.touched || null,
        claim_type: 'historical',
        license: 'Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0)',
        evidence: [
          {
            type: 'citation',
            text: `Documented Wikipedia article (Page ID: ${item.pageid}): ${snippet}`,
            sourceUrl: fullUrl,
            sourceName: 'Wikipedia'
          }
        ],
        freshness_status: 'historical_archive',
        wikipedia_url: fullUrl,
        wikidata_id: wikidataId
      });
    }

    return records;
  } catch (_e) {
    return [];
  }
}
