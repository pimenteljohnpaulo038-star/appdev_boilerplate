import { Platform } from 'react-native';
import NativeStorage from 'expo-sqlite/kv-store';

export interface IKVStorage {
  getItem: (key: string) => Promise<string | null>;
  getItemAsync: (key: string) => Promise<string | null>;
  getItemSync?: (key: string) => string | null;
  setItem: (key: string, value: string) => Promise<void>;
  setItemAsync: (key: string, value: string) => Promise<void>;
  setItemSync?: (key: string, value: string) => void;
  removeItem: (key: string) => Promise<void>;
  removeItemAsync: (key: string) => Promise<boolean>;
  removeItemSync?: (key: string) => boolean;
  clear: () => Promise<void>;
  clearAsync: () => Promise<boolean>;
  clearSync?: () => boolean;
  getAllKeys?: () => Promise<string[]>;
  getAllKeysAsync?: () => Promise<string[]>;
  getAllKeysSync?: () => string[];
  multiGet?: (keys: string[]) => Promise<[string, string | null][]>;
  multiSet?: (keyValuePairs: [string, string][]) => Promise<void>;
  multiRemove?: (keys: string[]) => Promise<void>;
}

/**
 * Robust cross-platform key-value storage.
 *
 * Web: Uses browser localStorage with an in-memory fallback.
 * Serializes write operations to prevent race conditions or handle contention.
 *
 * Native (Android/iOS): Uses expo-sqlite/kv-store with automated error recovery.
 */
class WebKVStorage implements IKVStorage {
  private memory = new Map<string, string>();
  private writeQueue: Promise<void> = Promise.resolve();
  private initialized = false;

  private getStorage(): globalThis.Storage | null {
    if (typeof localStorage !== 'undefined') {
      try {
        // Test access (can throw in private browsing or restrictive iframe)
        const testKey = '__oras_test_storage__';
        localStorage.setItem(testKey, '1');
        localStorage.removeItem(testKey);
        return localStorage;
      } catch {
        return null;
      }
    }
    return null;
  }

  private async enqueue<T>(op: () => Promise<T> | T): Promise<T> {
    const run = async () => {
      try {
        return await op();
      } catch (err) {
        console.warn('Storage operation recovered from error:', err);
        throw err;
      }
    };

    const next = this.writeQueue.then(run, run);
    this.writeQueue = next.then(() => {}, () => {});
    return next;
  }

  async getItem(key: string): Promise<string | null> {
    return this.getItemSync(key);
  }

  async getItemAsync(key: string): Promise<string | null> {
    return this.getItem(key);
  }

  getItemSync(key: string): string | null {
    const s = this.getStorage();
    if (s) {
      try {
        const val = s.getItem(key);
        if (val !== null) return val;
      } catch {
        // fall back to memory
      }
    }
    return this.memory.get(key) ?? null;
  }

  async setItem(key: string, value: string): Promise<void> {
    return this.enqueue(() => {
      this.setItemSync(key, value);
    });
  }

  async setItemAsync(key: string, value: string): Promise<void> {
    return this.setItem(key, value);
  }

  setItemSync(key: string, value: string): void {
    const strVal = String(value);
    this.memory.set(key, strVal);
    const s = this.getStorage();
    if (s) {
      try {
        s.setItem(key, strVal);
      } catch {
        // memory map already updated
      }
    }
  }

  async removeItem(key: string): Promise<void> {
    return this.enqueue(() => {
      this.removeItemSync(key);
    });
  }

  async removeItemAsync(key: string): Promise<boolean> {
    await this.removeItem(key);
    return true;
  }

  removeItemSync(key: string): boolean {
    this.memory.delete(key);
    const s = this.getStorage();
    if (s) {
      try {
        s.removeItem(key);
        return true;
      } catch {
        return false;
      }
    }
    return true;
  }

  async clear(): Promise<void> {
    return this.enqueue(() => {
      this.clearSync();
    });
  }

  async clearAsync(): Promise<boolean> {
    await this.clear();
    return true;
  }

  clearSync(): boolean {
    this.memory.clear();
    const s = this.getStorage();
    if (s) {
      try {
        s.clear();
        return true;
      } catch {
        return false;
      }
    }
    return true;
  }

  async getAllKeys(): Promise<string[]> {
    return this.getAllKeysSync();
  }

  async getAllKeysAsync(): Promise<string[]> {
    return this.getAllKeys();
  }

  getAllKeysSync(): string[] {
    const keys = new Set<string>(this.memory.keys());
    const s = this.getStorage();
    if (s) {
      try {
        for (let i = 0; i < s.length; i++) {
          const k = s.key(i);
          if (k) keys.add(k);
        }
      } catch {}
    }
    return Array.from(keys);
  }

  async multiGet(keys: string[]): Promise<[string, string | null][]> {
    return keys.map((k) => [k, this.getItemSync(k)]);
  }

  async multiSet(keyValuePairs: [string, string][]): Promise<void> {
    return this.enqueue(() => {
      for (const [k, v] of keyValuePairs) {
        this.setItemSync(k, v);
      }
    });
  }

  async multiRemove(keys: string[]): Promise<void> {
    return this.enqueue(() => {
      for (const k of keys) {
        this.removeItemSync(k);
      }
    });
  }
}

/** Resilient native adapter that catches any unexpected native SQLite VFS / lock errors */
class SafeNativeStorage implements IKVStorage {
  private fallback = new WebKVStorage();

  async getItem(key: string): Promise<string | null> {
    try {
      return await NativeStorage.getItem(key);
    } catch (e) {
      console.warn('Native KVStorage getItem fallback:', e);
      return this.fallback.getItem(key);
    }
  }

  async getItemAsync(key: string): Promise<string | null> {
    return this.getItem(key);
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      await NativeStorage.setItem(key, value);
    } catch (e) {
      console.warn('Native KVStorage setItem fallback:', e);
      await this.fallback.setItem(key, value);
    }
  }

  async setItemAsync(key: string, value: string): Promise<void> {
    return this.setItem(key, value);
  }

  async removeItem(key: string): Promise<void> {
    try {
      await NativeStorage.removeItem(key);
    } catch (e) {
      console.warn('Native KVStorage removeItem fallback:', e);
      await this.fallback.removeItem(key);
    }
  }

  async removeItemAsync(key: string): Promise<boolean> {
    try {
      return await NativeStorage.removeItemAsync(key);
    } catch {
      return this.fallback.removeItemAsync(key);
    }
  }

  async clear(): Promise<void> {
    try {
      await NativeStorage.clear();
    } catch (e) {
      console.warn('Native KVStorage clear fallback:', e);
      await this.fallback.clear();
    }
  }

  async clearAsync(): Promise<boolean> {
    try {
      return await NativeStorage.clearAsync();
    } catch {
      return this.fallback.clearAsync();
    }
  }
}

export const appStorage: IKVStorage =
  Platform.OS === 'web' ? new WebKVStorage() : new SafeNativeStorage();

export default appStorage;
