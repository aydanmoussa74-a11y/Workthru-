/**
 * Cloud Data Interface
 * Phase 0: Contract definition for future remote persistence.
 */

export interface CloudSyncAdapter {
  isAuthenticated(): boolean;
  pushSyncEvents<T>(events: T[]): Promise<boolean>;
  pullLatestChanges<T>(): Promise<T[]>;
}
