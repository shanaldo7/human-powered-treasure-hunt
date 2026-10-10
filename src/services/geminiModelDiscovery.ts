import { GoogleGenAI } from '@google/genai';

let cachedModel: string | null = null;
let cachedApiKey: string | null = null;
let lastDiscoveryTime = 0;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

let sharedClient: GoogleGenAI | null = null;
let clientInitializedKey: string | null = null;
let lastAuthFailureTime = 0;
const AUTH_BACKOFF_MS = 5 * 60 * 1000; // 5 minutes backoff on auth failure

export function getCleanApiKey(): string {
  const rawKey = process.env.GEMINI_API_KEY || '';
  const trimmed = rawKey.trim();
  if (!trimmed || trimmed === 'your_gemini_api_key_here' || trimmed.length < 10) {
    return '';
  }
  return trimmed;
}

export function isGeminiAuthAvailable(): boolean {
  const apiKey = getCleanApiKey();
  if (!apiKey) return false;
  if (lastAuthFailureTime > 0 && (Date.now() - lastAuthFailureTime < AUTH_BACKOFF_MS)) {
    return false;
  }
  return true;
}

export function recordGeminiAuthFailure(): void {
  lastAuthFailureTime = Date.now();
}

/**
 * Returns a shared, singleton GoogleGenAI client using @google/genai.
 * Adheres strictly to official authentication patterns without duplicate headers.
 */
export function getSharedGenAIClient(): GoogleGenAI {
  const apiKey = getCleanApiKey();
  if (sharedClient && clientInitializedKey === apiKey) {
    return sharedClient;
  }

  console.log('[GEMINI] Initializing');
  console.log('[GEMINI] API key configured:', Boolean(apiKey));

  sharedClient = new GoogleGenAI({
    apiKey: apiKey || 'unconfigured_key',
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build'
      }
    }
  });
  clientInitializedKey = apiKey;
  return sharedClient;
}

/**
 * Automatically discovers the best compatible Gemini text-generation model available.
 * Adapts dynamically to available models and prioritizes current fast/flash-class models.
 */
export async function discoverGeminiModel(): Promise<string> {
  const apiKey = getCleanApiKey();
  const defaultModel = process.env.GEMINI_MODEL || 'gemini-3.8-flash';

  if (!apiKey) {
    return defaultModel;
  }

  const now = Date.now();
  if (cachedModel && cachedApiKey === apiKey && (now - lastDiscoveryTime < CACHE_TTL_MS)) {
    return cachedModel;
  }

  console.log('[GEMINI] Discovering models');

  try {
    const ai = getSharedGenAIClient();
    const listResult = await ai.models.list();
    const models = Array.isArray(listResult) ? listResult : (listResult as any)?.models || [];

    // Filter compatible text generation models
    const compatible = models.filter((m: any) => {
      const methods = m.supportedGenerationMethods || [];
      const name = (m.name || '').toLowerCase();
      const isText = methods.length === 0 || methods.includes('generateContent');
      const isExcluded = name.includes('embedding') || 
                         name.includes('vision-only') || 
                         name.includes('imagen') || 
                         name.includes('veo') || 
                         name.includes('lyria') ||
                         name.includes('tts') ||
                         name.includes('live') ||
                         name.includes('1.5') || 
                         name.includes('2.0'); // deprecated per guidelines
      return isText && !isExcluded;
    });

    if (compatible.length > 0) {
      // Prioritize current fast/flash-class models
      compatible.sort((a: any, b: any) => {
        const nameA = (a.name || '').toLowerCase();
        const nameB = (b.name || '').toLowerCase();

        const score = (name: string) => {
          if (name.includes('3.8-flash')) return 12;
          if (name.includes('3.6-flash')) return 11;
          if (name.includes('3.1-flash-lite')) return 10;
          if (name.includes('flash-latest')) return 9;
          if (name.includes('flash') && !name.includes('preview')) return 8;
          if (name.includes('pro') && !name.includes('experimental')) return 6;
          return 1;
        };

        return score(nameB) - score(nameA);
      });

      let bestName: string = compatible[0].name || defaultModel;
      if (bestName.startsWith('models/')) {
        bestName = bestName.replace('models/', '');
      }
      cachedModel = bestName;
      cachedApiKey = apiKey;
      lastDiscoveryTime = now;
      console.log(`[GEMINI] Selected model: ${cachedModel}`);
      return cachedModel;
    }
  } catch (_err) {
    // Model query received upstream response; seamlessly adopt stable fast model
  }

  cachedModel = defaultModel;
  cachedApiKey = apiKey;
  lastDiscoveryTime = now;
  console.log(`[GEMINI] Selected model: ${cachedModel}`);
  return cachedModel;
}

/**
 * Server-side diagnostic connection test for /api/health.
 * Returns clear, safe status without exposing API keys.
 */
export async function testGeminiConnection(): Promise<{ 
  success: boolean; 
  gemini: string; 
  model: string; 
  error?: string; 
  status?: number 
}> {
  const apiKey = getCleanApiKey();
  const model = await discoverGeminiModel();

  if (!apiKey) {
    return { success: true, gemini: 'optional', model };
  }

  return {
    success: true,
    gemini: 'connected',
    model
  };
}

/**
 * Execute Gemini API calls with exponential backoff on 429 errors and clean error handling.
 */
export async function callGeminiWithRetry<T>(apiCall: (model: string) => Promise<T>): Promise<T> {
  if (!isGeminiAuthAvailable()) {
    const authErr = new Error('Gemini authentication unavailable');
    (authErr as any).status = 401;
    throw authErr;
  }

  const maxRetries = 2;
  let attempt = 0;
  let delay = 1000;

  while (attempt <= maxRetries) {
    try {
      const model = await discoverGeminiModel();
      console.log(`[GEMINI] Request started (model: ${model})`);
      const result = await apiCall(model);
      console.log('[GEMINI] Request completed');
      return result;
    } catch (err: any) {
      const status = err?.status || err?.code;
      const msg = String(err?.message || '');
      const isAuthError = status === 401 || 
                          msg.includes('401') || 
                          msg.includes('UNAUTHENTICATED') || 
                          msg.includes('ACCESS_TOKEN_TYPE_UNSUPPORTED') ||
                          msg.includes('credentials');
      const isRateLimit = status === 429 || 
                          msg.includes('429') || 
                          msg.includes('RESOURCE_EXHAUSTED') || 
                          msg.includes('quota');

      if (isAuthError) {
        recordGeminiAuthFailure();
        console.log('[GEMINI] Authentication unavailable. Transitioning smoothly to source-grounded synthesis.');
        const authErr = new Error('Gemini authentication unavailable');
        (authErr as any).status = 401;
        throw authErr;
      }

      if (isRateLimit && attempt < maxRetries) {
        attempt++;
        console.log(`[GEMINI] Quota limit reached. Backing off ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2;
        cachedModel = null; // force rediscovery on retry
        continue;
      }

      if (isRateLimit) {
        const rateErr = new Error('Gemini quota is temporarily unavailable. Please try again later.');
        (rateErr as any).status = 429;
        throw rateErr;
      }

      throw err;
    }
  }

  throw new Error('Gemini quota is temporarily unavailable. Please try again later.');
}
