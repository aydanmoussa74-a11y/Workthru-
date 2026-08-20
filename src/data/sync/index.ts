/**
 * Synchronization Queue & Event Types
 */

export interface SyncEvent<T = unknown> {
  id: string;
  type: 'SESSION_COMPLETE' | 'PROFILE_UPDATE' | 'PROGRESSION_UPDATE';
  payload: T;
  createdAt: number;
  synced: boolean;
}
