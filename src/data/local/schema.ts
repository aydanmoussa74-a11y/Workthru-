/**
 * IndexedDB Schema & Store Definitions
 * Phase 5: Local Persistence Layer
 */

export const DB_NAME = 'WorkoutAppDB';
export const DB_VERSION = 1;

/**
 * Object Store Names
 */
export const STORES = {
  TRAINING_SESSIONS: 'training_sessions',
  COMPLETED_WORKOUTS: 'completed_workouts',
  USER_PREFERENCES: 'user_preferences',
} as const;

export type StoreName = (typeof STORES)[keyof typeof STORES];

/**
 * Store Configuration Definitions
 */
export interface StoreDefinition {
  name: string;
  keyPath: string;
  autoIncrement?: boolean;
  indexes: {
    name: string;
    keyPath: string | string[];
    unique?: boolean;
    multiEntry?: boolean;
  }[];
}

export const SCHEMA_DEFINITIONS: Record<StoreName, StoreDefinition> = {
  [STORES.TRAINING_SESSIONS]: {
    name: STORES.TRAINING_SESSIONS,
    keyPath: 'sessionId',
    indexes: [
      { name: 'by_workoutId', keyPath: 'workoutId', unique: false },
      { name: 'by_updatedAt', keyPath: 'updatedAt', unique: false },
      { name: 'by_state', keyPath: 'state', unique: false },
    ],
  },
  [STORES.COMPLETED_WORKOUTS]: {
    name: STORES.COMPLETED_WORKOUTS,
    keyPath: 'id',
    indexes: [
      { name: 'by_completedAt', keyPath: 'completedAt', unique: false },
      { name: 'by_workoutId', keyPath: 'workoutId', unique: false },
      { name: 'by_sessionId', keyPath: 'sessionId', unique: true },
    ],
  },
  [STORES.USER_PREFERENCES]: {
    name: STORES.USER_PREFERENCES,
    keyPath: 'key',
    indexes: [
      { name: 'by_updatedAt', keyPath: 'updatedAt', unique: false },
    ],
  },
};

/**
 * Migration handler for schema upgrades.
 */
export function upgradeDatabaseSchema(
  db: IDBDatabase,
  oldVersion: number,
  newVersion: number | null
): void {
  // Version 1 Setup
  if (oldVersion < 1) {
    for (const storeDef of Object.values(SCHEMA_DEFINITIONS)) {
      if (!db.objectStoreNames.contains(storeDef.name)) {
        const store = db.createObjectStore(storeDef.name, {
          keyPath: storeDef.keyPath,
          autoIncrement: storeDef.autoIncrement,
        });

        for (const idx of storeDef.indexes) {
          store.createIndex(idx.name, idx.keyPath, {
            unique: idx.unique ?? false,
            multiEntry: idx.multiEntry ?? false,
          });
        }
      }
    }
  }

  // Future version migrations (v2, v3, etc.) will be added here non-destructively
}
