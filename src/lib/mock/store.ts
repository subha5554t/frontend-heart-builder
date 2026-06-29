import { createSeedData, type Database } from "@/lib/mock/seed";

// Single source of truth for the mock backend. Everything is persisted to
// localStorage so the demo survives refreshes; in SSR we fall back to a
// throwaway in-memory copy.
const DB_KEY = "taskflow:db";
const TOKEN_KEY = "taskflow:token";
const SESSION_KEY = "taskflow:userId";

const isBrowser = typeof window !== "undefined";

let memoryDb: Database | null = null;

function read(): Database {
  if (!isBrowser) {
    memoryDb ??= createSeedData();
    return memoryDb;
  }

  const raw = window.localStorage.getItem(DB_KEY);
  if (!raw) {
    const seeded = createSeedData();
    window.localStorage.setItem(DB_KEY, JSON.stringify(seeded));
    return seeded;
  }

  try {
    return JSON.parse(raw) as Database;
  } catch {
    const seeded = createSeedData();
    window.localStorage.setItem(DB_KEY, JSON.stringify(seeded));
    return seeded;
  }
}

function write(db: Database): void {
  if (!isBrowser) {
    memoryDb = db;
    return;
  }
  window.localStorage.setItem(DB_KEY, JSON.stringify(db));
}

// Give callers a snapshot they can mutate, then commit it back atomically.
export function getDb(): Database {
  return read();
}

export function commit(mutator: (db: Database) => void): Database {
  const db = read();
  mutator(db);
  write(db);
  return db;
}

export const sessionStore = {
  getToken: () => (isBrowser ? window.localStorage.getItem(TOKEN_KEY) : null),
  getUserId: () => (isBrowser ? window.localStorage.getItem(SESSION_KEY) : null),
  save(token: string, userId: string) {
    if (!isBrowser) return;
    window.localStorage.setItem(TOKEN_KEY, token);
    window.localStorage.setItem(SESSION_KEY, userId);
  },
  clear() {
    if (!isBrowser) return;
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(SESSION_KEY);
  },
};

// Small helpers shared across the api layer.
export function uid(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export function delay<T>(value: T, ms = 280): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}
