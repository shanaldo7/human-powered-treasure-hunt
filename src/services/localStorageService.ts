import { TreasureHunt } from '../types/hunt';

const ACTIVE_HUNT_KEY = 'human_powered_treasure_hunt_active';
const COMPLETED_HUNTS_KEY = 'human_powered_treasure_hunts_completed';

export class LocalStorageService {
  /**
   * Save active treasure hunt state to browser localStorage.
   */
  public saveActiveHunt(hunt: TreasureHunt): void {
    if (typeof window === 'undefined') return;

    try {
      window.localStorage.setItem(ACTIVE_HUNT_KEY, JSON.stringify(hunt));
    } catch (err) {
      console.warn('[LOCAL STORAGE] Failed to save active hunt state:', err);
    }
  }

  /**
   * Load active treasure hunt state from browser localStorage.
   */
  public loadActiveHunt(): TreasureHunt | null {
    if (typeof window === 'undefined') return null;

    try {
      const data = window.localStorage.getItem(ACTIVE_HUNT_KEY);
      if (data) {
        return JSON.parse(data) as TreasureHunt;
      }
    } catch (err) {
      console.warn('[LOCAL STORAGE] Failed to parse active hunt state:', err);
    }
    return null;
  }

  /**
   * Save a completed treasure hunt to history list in localStorage.
   */
  public saveCompletedHunt(hunt: TreasureHunt): void {
    if (typeof window === 'undefined') return;

    try {
      const existing = this.listCompletedHunts();
      const filtered = existing.filter(h => h.id !== hunt.id);
      const updated = [hunt, ...filtered].slice(0, 25);
      window.localStorage.setItem(COMPLETED_HUNTS_KEY, JSON.stringify(updated));
    } catch (err) {
      console.warn('[LOCAL STORAGE] Failed to save completed hunt:', err);
    }
  }

  /**
   * Delete an individual completed hunt by ID.
   */
  public deleteCompletedHunt(id: string): void {
    if (typeof window === 'undefined') return;

    try {
      const existing = this.listCompletedHunts();
      const filtered = existing.filter(h => h.id !== id);
      window.localStorage.setItem(COMPLETED_HUNTS_KEY, JSON.stringify(filtered));
    } catch (err) {
      console.warn('[LOCAL STORAGE] Failed to delete completed hunt:', err);
    }
  }

  /**
   * Clear all completed hunts from history.
   */
  public clearCompletedHunts(): void {
    if (typeof window === 'undefined') return;

    try {
      window.localStorage.removeItem(COMPLETED_HUNTS_KEY);
    } catch (err) {
      console.warn('[LOCAL STORAGE] Failed to clear completed hunts:', err);
    }
  }

  /**
   * List completed treasure hunts from localStorage with robust error recovery.
   */
  public listCompletedHunts(): TreasureHunt[] {
    if (typeof window === 'undefined') return [];

    try {
      const data = window.localStorage.getItem(COMPLETED_HUNTS_KEY);
      if (!data) return [];

      const parsed = JSON.parse(data);
      if (!Array.isArray(parsed)) {
        console.warn('[LOCAL STORAGE] Corrupted hunts history found; resetting to empty array.');
        window.localStorage.removeItem(COMPLETED_HUNTS_KEY);
        return [];
      }

      // Filter out invalid or corrupted entries safely
      return parsed.filter(item => item && typeof item === 'object' && item.id && item.title);
    } catch (err) {
      console.warn('[LOCAL STORAGE] Failed to parse completed hunts safely:', err);
      return [];
    }
  }

  /**
   * Verify browser localStorage availability and read/write functionality.
   */
  public verifyStorage(): { available: boolean; canSave: boolean; canRestore: boolean } {
    if (typeof window === 'undefined' || !window.localStorage) {
      return { available: false, canSave: false, canRestore: false };
    }

    try {
      const testKey = '__th_storage_test__';
      const testVal = 'test_' + Date.now();
      window.localStorage.setItem(testKey, testVal);
      const readVal = window.localStorage.getItem(testKey);
      window.localStorage.removeItem(testKey);
      const isOk = readVal === testVal;
      return { available: isOk, canSave: isOk, canRestore: isOk };
    } catch (err) {
      return { available: false, canSave: false, canRestore: false };
    }
  }

  /**
   * Clear active treasure hunt state from browser localStorage.
   */
  public clearActiveHunt(): void {
    if (typeof window === 'undefined') return;

    try {
      window.localStorage.removeItem(ACTIVE_HUNT_KEY);
    } catch (err) {
      console.warn('[LOCAL STORAGE] Failed to clear active hunt state:', err);
    }
  }

  // --------------------------------------------------------------------------
  // FEATURE 12: OFFLINE FIELD KIT
  // --------------------------------------------------------------------------
  public saveOfflineFieldKit(kit: import('../types/intelligence').OfflineFieldKitData): void {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(`offline_fieldkit_${kit.huntId}`, JSON.stringify(kit));
    } catch (err) {
      console.warn('[LOCAL STORAGE] Failed to save offline field kit:', err);
    }
  }

  public getOfflineFieldKit(huntId: string): import('../types/intelligence').OfflineFieldKitData | null {
    if (typeof window === 'undefined') return null;
    try {
      const data = window.localStorage.getItem(`offline_fieldkit_${huntId}`);
      if (data) return JSON.parse(data);
    } catch (err) {
      console.warn('[LOCAL STORAGE] Failed to get offline field kit:', err);
    }
    return null;
  }

  // --------------------------------------------------------------------------
  // FEATURE 13: PERSONAL DISCOVERY MEMORY
  // --------------------------------------------------------------------------
  public getPersonalProfile(): import('../types/intelligence').PersonalDiscoveryProfile {
    const defaultProfile: import('../types/intelligence').PersonalDiscoveryProfile = {
      favoriteGenres: ['Hidden History', 'Architecture'],
      savedPlaceIds: [],
      previouslySeenDiscoveries: [],
      completedHuntCount: 0,
      preferredDurationMinutes: 30,
      feedbackRecords: []
    };

    if (typeof window === 'undefined') return defaultProfile;
    try {
      const data = window.localStorage.getItem('personal_discovery_profile');
      if (data) {
        return { ...defaultProfile, ...JSON.parse(data) };
      }
    } catch (err) {
      console.warn('[LOCAL STORAGE] Failed to load personal profile:', err);
    }
    return defaultProfile;
  }

  public updatePersonalProfile(updates: Partial<import('../types/intelligence').PersonalDiscoveryProfile>): void {
    if (typeof window === 'undefined') return;
    try {
      const current = this.getPersonalProfile();
      const updated = { ...current, ...updates };
      window.localStorage.setItem('personal_discovery_profile', JSON.stringify(updated));
    } catch (err) {
      console.warn('[LOCAL STORAGE] Failed to save personal profile:', err);
    }
  }
}

export const localStore = new LocalStorageService();
