import { drizzle } from 'drizzle-orm/better-sqlite3'
import Database from 'better-sqlite3'
import { join } from 'node:path'
import { mkdirSync } from 'node:fs'
import * as schema from '../database/schema'

const dataDir = join(process.cwd(), 'data')
mkdirSync(dataDir, { recursive: true })

const sqlite = new Database(join(dataDir, 'collab.db'))
sqlite.pragma('journal_mode = WAL')

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS yjs_updates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    room_name TEXT NOT NULL,
    "update" BLOB NOT NULL,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS yjs_snapshots (
    room_name TEXT PRIMARY KEY,
    snapshot BLOB NOT NULL,
    updated_at INTEGER NOT NULL
  );
`)

export const db = drizzle(sqlite, { schema })
