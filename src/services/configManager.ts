export interface ServiceHealthStatus {
  service: string;
  provider: string;
  status: 'connected' | 'active' | 'available' | 'optional' | 'not_configured';
  model?: string;
  endpoint?: string;
  details: string;
  isOptional: boolean;
}

export interface AppConfig {
  ai: {
    apiKeyConfigured: boolean;
    model: string;
  };
  serpApi: {
    apiKeyConfigured: boolean;
  };
  maps: {
    apiKeyConfigured: boolean;
  };
  server: {
    port: number;
    env: string;
    appUrl: string;
  };
}

export function getServerConfig(): AppConfig {
  return {
    ai: {
      apiKeyConfigured: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== ''),
      model: process.env.GEMINI_MODEL || process.env.GEMMA_MODEL || 'gemini-3.8-flash'
    },
    serpApi: {
      apiKeyConfigured: Boolean(
        (process.env.SERPAPI_KEY && process.env.SERPAPI_KEY.trim() !== '') ||
        (process.env.SERPAPI_API_KEY && process.env.SERPAPI_API_KEY.trim() !== '')
      )
    },
    maps: {
      apiKeyConfigured: Boolean(
        (process.env.VITE_GOOGLE_MAPS_API_KEY && process.env.VITE_GOOGLE_MAPS_API_KEY.trim() !== '') ||
        (process.env.GOOGLE_MAPS_API_KEY && process.env.GOOGLE_MAPS_API_KEY.trim() !== '')
      )
    },
    server: {
      port: Number(process.env.PORT || 3000),
      env: process.env.NODE_ENV || 'development',
      appUrl: process.env.APP_URL || 'http://localhost:3000'
    }
  };
}

export function getServicesHealth(): Record<string, ServiceHealthStatus> {
  const cfg = getServerConfig();

  return {
    ai: {
      service: 'AI ENGINE',
      provider: 'Gemini',
      status: cfg.ai.apiKeyConfigured ? 'connected' : 'not_configured',
      model: cfg.ai.model,
      endpoint: 'generativelanguage.googleapis.com',
      details: cfg.ai.apiKeyConfigured
        ? 'Active for generating structured treasure hunts, adaptive clues, and Hunt Guide assistance.'
        : 'GEMINI_API_KEY unconfigured. Please configure GEMINI_API_KEY in .env.',
      isOptional: false
    },
    serpapi: {
      service: 'WEB RESEARCH',
      provider: 'SerpApi',
      status: cfg.serpApi.apiKeyConfigured ? 'connected' : 'optional',
      details: cfg.serpApi.apiKeyConfigured
        ? 'Used for factual landmark and public location grounding when requested.'
        : 'Optional research tool. Gemini creates treasure hunts directly.',
      isOptional: true
    },
    maps: {
      service: 'MAPS & NAVIGATION',
      provider: 'Google Maps Platform',
      status: 'available',
      details: 'Real Google Maps directions links & embedded navigation routes active.',
      isOptional: false
    },
    storage: {
      service: 'STORAGE',
      provider: 'Browser Local Storage',
      status: 'active',
      details: 'Local browser persistence. Keeps active hunts saved across page reloads.',
      isOptional: false
    }
  };
}
