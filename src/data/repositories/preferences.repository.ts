/**
 * Preferences Repository
 * Phase 5: Local Persistence for User Training Preferences & Application Settings.
 */

import { IndexedDBManager, defaultDB } from '../local/db';
import { STORES } from '../local/schema';
import {
  UserTrainingPreferences,
  DEFAULT_USER_TRAINING_PREFERENCES,
  PersistedPreferenceEntry,
} from '../local/types';

export const TRAINING_PREFS_KEY = 'user_training_preferences';

export interface PreferencesRepository {
  getTrainingPreferences(): Promise<UserTrainingPreferences>;
  saveTrainingPreferences(prefs: Partial<UserTrainingPreferences>): Promise<UserTrainingPreferences>;
  resetTrainingPreferences(): Promise<UserTrainingPreferences>;
  getPreference<T>(key: string, defaultValue: T): Promise<T>;
  setPreference<T>(key: string, value: T): Promise<void>;
  deletePreference(key: string): Promise<void>;
  clearAllPreferences(): Promise<void>;
}

export class IndexedDBPreferencesRepository implements PreferencesRepository {
  private db: IndexedDBManager;

  constructor(db: IndexedDBManager = defaultDB) {
    this.db = db;
  }

  /**
   * Retrieves user training preferences, returning safe defaults if none exist.
   */
  public async getTrainingPreferences(): Promise<UserTrainingPreferences> {
    try {
      const entry = await this.db.get<PersistedPreferenceEntry<UserTrainingPreferences>>(
        STORES.USER_PREFERENCES,
        TRAINING_PREFS_KEY
      );

      if (!entry || !entry.value) {
        return { ...DEFAULT_USER_TRAINING_PREFERENCES };
      }

      return {
        ...DEFAULT_USER_TRAINING_PREFERENCES,
        ...entry.value,
      };
    } catch (err) {
      console.warn('Failed to retrieve training preferences from IndexedDB, falling back to defaults:', err);
      return { ...DEFAULT_USER_TRAINING_PREFERENCES };
    }
  }

  /**
   * Saves updated training preferences merged with existing preferences.
   */
  public async saveTrainingPreferences(
    prefs: Partial<UserTrainingPreferences>
  ): Promise<UserTrainingPreferences> {
    const current = await this.getTrainingPreferences();
    const updated: UserTrainingPreferences = {
      ...current,
      ...prefs,
    };

    const entry: PersistedPreferenceEntry<UserTrainingPreferences> = {
      key: TRAINING_PREFS_KEY,
      value: updated,
      updatedAt: Date.now(),
    };

    await this.db.put(STORES.USER_PREFERENCES, entry);
    return updated;
  }

  /**
   * Resets training preferences back to initial domain defaults.
   */
  public async resetTrainingPreferences(): Promise<UserTrainingPreferences> {
    const entry: PersistedPreferenceEntry<UserTrainingPreferences> = {
      key: TRAINING_PREFS_KEY,
      value: { ...DEFAULT_USER_TRAINING_PREFERENCES },
      updatedAt: Date.now(),
    };

    await this.db.put(STORES.USER_PREFERENCES, entry);
    return { ...DEFAULT_USER_TRAINING_PREFERENCES };
  }

  /**
   * Generic preference getter with typed default fallback.
   */
  public async getPreference<T>(key: string, defaultValue: T): Promise<T> {
    try {
      const entry = await this.db.get<PersistedPreferenceEntry<T>>(
        STORES.USER_PREFERENCES,
        key
      );
      if (!entry || entry.value === undefined) {
        return defaultValue;
      }
      return entry.value;
    } catch {
      return defaultValue;
    }
  }

  /**
   * Generic preference setter.
   */
  public async setPreference<T>(key: string, value: T): Promise<void> {
    const entry: PersistedPreferenceEntry<T> = {
      key,
      value,
      updatedAt: Date.now(),
    };
    await this.db.put(STORES.USER_PREFERENCES, entry);
  }

  /**
   * Deletes a preference key.
   */
  public async deletePreference(key: string): Promise<void> {
    await this.db.delete(STORES.USER_PREFERENCES, key);
  }

  /**
   * Clears all user preferences.
   */
  public async clearAllPreferences(): Promise<void> {
    await this.db.clearStore(STORES.USER_PREFERENCES);
  }
}

/**
 * Singleton instance of PreferencesRepository.
 */
export const defaultPreferencesRepository = new IndexedDBPreferencesRepository();
