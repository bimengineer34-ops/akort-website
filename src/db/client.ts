import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import * as schema from './schema';

const DATABASE_PATH = process.env.DATABASE_PATH || './data/akort.db';

fs.mkdirSync(path.dirname(DATABASE_PATH), { recursive: true });

const sqlite = new Database(DATABASE_PATH);
sqlite.pragma('journal_mode = WAL');

export const db = drizzle(sqlite, { schema });

// Migrations run once at process startup (dev server start, or container
// start in production) — safe to call on every boot, a no-op once applied.
migrate(db, { migrationsFolder: './drizzle' });
