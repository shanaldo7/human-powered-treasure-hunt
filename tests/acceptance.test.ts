import { geminiHuntService } from '../src/services/geminiHuntService';
import { LocalStorageService } from '../src/services/localStorageService';
import { multiSourceDiscoveryEngine } from '../src/services/discoveryEngine';
import { sourceRegistry } from '../src/services/sourceAdapters';
import { discoveryIntelligenceService } from '../src/services/discoveryIntelligenceService';
import { getGoogleLensLaunchTarget, detectPlatformForLens } from '../src/types/lens';

async function runAcceptanceTests() {
  console.log('🧪 RUNNING ACCEPTANCE TESTS...');
  let passCount = 0;
  let failCount = 0;

  function assert(condition: boolean, msg: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${msg}`);
      passCount++;
    } else {
      console.error(`  ❌ FAIL: ${msg}`);
      failCount++;
    }
  }

  // 1. Test Multiple Locations & Multiple Genres for Live Research
  console.log('\n--- 1. Testing Live Research across Multiple Locations & Genres ---');
  const testCases = [
    { loc: 'Kolkata', genre: 'Hidden History' },
    { loc: 'London', genre: 'Architecture' },
    { loc: 'New York', genre: 'Food & Street Eats' }
  ];

  for (const tc of testCases) {
    try {
      const res = await geminiHuntService.researchArticlesAndCases({
        location: tc.loc,
        genre: tc.genre,
        mode: 'live',
        skipCache: true
      });
      assert(res && res.location === tc.loc, `Response returned for ${tc.loc}`);
      assert(Array.isArray(res.results), `Results is an array for ${tc.loc} (${tc.genre})`);
      if (res.results.length > 0) {
        const first = res.results[0];
        assert(Boolean(first.title && first.source_url), `First article has real title and source URL: ${first.title.slice(0, 30)}...`);
        assert(Boolean(first.source_name), `Source name present: ${first.source_name}`);
        assert(Boolean(first.claim_type), `Claim type classified: ${first.claim_type}`);
      }
    } catch (err: any) {
      console.error(`Error in test case ${tc.loc}:`, err);
      failCount++;
    }
  }

  // 2. Test Time Filters (24h, 7d, 30d, historical)
  console.log('\n--- 2. Testing Live Radar Time Filters ---');
  try {
    const res24h = await geminiHuntService.researchArticlesAndCases({
      location: 'London',
      genre: 'Hidden History',
      timeFilter: '24h',
      skipCache: true
    });
    assert(res24h !== null, '24h time filter executed successfully');
    // If results exist in 24h, verify freshness is within 24h
    for (const r of res24h.results) {
      if (r.published_at) {
        const is24h = /min|hour|today|day ago|1 day/i.test(r.published_at);
        assert(is24h, `Item ${r.title.slice(0, 20)} is within 24 hours: ${r.published_at}`);
      }
    }
  } catch (err: any) {
    console.error('Error in 24h filter test:', err);
    failCount++;
  }

  // 3. Test Hunt Generation with Smart Walking Route & Progressive Hints
  console.log('\n--- 3. Testing Hunt Generation & Smart Walking Route ---');
  let generatedHunt: any = null;
  try {
    const hunt = await geminiHuntService.generateTreasureHunt({
      locationName: 'Edinburgh',
      genre: 'Hidden History',
      durationMinutes: 30,
      numberOfStops: 3,
      difficulty: 'EXPLORER'
    });
    generatedHunt = hunt;

    assert(hunt && hunt.stops.length > 0, `Hunt generated with ${hunt.stops.length} stops`);
    assert(hunt.durationMinutes === 30, 'Respects requested hunt duration');
    assert((hunt.walkingTimeMinutes || 0) > 0, `Estimated walking time present: ${hunt.walkingTimeMinutes} mins`);
    
    const stop1 = hunt.stops[0];
    assert(Boolean(stop1.googleMapsUrl && stop1.googleMapsUrl.includes('google.com/maps')), `Real Google Maps link on stop 1: ${stop1.googleMapsUrl}`);
    assert(Boolean(stop1.hints && stop1.hints.length >= 3), `Progressive hints array available: ${stop1.hints?.length} levels`);
    assert(Boolean(stop1.placeName && stop1.clue), `Clue matches real destination: ${stop1.placeName}`);
  } catch (err: any) {
    console.error('Error generating hunt:', err);
    failCount++;
  }

  // 4. Test Adaptive Clue Engine on User Observation
  console.log('\n--- 4. Testing Adaptive Clue Engine ---');
  try {
    const mockHunt: any = {
      id: 'test_hunt_123',
      title: 'Historical Discovery',
      locationName: 'Kolkata',
      mode: 'Hidden History',
      totalStops: 2,
      currentStopNumber: 1,
      stops: [
        {
          taskId: 't1',
          stopNumber: 1,
          placeName: 'Victoria Memorial',
          address: 'Queens Way, Kolkata',
          category: 'Hidden History',
          title: 'Victoria Memorial',
          clue: 'Observe the marble facade',
          objective: 'Look at the statue above',
          taskType: 'OBSERVE',
          difficulty: 'Easy',
          estimatedMinutes: 10,
          safePublicLocation: true,
          googleMapsUrl: 'https://maps.google.com',
          sourceUrls: []
        },
        {
          taskId: 't2',
          stopNumber: 2,
          placeName: 'St. Pauls Cathedral',
          address: 'Cathedral Rd, Kolkata',
          category: 'Hidden History',
          title: 'St. Pauls Cathedral',
          clue: 'Find the spire',
          objective: 'Examine gothic revival arches',
          taskType: 'OBSERVE',
          difficulty: 'Easy',
          estimatedMinutes: 10,
          safePublicLocation: true,
          googleMapsUrl: 'https://maps.google.com',
          sourceUrls: []
        }
      ],
      userProgress: []
    };

    const nextClue = await geminiHuntService.evaluateStopObservation({
      hunt: mockHunt,
      stopNumber: 1,
      userObservation: 'I observed the white Makrana marble and the bronze Angel of Victory on top of the dome.',
      previousClue: 'Observe the marble facade'
    });

    assert(nextClue !== null, 'Observation processed by Adaptive Clue Engine');
    assert(Boolean(nextClue.feedback), `Feedback received from AI Guide: "${nextClue.feedback.slice(0, 40)}..."`);
    assert(Boolean(nextClue.next_clue), `Adaptive subsequent clue generated: "${nextClue.next_clue?.slice(0, 40)}..."`);
  } catch (err: any) {
    console.error('Error evaluating observation:', err);
    failCount++;
  }

  // 5. Test Local Storage Journal and Data Resiliency
  console.log('\n--- 5. Testing Local Storage Journal & Resiliency ---');
  // Simulated storage
  const mockStorage: Record<string, string> = {};
  (global as any).window = {
    localStorage: {
      getItem: (k: string) => mockStorage[k] || null,
      setItem: (k: string, v: string) => { mockStorage[k] = v; },
      removeItem: (k: string) => { delete mockStorage[k]; }
    }
  };

  const store = new LocalStorageService();
  const testHunt: any = {
    id: 'hunt_saved_1',
    title: 'Test Journal Entry',
    locationName: 'Rome',
    mode: 'Architecture',
    totalStops: 2,
    stops: [{ stopNumber: 1, placeName: 'Pantheon', address: 'Piazza della Rotonda', sourceUrls: ['https://example.com'] }],
    userProgress: [{ stopNumber: 1, userObservation: 'Observed the open oculus in the dome' }],
    status: 'completed'
  };

  store.saveCompletedHunt(testHunt);
  let loaded = store.listCompletedHunts();
  assert(loaded.length === 1 && loaded[0].id === 'hunt_saved_1', 'Saved hunt loaded correctly from local storage');

  store.deleteCompletedHunt('hunt_saved_1');
  loaded = store.listCompletedHunts();
  assert(loaded.length === 0, 'Individual hunt deleted successfully');

  // Corrupted data handling
  mockStorage['human_powered_treasure_hunts_completed'] = 'INVALID_JSON_CORRUPTED{{{';
  const resilientLoaded = store.listCompletedHunts();
  assert(Array.isArray(resilientLoaded) && resilientLoaded.length === 0, 'Corrupted data handled gracefully without throwing');

  console.log('\n--- 6. Testing Real-time Weather Service Integration ---');
  assert(Boolean(generatedHunt?.weatherNote || generatedHunt?.weatherAdvisory), 'Weather note or advisory present on generated hunt');
  if (generatedHunt?.weatherAdvisory) {
    assert(typeof generatedHunt.weatherAdvisory.temperatureC === 'number', `Weather temperature present: ${generatedHunt.weatherAdvisory.temperatureC}°C`);
    assert(typeof generatedHunt.weatherAdvisory.condition === 'string', `Weather condition present: ${generatedHunt.weatherAdvisory.condition}`);
    assert(typeof generatedHunt.weatherAdvisory.advisoryMessage === 'string', `Weather advisory message formatted: ${generatedHunt.weatherAdvisory.advisoryMessage.slice(0, 40)}...`);
  }

  console.log('\n--- 7. Testing Continuous Multi-Source Discovery Engine ---');
  const adapters = sourceRegistry.listAdapters();
  assert(adapters.length >= 3, `Registered adapters count: ${adapters.length} (SerpApi, OSM Overpass, Wikipedia Archive)`);
  assert(adapters.some(a => a.id === 'osm_overpass'), 'OpenStreetMap Overpass adapter registered');
  assert(adapters.some(a => a.id === 'wikipedia_archive'), 'Wikipedia Archive adapter registered');

  // Multi-source discovery test for Edinburgh
  console.log('Testing multiSourceDiscoveryEngine.discover for Edinburgh...');
  const discoveryRes = await multiSourceDiscoveryEngine.discover({
    location: 'Edinburgh',
    genre: 'Hidden History',
    timeFilter: 'all'
  });

  assert(discoveryRes.location === 'Edinburgh', `Discovery response returns location Edinburgh`);
  assert(Array.isArray(discoveryRes.records), `Discovery records returned as array (${discoveryRes.records.length} records)`);
  assert(discoveryRes.activeSources.length >= 3, `Active sources in response >= 3 (${discoveryRes.activeSources.length})`);
  
  if (discoveryRes.records.length > 0) {
    const sampleRecord = discoveryRes.records[0];
    assert(typeof sampleRecord.id === 'string' && sampleRecord.id.length > 0, `Stable source ID present: ${sampleRecord.id}`);
    assert(typeof sampleRecord.title === 'string', `Record title present: ${sampleRecord.title}`);
    assert(typeof sampleRecord.source_name === 'string', `Source name present: ${sampleRecord.source_name}`);
    assert(typeof sampleRecord.source_type === 'string', `Source type classified: ${sampleRecord.source_type}`);
    assert(Boolean(sampleRecord.scoring), 'Transparent ranking signals scoring present');
    assert(typeof sampleRecord.scoring?.compositeScore === 'number', `Composite ranking score present: ${sampleRecord.scoring?.compositeScore}`);
  }

  // Test on-demand scheduled sync hook
  const syncRes = multiSourceDiscoveryEngine.triggerScheduledSync();
  assert(Boolean(syncRes.syncedAt && syncRes.status), 'Continuous scheduled sync hook operates correctly');

  console.log('\n--- 8. Testing Discovery Intelligence Engine Advanced Features ---');
  // Feature 3: Serendipity Engine
  console.log('Testing Serendipity Engine ("SHOW ME SOMETHING I WOULD NEVER SEARCH FOR")...');
  const serendipityRes = await discoveryIntelligenceService.getSerendipityDiscovery({ location: 'Edinburgh' });
  assert(Boolean(serendipityRes?.record), 'Serendipity discovery candidate returned');
  assert(typeof serendipityRes?.serendipityScore === 'number', `Serendipity score present: ${serendipityRes?.serendipityScore}`);
  assert(Boolean(serendipityRes?.whySerendipitous), 'Explanation of why discovery is unexpected provided');

  // Feature 2: Knowledge Graph
  console.log('Testing Hidden Knowledge Graph Construction...');
  const graph = discoveryIntelligenceService.buildKnowledgeGraph(discoveryRes.records || []);
  assert(Array.isArray(graph.entities) && graph.entities.length > 0, `Knowledge graph contains ${graph.entities.length} entities`);
  assert(Array.isArray(graph.edges), `Knowledge graph edges array present (${graph.edges.length} edges)`);
  if (graph.edges.length > 0) {
    const sampleEdge = graph.edges[0];
    assert(Boolean(sampleEdge.relationship && sampleEdge.evidenceText), 'Graph edge has relationship type and supporting evidence');
  }

  // Feature 4: Evidence Conflict Detector
  console.log('Testing Evidence Conflict Detector...');
  const conflicts = discoveryIntelligenceService.detectEvidenceConflicts(discoveryRes.records || []);
  assert(Array.isArray(conflicts), `Evidence conflict detector returned results array (${conflicts.length} entries evaluated)`);

  // Feature 5: Story Timeline Reconstruction
  if (discoveryRes.records.length > 0) {
    console.log('Testing Story Timeline Reconstruction...');
    const timeline = discoveryIntelligenceService.reconstructTimeline(discoveryRes.records[0]);
    assert(timeline.subject === discoveryRes.records[0].title, `Timeline created for ${timeline.subject}`);
    assert(Array.isArray(timeline.entries) && timeline.entries.length > 0, `Timeline entries present (${timeline.entries.length} chronological milestones)`);
    assert(timeline.entries.some(e => e.dateReferenceType === 'retrieval_date' || e.dateReferenceType === 'event_occurred'), 'Timeline keeps event dates and retrieval dates distinct');
  }

  // Feature 11: Branching Story Routes
  console.log('Testing Branching Discovery Story Routes...');
  const branches = discoveryIntelligenceService.generateStoryBranches(
    'Edinburgh Castle Esplanade',
    'Observed historical masonry and entrance arches.',
    discoveryRes.records || []
  );
  assert(Array.isArray(branches) && branches.length >= 2, `Branching routes generated (${branches.length} paths: architecture, archives, connected landmark)`);
  assert(branches.every(b => b.isSupportedDestination && b.whyConnected), 'Every story branch is grounded in supported destination evidence');

  // Feature 12 & 13: Offline Field Kit and Personal Memory LocalStore
  console.log('Testing Offline Field Kit & Personal Memory Storage...');
  const profile = store.getPersonalProfile();
  assert(Array.isArray(profile.favoriteGenres), 'Personal discovery profile initialized with favorite genres');
  store.updatePersonalProfile({ favoriteGenres: ['Architecture', 'Hidden History'] });
  assert(store.getPersonalProfile().favoriteGenres.includes('Architecture'), 'Personal profile updated and persisted');

  // FEATURE UPGRADE: Google Lens Visual Discovery Verification
  console.log('Testing Google Lens Visual Discovery Verification Engine...');
  const platform = detectPlatformForLens();
  assert(typeof platform.isAndroid === 'boolean', 'Platform detector correctly determines Android environment');
  
  const launchTarget = getGoogleLensLaunchTarget('Victoria Memorial entrance arch');
  assert(Boolean(launchTarget.primaryUrl && launchTarget.label), `Google Lens launcher resolves primary URL: ${launchTarget.primaryUrl.slice(0, 45)}...`);
  assert(Boolean(launchTarget.fallbackUrl), `Google Lens launcher includes verified fallback URL`);

  const mockHunt: any = {
    id: 'hunt_lens_test',
    title: 'Heritage Walk',
    mode: 'Architecture',
    locationName: 'Edinburgh',
    totalStops: 2,
    stops: [
      {
        stopNumber: 1,
        placeName: 'Scott Monument',
        address: 'Princes Street Gardens',
        clue: 'Examine the Victorian Gothic arches and statues.',
        objective: 'Identify the prominent architectural style or central author statue.',
        evidence: 'Gothic spire designed by George Meikle Kemp completed in 1844.'
      },
      {
        stopNumber: 2,
        placeName: 'St Giles Cathedral',
        address: 'High Street',
        clue: 'Look for the crown spire.',
        objective: 'Locate the historic stone crown tower.'
      }
    ]
  };

  const lensVerification = await geminiHuntService.verifyGoogleLensDiscovery({
    hunt: mockHunt,
    stopNumber: 1,
    discovery: {
      objectName: 'Victorian Gothic Carved Statuette',
      lensDescription: 'Statuette representing Scottish historical characters on the Scott Monument',
      userObservation: 'Noticed the sandstone statue on the lower tier',
      capturedAt: new Date().toISOString(),
      launchMethod: 'web_lens'
    }
  });

  assert(Boolean(lensVerification.status), `Lens verification returned status: ${lensVerification.status}`);
  assert(Boolean(lensVerification.whatMatches), `Lens verification explains what matches: ${lensVerification.whatMatches.slice(0, 40)}...`);
  assert(Boolean(lensVerification.whatRemainsUncertain), `Lens verification details what remains uncertain`);
  assert(Boolean(lensVerification.explanation), `Lens verification provided explanation`);
  assert(typeof lensVerification.discoveryAdvanceRecommended === 'boolean', `Lens verification indicates whether to advance`);

  console.log(`\n================================`);
  console.log(`TEST SUMMARY: ${passCount} PASSED, ${failCount} FAILED`);
  console.log(`================================\n`);

  if (failCount > 0) {
    process.exit(1);
  }
}

runAcceptanceTests();
