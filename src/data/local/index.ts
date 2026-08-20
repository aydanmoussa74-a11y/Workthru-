/**
 * Local Data Storage Layer (IndexedDB / Local persistence contracts)
 * Phase 0: Structural interface foundation.
 */

export interface StorageAdapter {
  isAvailable(): boolean;
  getItem<T>(key: string): Promise<T | null>;
  setItem<T>(key: string, value: T): Promise<void>;
  removeItem(key: string): Promise<void>;
  clear(): Promise<void>;
}
