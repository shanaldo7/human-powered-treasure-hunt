/**
 * Google Lens Integration Types & Utilities
 * FEATURE UPGRADE: GOOGLE LENS-POWERED REAL-WORLD DISCOVERY
 */

export type LensLaunchStatus = 
  | 'ready'
  | 'launching'
  | 'opened'
  | 'waiting_return'
  | 'checking'
  | 'confirmed'
  | 'partially_supported'
  | 'inconclusive';

export interface GoogleLensDiscoveryResult {
  objectName: string;
  lensDescription: string;
  userObservation?: string;
  capturedAt: string;
  launchMethod: 'android_intent' | 'app_deep_link' | 'web_lens' | 'fallback_search' | 'manual';
}

export interface LensVerificationAnalysis {
  status: 'confirmed' | 'partially_supported' | 'inconclusive';
  matchConfidence: number; // 0 to 1
  whatMatches: string;
  whatRemainsUncertain: string;
  neededEvidence?: string;
  explanation: string;
  historicalConnection?: string;
  discoveryAdvanceRecommended: boolean;
  adaptedNextObjective?: string;
  suggestedClueAdaptation?: string;
}

/**
 * Detect client platform capabilities to determine best Google Lens launch mechanism.
 */
export function detectPlatformForLens(): {
  isAndroid: boolean;
  isIOS: boolean;
  isDesktop: boolean;
  canTryDeepLink: boolean;
} {
  if (typeof window === 'undefined' || !navigator) {
    return { isAndroid: false, isIOS: false, isDesktop: true, canTryDeepLink: false };
  }
  const ua = navigator.userAgent || '';
  const isAndroid = /Android/i.test(ua);
  const isIOS = /iPhone|iPad|iPod/i.test(ua);
  const isDesktop = !isAndroid && !isIOS;

  return {
    isAndroid,
    isIOS,
    isDesktop,
    canTryDeepLink: isAndroid || isIOS
  };
}

/**
 * Generate supported Google Lens launch URLs and intent URIs.
 * - Android Intent: intent://lens.google.com/...#Intent;scheme=https;package=com.google.ar.lens;end
 *   or intent:#Intent;action=android.intent.action.VIEW;package=com.google.android.googlequicksearchbox;end
 * - Direct Lens Web portal: https://lens.google.com/
 * - Google Images with Lens: https://images.google.com/
 * - Guided Google Visual Search fallback: https://www.google.com/search?q=
 */
export function getGoogleLensLaunchTarget(queryHint?: string): {
  primaryUrl: string;
  fallbackUrl: string;
  intentUri?: string;
  method: 'android_intent' | 'app_deep_link' | 'web_lens' | 'fallback_search';
  label: string;
} {
  const { isAndroid } = detectPlatformForLens();

  if (isAndroid) {
    // Android Lens intent with direct package fallback to Google Lens / QuickSearchBox
    const intentUri = 'intent://lens.google.com/#Intent;scheme=https;package=com.google.ar.lens;S.browser_fallback_url=https%3A%2F%2Flens.google.com;end';
    return {
      primaryUrl: intentUri,
      fallbackUrl: 'https://lens.google.com/',
      intentUri,
      method: 'android_intent',
      label: 'Open Google Lens App'
    };
  }

  // Web / iOS / Desktop browser
  return {
    primaryUrl: 'https://lens.google.com/',
    fallbackUrl: queryHint 
      ? `https://www.google.com/search?q=${encodeURIComponent(queryHint)}&tbm=isch`
      : 'https://images.google.com/',
    method: 'web_lens',
    label: 'Launch Google Lens Web'
  };
}
