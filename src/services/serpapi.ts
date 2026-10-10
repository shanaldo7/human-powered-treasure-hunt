export interface SerpApiResearchResult {
  query: string;
  source: string;
  title: string;
  snippet: string;
  url: string;
  date?: string;
  sourceDomain?: string;
  isRecent?: boolean;
}

// In-memory short session cache to avoid redundant calls while allowing rapid fresh exploration
const serpCache = new Map<string, { timestamp: number; results: SerpApiResearchResult[] }>();
const CACHE_TTL_MS = 8 * 60 * 1000; // 8 minutes short session cache

export async function searchEnvironmentalKnowledge(
  query: string,
  options?: { 
    recency?: 'hour' | 'day' | 'week' | 'month' | 'year' | 'any'; 
    num?: number;
    engine?: 'google' | 'google_news';
    skipCache?: boolean;
  }
): Promise<{ success: boolean; results: SerpApiResearchResult[]; message?: string }> {
  const apiKey = process.env.SERPAPI_KEY || process.env.SERPAPI_API_KEY;
  const recencyParam = options?.recency || 'any';
  const engine = options?.engine || 'google';
  const numResults = options?.num || 6;
  const normalizedKey = `${engine}_${query.trim().toLowerCase()}_${recencyParam}`;

  // Check short cache unless skipped
  if (!options?.skipCache) {
    const cached = serpCache.get(normalizedKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return {
        success: true,
        results: cached.results
      };
    }
  }

  if (!apiKey || apiKey.trim() === '') {
    return {
      success: false,
      results: [],
      message: 'SerpApi key unconfigured. Web research fallback is operating in optional mode.'
    };
  }

  try {
    let tbsQuery = '';
    if (recencyParam === 'hour') tbsQuery = '&tbs=qdr:h';
    else if (recencyParam === 'day') tbsQuery = '&tbs=qdr:d';
    else if (recencyParam === 'week') tbsQuery = '&tbs=qdr:w';
    else if (recencyParam === 'month') tbsQuery = '&tbs=qdr:m';
    else if (recencyParam === 'year') tbsQuery = '&tbs=qdr:y';

    const url = `https://serpapi.com/search.json?q=${encodeURIComponent(query)}&engine=${engine}&api_key=${apiKey}&num=${numResults}${tbsQuery}`;
    const response = await fetch(url, { signal: AbortSignal.timeout(18000) });

    if (!response.ok) {
      return {
        success: false,
        results: [],
        message: `SerpApi HTTP error: ${response.statusText}`
      };
    }

    const data = await response.json();
    
    // Support both Google Web search (organic_results) and Google News (news_results)
    const rawItems: any[] = engine === 'google_news'
      ? (data.news_results || data.organic_results || [])
      : (data.organic_results || data.news_results || []);

    const results: SerpApiResearchResult[] = rawItems.slice(0, numResults).map((item: any) => {
      const rawDate = item.date || item.published_date || (item.source?.posted_at) || undefined;
      const snippet = item.snippet || item.title || item.highlight || 'Live source reporting.';
      const link = item.link || item.url || '';
      
      // Determine source domain and publication name
      let domain = '';
      if (item.source && typeof item.source === 'string') {
        domain = item.source;
      } else if (item.source?.name) {
        domain = item.source.name;
      } else if (link) {
        try {
          const parsed = new URL(link);
          domain = parsed.hostname.replace(/^www\./, '');
        } catch (_e) {
          domain = item.displayed_link || 'Web Source';
        }
      } else {
        domain = 'Web Source';
      }

      // Check if genuinely recent based on SerpApi date or relative terms
      const isRecent = Boolean(
        rawDate && (
          /ago|hour|day|week|month|min/i.test(rawDate) ||
          /2026|2025/i.test(rawDate)
        )
      );

      return {
        query,
        source: domain ? `${domain}` : 'Google News/Search',
        title: item.title || 'Live Source Report',
        snippet,
        url: link,
        date: rawDate,
        sourceDomain: domain,
        isRecent
      };
    }).filter(r => Boolean(r.url && r.title));

    // Cache successful research
    if (results.length > 0) {
      serpCache.set(normalizedKey, { timestamp: Date.now(), results });
    }

    return {
      success: true,
      results
    };
  } catch (err: any) {
    console.log('[SERPAPI] External research note:', err?.message || 'timeout/network issue');
    return {
      success: false,
      results: [],
      message: 'Live research is temporarily unavailable.'
    };
  }
}
