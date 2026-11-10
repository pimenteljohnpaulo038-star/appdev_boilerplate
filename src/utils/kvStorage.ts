import { Platform } from 'react-native';
import NativeStorage from 'expo-sqlite/kv-store';

export interface IKVStorage {
  getItem: (key: string) => Promise<string | null>;
  getItemAsync: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  setItemAsync: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
  removeItemAsync: (key: string) => Promise<boolean>;
  clear: () => Promise<void>;
  clearAsync: () => Promise<boolean>;
}

class WebKVStorage implements IKVStorage {
  private memory = new Map<string, string>();

  private getStorage(): globalThis.Storage | null {
    if (typeof localStorage !== 'undefined') {
      return localStorage;
    }
    return null;
  }

  async getItem(key: string): Promise<string | null> {
    const s = this.getStorage();
    if (s) {
      try {
        return s.getItem(key);
      } catch {
        return this.memory.get(key) ?? null;
      }
    }
    return this.memory.get(key) ?? null;
  }

  async getItemAsync(key: string): Promise<string | null> {
    return this.getItem(key);
  }

  async setItem(key: string, value: string): Promise<void> {
    const s = this.getStorage();
    if (s) {
      try {
        s.setItem(key, value);
        return;
      } catch {
        this.memory.set(key, value);
        return;
      }
    }
    this.memory.set(key, value);
  }

  async setItemAsync(key: string, value: string): Promise<void> {
    return this.setItem(key, value);
  }

  async removeItem(key: string): Promise<void> {
    const s = this.getStorage();
    if (s) {
      try {
        s.removeItem(key);
      } catch {
        this.memory.delete(key);
      }
    } else {
      this.memory.delete(key);
    }
  }

  async removeItemAsync(key: string): Promise<boolean> {
    await this.removeItem(key);
    return true;
  }

  async clear(): Promise<void> {
    const s = this.getStorage();
    if (s) {
      try {
        s.clear();
      } catch {
        this.memory.clear();
      }
    } else {
      this.memory.clear();
    }
  }

  async clearAsync(): Promise<boolean> {
    await this.clear();
    return true;
  }
}

export const appStorage: IKVStorage =
  Platform.OS === 'web' ? new WebKVStorage() : NativeStorage;

export default appStorage;
