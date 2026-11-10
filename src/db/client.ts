import { Platform } from 'react-native';
import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;
let initPromise: Promise<SQLite.SQLiteDatabase> | null = null;

/** Ordered migrations, applied by PRAGMA user_version. */
const MIGRATIONS: string[] = [
  `
  CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'done' CHECK (status IN ('done', 'pending', 'error')),
    error TEXT,
    provider TEXT,
    created_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_messages_conversation
    ON messages (conversation_id, created_at);
  `,
  `
  ALTER TABLE messages ADD COLUMN image_uri TEXT;
  `,
  `
  ALTER TABLE messages ADD COLUMN audio_uri TEXT;
  `,
  `
  CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    date TEXT NOT NULL,
    time TEXT,
    description TEXT NOT NULL DEFAULT '',
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_events_date
    ON events (date ASC, time ASC);
  `,
];

export function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

async function executeSqlBatch(database: SQLite.SQLiteDatabase, sql: string): Promise<void> {
  const statements = sql
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  for (const statement of statements) {
    try {
      await database.execAsync(statement);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (!msg.includes('duplicate column name') && !msg.includes('already exists')) {
        throw err;
      }
    }
  }
}

async function migrate(database: SQLite.SQLiteDatabase): Promise<void> {
  const row = await database.getFirstAsync<{ user_version: number }>(
    'PRAGMA user_version'
  );
  const version = row?.user_version ?? 0;
  for (let i = version; i < MIGRATIONS.length; i++) {
    await executeSqlBatch(database, MIGRATIONS[i]);
    await database.execAsync(`PRAGMA user_version = ${i + 1}`);
  }
}

/** In-memory / web storage fallback when SQLite native / wa-sqlite is unavailable */
function createWebFallbackDatabase(): SQLite.SQLiteDatabase {
  const memoryStore: Record<string, Record<string, unknown>[]> = {
    conversations: [],
    messages: [],
    events: [],
  };

  // Try to load from localStorage if available
  if (typeof localStorage !== 'undefined') {
    try {
      const savedConv = localStorage.getItem('oras_db_conversations');
      if (savedConv) memoryStore.conversations = JSON.parse(savedConv);
      const savedMsg = localStorage.getItem('oras_db_messages');
      if (savedMsg) memoryStore.messages = JSON.parse(savedMsg);
      const savedEvents = localStorage.getItem('oras_db_events');
      if (savedEvents) memoryStore.events = JSON.parse(savedEvents);
    } catch {}
  }

  const persist = (table: string) => {
    if (typeof localStorage !== 'undefined' && memoryStore[table]) {
      try {
        localStorage.setItem(`oras_db_${table}`, JSON.stringify(memoryStore[table]));
      } catch {}
    }
  };

  const fakeDb: unknown = {
    execAsync: async () => {},
    runAsync: async (sql: string, ...params: unknown[]) => {
      const trimmed = sql.trim().toLowerCase();
      if (trimmed.startsWith('insert into conversations') || trimmed.startsWith('insert or ignore into conversations')) {
        const [id, title, created_at, updated_at] = params as [string, string, number, number];
        const existing = memoryStore.conversations.find((c) => c.id === id);
        if (!existing) {
          memoryStore.conversations.push({ id, title, created_at, updated_at });
          persist('conversations');
        }
      } else if (trimmed.startsWith('update conversations')) {
        const [updated_at, id] = params as [number, string];
        const conv = memoryStore.conversations.find((c) => c.id === id);
        if (conv) {
          conv.updated_at = updated_at;
          persist('conversations');
        }
      } else if (trimmed.startsWith('delete from conversations')) {
        memoryStore.conversations = [];
        persist('conversations');
      } else if (trimmed.startsWith('insert into messages')) {
        const [id, conversation_id, role, content, status, error, provider, image_uri, audio_uri, created_at] =
          params as [string, string, string, string, string, string | null, string | null, string | null, string | null, number];
        memoryStore.messages.push({
          id,
          conversation_id,
          role,
          content,
          status,
          error,
          provider,
          image_uri,
          audio_uri,
          created_at,
        });
        persist('messages');
      } else if (trimmed.startsWith('update messages set content')) {
        const [content, id] = params as [string, string];
        const msg = memoryStore.messages.find((m) => m.id === id);
        if (msg) {
          msg.content = content;
          persist('messages');
        }
      } else if (trimmed.startsWith('delete from messages')) {
        memoryStore.messages = [];
        persist('messages');
      } else if (trimmed.startsWith('insert into events')) {
        const [id, title, date, time, description, created_at, updated_at] =
          params as [string, string, string, string | null, string, number, number];
        memoryStore.events.push({ id, title, date, time, description, created_at, updated_at });
        persist('events');
      } else if (trimmed.startsWith('update events')) {
        const [title, date, time, description, updated_at, id] =
          params as [string, string, string | null, string, number, string];
        const ev = memoryStore.events.find((e) => e.id === id);
        if (ev) {
          ev.title = title;
          ev.date = date;
          ev.time = time;
          ev.description = description;
          ev.updated_at = updated_at;
          persist('events');
        }
      } else if (trimmed.startsWith('delete from events')) {
        const [id] = params as [string];
        memoryStore.events = memoryStore.events.filter((e) => e.id !== id);
        persist('events');
      }
      return { lastInsertRowId: 1, changes: 1 };
    },
    getAllAsync: async <T>(sql: string, ...params: unknown[]): Promise<T[]> => {
      const trimmed = sql.trim().toLowerCase();
      if (trimmed.includes('from conversations')) {
        return [...memoryStore.conversations] as unknown as T[];
      }
      if (trimmed.includes('from messages')) {
        if (params.length > 0 && typeof params[0] === 'string') {
          return memoryStore.messages
            .filter((m) => m.conversation_id === params[0])
            .sort((a, b) => ((a.created_at as number) - (b.created_at as number))) as unknown as T[];
        }
        return [...memoryStore.messages] as unknown as T[];
      }
      if (trimmed.includes('from events')) {
        if (params.length > 0 && typeof params[0] === 'string') {
          return memoryStore.events
            .filter((e) => e.date === params[0])
            .sort((a, b) => String(a.time || '').localeCompare(String(b.time || ''))) as unknown as T[];
        }
        return [...memoryStore.events] as unknown as T[];
      }
      return [];
    },
    getFirstAsync: async <T>(sql: string, ...params: unknown[]): Promise<T | null> => {
      const trimmed = sql.trim().toLowerCase();
      if (trimmed.includes('pragma user_version')) {
        return { user_version: 4 } as unknown as T;
      }
      if (trimmed.includes('from events') && params.length > 0) {
        return (memoryStore.events.find((e) => e.id === params[0]) as unknown as T) || null;
      }
      return null;
    },
  };

  return fakeDb as SQLite.SQLiteDatabase;
}

/** Open (and migrate) the database. Safe to call from anywhere; runs once. */
export function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (db) return Promise.resolve(db);
  if (!initPromise) {
    initPromise = (async () => {
      try {
        if (Platform.OS === 'web') {
          // On Web, test if openDatabaseAsync works or fall back safely
          try {
            const database = await SQLite.openDatabaseAsync('chat.db');
            await database.execAsync('PRAGMA foreign_keys = ON');
            await migrate(database);
            db = database;
            return database;
          } catch (webErr) {
            console.warn('Web SQLite native worker unavailable, using local storage fallback:', webErr);
            const fallbackDb = createWebFallbackDatabase();
            db = fallbackDb;
            return fallbackDb;
          }
        }
        const database = await SQLite.openDatabaseAsync('chat.db');
        await database.execAsync('PRAGMA foreign_keys = ON');
        await migrate(database);
        db = database;
        return database;
      } catch (err) {
        if (Platform.OS === 'web') {
          const fallbackDb = createWebFallbackDatabase();
          db = fallbackDb;
          return fallbackDb;
        }
        initPromise = null;
        throw err;
      }
    })();
  }
  return initPromise;
}
