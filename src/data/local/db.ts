/**
 * IndexedDB Database Connection & Transaction Manager
 * Phase 5: Local Persistence Layer
 */

import { DB_NAME, DB_VERSION, upgradeDatabaseSchema, StoreName } from './schema';

export interface DatabaseOptions {
  dbName?: string;
  version?: number;
}

export class IndexedDBManager {
  private dbName: string;
  private version: number;
  private dbInstance: IDBDatabase | null = null;
  private openPromise: Promise<IDBDatabase> | null = null;

  constructor(options: DatabaseOptions = {}) {
    this.dbName = options.dbName || DB_NAME;
    this.version = options.version || DB_VERSION;
  }

  /**
   * Checks if IndexedDB is supported in the current runtime environment.
   */
  public isSupported(): boolean {
    return typeof indexedDB !== 'undefined' && indexedDB !== null;
  }

  /**
   * Opens or returns the cached active IDBDatabase instance.
   */
  public async getDB(): Promise<IDBDatabase> {
    if (!this.isSupported()) {
      throw new Error('IndexedDB is not supported or available in this environment.');
    }

    if (this.dbInstance) {
      return this.dbInstance;
    }

    if (this.openPromise) {
      return this.openPromise;
    }

    this.openPromise = new Promise<IDBDatabase>((resolve, reject) => {
      try {
        const request = indexedDB.open(this.dbName, this.version);

        request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
          const db = request.result;
          upgradeDatabaseSchema(db, event.oldVersion, event.newVersion);
        };

        request.onsuccess = () => {
          this.dbInstance = request.result;
          this.openPromise = null;

          // Listen for version change or unexpected close
          this.dbInstance.onversionchange = () => {
            this.close();
          };

          this.dbInstance.onclose = () => {
            this.dbInstance = null;
          };

          resolve(this.dbInstance);
        };

        request.onerror = () => {
          this.openPromise = null;
          reject(request.error || new Error('Failed to open IndexedDB database.'));
        };

        request.onblocked = () => {
          console.warn(`IndexedDB database "${this.dbName}" open is blocked by another connection.`);
        };
      } catch (err) {
        this.openPromise = null;
        reject(err);
      }
    });

    return this.openPromise;
  }

  /**
   * Executes a transaction safely across one or more object stores.
   */
  public async runTransaction<T>(
    storeNames: StoreName | StoreName[],
    mode: IDBTransactionMode,
    callback: (stores: Record<string, IDBObjectStore>, transaction: IDBTransaction) => Promise<T> | T
  ): Promise<T> {
    const db = await this.getDB();
    const names = Array.isArray(storeNames) ? storeNames : [storeNames];

    return new Promise<T>((resolve, reject) => {
      try {
        const transaction = db.transaction(names, mode);
        const stores: Record<string, IDBObjectStore> = {};
        for (const name of names) {
          stores[name] = transaction.objectStore(name);
        }

        let resultPromise: Promise<T> | T;
        try {
          resultPromise = callback(stores, transaction);
        } catch (err) {
          transaction.abort();
          return reject(err);
        }

        transaction.oncomplete = async () => {
          try {
            const result = await Promise.resolve(resultPromise);
            resolve(result);
          } catch (err) {
            reject(err);
          }
        };

        transaction.onerror = () => {
          reject(transaction.error || new Error('IndexedDB transaction failed.'));
        };

        transaction.onabort = () => {
          reject(new Error('IndexedDB transaction was aborted.'));
        };
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Generic get by key.
   */
  public async get<T>(storeName: StoreName, key: IDBValidKey): Promise<T | null> {
    return this.runTransaction(storeName, 'readonly', (stores) => {
      return new Promise<T | null>((resolve, reject) => {
        const request = stores[storeName].get(key);
        request.onsuccess = () => resolve((request.result as T) ?? null);
        request.onerror = () => reject(request.error);
      });
    });
  }

  /**
   * Generic put / upsert.
   */
  public async put<T>(storeName: StoreName, value: T): Promise<void> {
    return this.runTransaction(storeName, 'readwrite', (stores) => {
      return new Promise<void>((resolve, reject) => {
        const request = stores[storeName].put(value);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    });
  }

  /**
   * Generic delete by key.
   */
  public async delete(storeName: StoreName, key: IDBValidKey): Promise<void> {
    return this.runTransaction(storeName, 'readwrite', (stores) => {
      return new Promise<void>((resolve, reject) => {
        const request = stores[storeName].delete(key);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    });
  }

  /**
   * Generic get all records from a store, optionally sorted by index.
   */
  public async getAll<T>(
    storeName: StoreName,
    options?: {
      indexName?: string;
      direction?: IDBCursorDirection;
      limit?: number;
      offset?: number;
    }
  ): Promise<T[]> {
    return this.runTransaction(storeName, 'readonly', (stores) => {
      return new Promise<T[]>((resolve, reject) => {
        const store = stores[storeName];
        const source = options?.indexName ? store.index(options.indexName) : store;
        const results: T[] = [];
        const direction = options?.direction || 'next';
        const limit = options?.limit ?? Infinity;
        const offset = options?.offset ?? 0;

        let cursorRequest: IDBRequest<IDBCursorWithValue | null>;
        try {
          cursorRequest = source.openCursor(null, direction);
        } catch (err) {
          return reject(err);
        }

        let skipped = 0;

        cursorRequest.onsuccess = () => {
          const cursor = cursorRequest.result;
          if (!cursor) {
            return resolve(results);
          }

          if (skipped < offset) {
            skipped++;
            cursor.continue();
            return;
          }

          results.push(cursor.value as T);

          if (results.length >= limit) {
            return resolve(results);
          }

          cursor.continue();
        };

        cursorRequest.onerror = () => reject(cursorRequest.error);
      });
    });
  }

  /**
   * Generic clear all records from a store.
   */
  public async clearStore(storeName: StoreName): Promise<void> {
    return this.runTransaction(storeName, 'readwrite', (stores) => {
      return new Promise<void>((resolve, reject) => {
        const request = stores[storeName].clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    });
  }

  /**
   * Generic count of records in a store.
   */
  public async count(storeName: StoreName): Promise<number> {
    return this.runTransaction(storeName, 'readonly', (stores) => {
      return new Promise<number>((resolve, reject) => {
        const request = stores[storeName].count();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    });
  }

  /**
   * Closes the active database connection.
   */
  public close(): void {
    if (this.dbInstance) {
      try {
        this.dbInstance.close();
      } catch (e) {
        // Ignored
      }
      this.dbInstance = null;
    }
    this.openPromise = null;
  }

  /**
   * Deletes the entire IndexedDB database (used for testing or complete user data wipe).
   */
  public async deleteDatabase(): Promise<void> {
    this.close();
    if (!this.isSupported()) return;

    return new Promise<void>((resolve, reject) => {
      const request = indexedDB.deleteDatabase(this.dbName);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
      request.onblocked = () => {
        console.warn(`Deletion of database "${this.dbName}" was blocked.`);
        resolve();
      };
    });
  }
}

/**
 * Singleton default database manager for the application.
 */
export const defaultDB = new IndexedDBManager();
