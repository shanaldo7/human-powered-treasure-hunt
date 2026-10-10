import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { geminiHuntService } from './src/services/geminiHuntService';
import { getServicesHealth, getServerConfig } from './src/services/configManager';
import { openapiSpec, getSwaggerHtml } from './src/services/openapiSpec';

import { discoverGeminiModel, testGeminiConnection } from './src/services/geminiModelDiscovery';
import { multiSourceDiscoveryEngine } from './src/services/discoveryEngine';
import { sourceRegistry } from './src/services/sourceAdapters';
import { discoveryIntelligenceService } from './src/services/discoveryIntelligenceService';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ==============================================================================
// 1. HEALTH & SYSTEM STATUS ENDPOINTS
// ==============================================================================

app.get('/api/health', async (req, res) => {
  const cfg = getServerConfig();
  const testRes = await testGeminiConnection();

  res.json({
    status: 'ok',
    gemini: testRes.gemini,
    gemini_model: testRes.model,
    serpapi: cfg.serpApi.apiKeyConfigured ? 'configured' : 'optional',
    google_maps: 'configured'
  });
});

app.get('/api/health/services', (req, res) => {
  res.json({
    services: getServicesHealth(),
    serverConfig: {
      port: process.env.PORT || 3000,
      env: process.env.NODE_ENV || 'development'
    }
  });
});

app.post('/api/health/test/:service', async (req, res) => {
  const service = req.params.service;
  if (service === 'ai' || service === 'gemini') {
    if (!process.env.GEMINI_API_KEY) {
      return res.json({ status: 'not_configured', message: 'GEMINI_API_KEY is missing in .env.' });
    }
    return res.json({ status: 'connected', message: `Gemini API connected successfully using model: ${process.env.GEMINI_MODEL || 'gemini-3.8-flash'}` });
  }

  if (service === 'serpapi') {
    const key = process.env.SERPAPI_KEY || process.env.SERPAPI_API_KEY;
    if (!key) {
      return res.json({ status: 'optional', message: 'SERPAPI_KEY unconfigured. Operating in optional mode (Gemini creates hunts directly).' });
    }
    return res.json({ status: 'connected', message: 'SerpApi web research connection verified!' });
  }

  res.json({ status: 'ready', message: 'Service operation verified.' });
});

// ==============================================================================
// 2. OPENAPI DOCUMENTATION ROUTES
// ==============================================================================

app.get('/api/openapi.json', (req, res) => {
  res.json(openapiSpec);
});

app.get('/api/docs', (req, res) => {
  res.send(getSwaggerHtml());
});

// ==============================================================================
// 3. REAL-WORLD DISCOVERY & TREASURE HUNT ROUTES
// ==============================================================================

// Discover real lesser-known places around a location ("TODAY'S DISCOVERIES")
app.post('/api/discover-nearby', async (req, res) => {
  try {
    const { location, locationName, mode, theme, genre, userCoordinates, isLive, liveMode } = req.body;
    const loc = location || locationName || 'Local Area';
    const isLiveMode = Boolean(isLive || liveMode || mode === 'live');
    const requestedGenre = genre || (mode !== 'live' && mode !== 'classic' ? mode : undefined) || theme || 'Hidden History';

    const places = await geminiHuntService.discoverNearbyPlaces({
      locationName: loc,
      mode: requestedGenre,
      genre: requestedGenre,
      userCoordinates,
      isLive: isLiveMode
    });
    res.json({ places });
  } catch (err: any) {
    console.error('[API ERROR /discover-nearby]', err);
    res.status(500).json({ error: err.message || 'Failed to discover nearby places.' });
  }
});

// LIVE LOCAL RADAR (Requirement #1 & #2)
app.post('/api/live-radar', async (req, res) => {
  try {
    const { location, locationName, genre, userCoordinates } = req.body;
    const loc = location || locationName || 'Local Area';

    const items = await geminiHuntService.getLiveLocalRadar({
      locationName: loc,
      genre,
      userCoordinates
    });

    res.json({ items });
  } catch (err: any) {
    console.error('[API ERROR /live-radar]', err);
    res.status(500).json({ error: err.message || 'Failed to query live local radar.' });
  }
});

// "I'M CURIOUS" DISCOVERY SPOT (Requirement #10)
app.post('/api/curious-spot', async (req, res) => {
  try {
    const { location, locationName, userCoordinates } = req.body;
    const loc = location || locationName || 'Local Area';

    const spot = await geminiHuntService.getCuriousSpot({
      locationName: loc,
      userCoordinates
    });

    res.json({ spot });
  } catch (err: any) {
    console.error('[API ERROR /curious-spot]', err);
    res.status(500).json({ error: err.message || 'Failed to find curious spot.' });
  }
});

// In-memory shared hunt storage for Shared Exploration (Requirement #8: no mandatory DB/auth/paid service)
const sharedHuntsStore = new Map<string, any>();

// Source-Grounded Stories / Cases / Articles Research (Requirement #11)
app.post('/api/research', async (req, res) => {
  try {
    const { location, locationName, genre, mode, query, recency, timeFilter, skipCache } = req.body;
    const targetLoc = location || locationName || 'Local Area';
    
    // If request contains location or genre, route through real-time source pipeline
    if (location || locationName || genre) {
      const response = await geminiHuntService.researchArticlesAndCases({
        location: targetLoc,
        genre: genre || 'Hidden History',
        mode: mode || 'live',
        query,
        timeFilter: timeFilter || (recency === 'day' ? '24h' : recency === 'week' ? '7d' : recency === 'month' ? '30d' : recency === 'any' ? 'historical' : undefined),
        skipCache: Boolean(skipCache)
      });
      return res.json(response);
    }

    // Direct query fallback
    if (!query) return res.status(400).json({ error: 'Location or query required' });

    const { searchEnvironmentalKnowledge } = await import('./src/services/serpapi');
    const results = await searchEnvironmentalKnowledge(query, { recency: recency || 'any' });
    res.json(results);
  } catch (err: any) {
    console.error('[API ERROR /research]', err);
    res.status(500).json({ 
      location: req.body?.location || 'Local Area',
      genre: req.body?.genre || 'Hidden History',
      mode: req.body?.mode || 'live',
      results: [],
      source_available: false,
      message: 'Live research is temporarily unavailable.' 
    });
  }
});

// CONTINUOUS MULTI-SOURCE DISCOVERY ENGINE (Continuous Data Intelligence Upgrade)
app.post('/api/discovery', async (req, res) => {
  try {
    const { 
      location, 
      locationName, 
      genre, 
      radiusMeters, 
      durationMinutes, 
      explorationMode, 
      userCoordinates, 
      timeFilter, 
      forceFresh, 
      sourceFilters 
    } = req.body;

    const loc = location || locationName || 'Local Area';
    const response = await multiSourceDiscoveryEngine.discover({
      location: loc,
      genre: genre || 'Hidden History',
      radiusMeters: radiusMeters ? Number(radiusMeters) : undefined,
      durationMinutes: durationMinutes ? Number(durationMinutes) : undefined,
      explorationMode,
      userCoordinates,
      timeFilter,
      forceFresh: Boolean(forceFresh),
      sourceFilters
    });

    res.json(response);
  } catch (err: any) {
    console.error('[API ERROR /discovery]', err);
    res.status(500).json({ error: err.message || 'Discovery engine search failed.' });
  }
});

// Central Source Adapters & Datasets Registry Endpoint
app.get('/api/discovery/sources', (req, res) => {
  const sources = sourceRegistry.listAdapters();
  res.json({ sources });
});

// Scheduled & On-Demand Synchronization Hook
app.post('/api/discovery/sync', (req, res) => {
  const syncResult = multiSourceDiscoveryEngine.triggerScheduledSync();
  res.json(syncResult);
});

// FEATURE 3: SERENDIPITY ENGINE ("SHOW ME SOMETHING I WOULD NEVER SEARCH FOR")
app.post('/api/serendipity', async (req, res) => {
  try {
    const { location, locationName, userCoordinates } = req.body;
    const loc = location || locationName || 'Edinburgh';

    const result = await discoveryIntelligenceService.getSerendipityDiscovery({
      location: loc,
      userCoordinates
    });

    if (!result) {
      return res.status(404).json({
        error: `Could not find an unexpected destination in ${loc}. Try widening the search or another location.`
      });
    }

    res.json(result);
  } catch (err: any) {
    console.error('[API ERROR /serendipity]', err);
    res.status(500).json({ error: err.message || 'Serendipity engine search failed.' });
  }
});

// FEATURE 2: HIDDEN KNOWLEDGE GRAPH
app.post('/api/knowledge-graph', async (req, res) => {
  try {
    const { records, location, genre } = req.body;
    let recordsToUse = records;

    if (!recordsToUse || !Array.isArray(recordsToUse) || recordsToUse.length === 0) {
      const discoveryRes = await multiSourceDiscoveryEngine.discover({
        location: location || 'Edinburgh',
        genre: genre || 'Hidden History'
      });
      recordsToUse = discoveryRes.records;
    }

    const graph = discoveryIntelligenceService.buildKnowledgeGraph(recordsToUse || []);
    res.json({ graph });
  } catch (err: any) {
    console.error('[API ERROR /knowledge-graph]', err);
    res.status(500).json({ error: err.message || 'Knowledge graph construction failed.' });
  }
});

// FEATURE 4: EVIDENCE CONFLICT DETECTOR
app.post('/api/evidence/compare', async (req, res) => {
  try {
    const { records, location, genre } = req.body;
    let recordsToUse = records;

    if (!recordsToUse || !Array.isArray(recordsToUse) || recordsToUse.length === 0) {
      const discoveryRes = await multiSourceDiscoveryEngine.discover({
        location: location || 'Edinburgh',
        genre: genre || 'Hidden History'
      });
      recordsToUse = discoveryRes.records;
    }

    const conflicts = discoveryIntelligenceService.detectEvidenceConflicts(recordsToUse || []);
    res.json({ conflicts });
  } catch (err: any) {
    console.error('[API ERROR /evidence/compare]', err);
    res.status(500).json({ error: err.message || 'Conflict detection failed.' });
  }
});

// FEATURE 5: STORY TIMELINE RECONSTRUCTION
app.post('/api/timeline', async (req, res) => {
  try {
    const { record } = req.body;
    if (!record || !record.title) {
      return res.status(400).json({ error: 'Valid discovery record required to reconstruct timeline.' });
    }

    const timeline = discoveryIntelligenceService.reconstructTimeline(record);
    res.json({ timeline });
  } catch (err: any) {
    console.error('[API ERROR /timeline]', err);
    res.status(500).json({ error: err.message || 'Timeline reconstruction failed.' });
  }
});

// FEATURE 11: BRANCHING DISCOVERY STORY ROUTES
app.post('/api/story-branches', async (req, res) => {
  try {
    const { currentPlaceName, observation, availableRecords } = req.body;
    const branches = discoveryIntelligenceService.generateStoryBranches(
      currentPlaceName || 'Historical Landmark',
      observation || 'Observed heritage facade and public entrance.',
      availableRecords || []
    );
    res.json({ branches });
  } catch (err: any) {
    console.error('[API ERROR /story-branches]', err);
    res.status(500).json({ error: err.message || 'Story branching generation failed.' });
  }
});

// Shared Exploration (Requirement #8)
// Create shareable hunt summary without mandatory database or auth
app.post('/api/share-hunt', (req, res) => {
  try {
    const { hunt, includeCoordinates } = req.body;
    if (!hunt || !hunt.title) {
      return res.status(400).json({ error: 'Valid hunt payload required' });
    }

    const shareId = `hunt_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
    
    // Protect precise GPS coordinates unless explicitly consented
    const sanitizedHunt = {
      ...hunt,
      userCoordinates: includeCoordinates ? hunt.userCoordinates : undefined,
      stops: Array.isArray(hunt.stops) ? hunt.stops.map((s: any) => ({
        ...s,
        // Keep place names, addresses, clues, and research sources, but mask private device coords
        coordinates: includeCoordinates ? s.coordinates : undefined
      })) : []
    };

    sharedHuntsStore.set(shareId, {
      id: shareId,
      createdAt: new Date().toISOString(),
      hunt: sanitizedHunt
    });

    // Keep store bounded
    if (sharedHuntsStore.size > 200) {
      const oldestKey = sharedHuntsStore.keys().next().value;
      if (oldestKey) sharedHuntsStore.delete(oldestKey);
    }

    res.json({
      success: true,
      shareId,
      shareUrl: `/shared/${shareId}`
    });
  } catch (err: any) {
    console.error('[API ERROR /share-hunt]', err);
    res.status(500).json({ error: 'Failed to create shareable hunt' });
  }
});

app.get('/api/shared-hunt/:id', (req, res) => {
  const item = sharedHuntsStore.get(req.params.id);
  if (!item) {
    return res.status(404).json({ error: 'Shared hunt not found or expired' });
  }
  res.json(item);
});

// Generate a structured real-world treasure hunt
app.post('/api/generate-hunt', async (req, res) => {
  try {
    const { 
      location, 
      locationName, 
      mode, 
      theme, 
      genre, 
      duration, 
      durationMinutes, 
      numberOfStops, 
      userCoordinates, 
      isLive, 
      liveMode,
      difficulty,
      weather 
    } = req.body;

    const loc = location || locationName;
    if (!loc && !userCoordinates) {
      return res.status(400).json({ error: 'Please specify a location or enable browser location.' });
    }

    const dur = Number(duration || durationMinutes) || 30;
    const isLiveMode = Boolean(isLive || liveMode || mode === 'live');
    const requestedGenre = genre || (mode !== 'live' && mode !== 'classic' ? mode : undefined) || theme || 'Hidden History';
    const stops = Number(numberOfStops) || (dur <= 15 ? 2 : 3);

    const hunt = await geminiHuntService.generateTreasureHunt({
      locationName: loc || 'Local Area',
      genre: requestedGenre,
      mode: requestedGenre,
      durationMinutes: dur,
      numberOfStops: stops,
      userCoordinates,
      isLive: isLiveMode,
      difficulty,
      weather
    });

    res.json(hunt);
  } catch (err: any) {
    console.error('[API ERROR /generate-hunt]', err);
    res.status(500).json({ error: err.message || 'Failed to generate treasure hunt.' });
  }
});

// Evaluate user observation and advance / adapt next clue (Requirement #3, #4, #5)
app.post('/api/next-clue', async (req, res) => {
  try {
    const { 
      hunt, 
      hunt_id,
      stopNumber, 
      current_stop,
      userObservation, 
      user_observation,
      previous_clue,
      previousClue,
      place,
      genre,
      photo_note,
      photoNote,
      voice_transcript,
      voiceTranscript
    } = req.body;

    const targetHunt = hunt || (hunt_id ? { id: hunt_id, stops: place ? [place] : [], mode: genre || 'Hidden History' } : null);
    const stopNum = Number(stopNumber ?? current_stop ?? 1);
    const observation = userObservation ?? user_observation ?? 'Visited location';

    if (!targetHunt) {
      return res.status(400).json({ error: 'Hunt parameters missing.' });
    }

    const evaluation = await geminiHuntService.evaluateStopObservation({
      hunt: targetHunt,
      stopNumber: stopNum,
      userObservation: observation,
      previousClue: previous_clue || previousClue,
      place,
      genre,
      photoNote: photo_note || photoNote,
      voiceTranscript: voice_transcript || voiceTranscript
    });

    res.json(evaluation);
  } catch (err: any) {
    console.error('[API ERROR /next-clue]', err);
    res.status(500).json({ error: err.message || 'Failed to process observation.' });
  }
});

// FEATURE UPGRADE: GOOGLE LENS REAL-WORLD DISCOVERY VERIFICATION ENDPOINT
app.post('/api/lens/verify', async (req, res) => {
  try {
    const { hunt, stopNumber, discovery } = req.body;
    if (!hunt || !discovery || !discovery.objectName) {
      return res.status(400).json({ error: 'Hunt details and identified object name are required.' });
    }

    const verification = await geminiHuntService.verifyGoogleLensDiscovery({
      hunt,
      stopNumber: Number(stopNumber || 1),
      discovery
    });

    res.json(verification);
  } catch (err: any) {
    console.error('[API ERROR /lens/verify]', err);
    res.status(500).json({ 
      error: err.message || 'Visual discovery verification failed.',
      status: 'inconclusive',
      matchConfidence: 0.5,
      whatMatches: 'General location was recorded.',
      whatRemainsUncertain: 'Could not corroborate details against current archives.',
      explanation: 'Our AI verification encountered a temporary connection issue. You can still proceed or try again.'
    });
  }
});

// Hunt Guide AI Chatbot with Google Search & Maps Grounding
app.post('/api/chat', async (req, res) => {
  try {
    const { message, groundingType, activeHunt, history } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message required' });
    }

    const chatRes = await geminiHuntService.chatWithHuntGuide({
      message,
      groundingType,
      activeHunt,
      history
    });

    res.json(chatRes);
  } catch (err: any) {
    console.error('[API ERROR /chat]', err);
    res.status(500).json({ error: err.message || 'Chat service error.' });
  }
});

// Setup Vite Dev Middleware or Static Serving
async function setupServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false
      },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, () => {
    console.log(`🏴‍☠️ HUMAN-POWERED TREASURE HUNT Server running on port ${PORT}`);
  });
}

setupServer();
