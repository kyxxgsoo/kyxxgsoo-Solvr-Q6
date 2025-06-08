import { drizzle } from 'drizzle-orm/better-sqlite3'
import Database from 'better-sqlite3'
import env from '../config/env.js'
import * as schema from './schema.js'
import { Database as DrizzleDatabase } from '../types/database.js'

let db: DrizzleDatabase | null = null

export async function getDb(): Promise<DrizzleDatabase> {
  if (!db) {
    const sqlite = new Database(env.DATABASE_URL)
    db = drizzle(sqlite, { schema }) as DrizzleDatabase
  }
  return db
}

export async function initializeDatabase(): Promise<DrizzleDatabase> {
  return getDb()
}

export default { initializeDatabase, getDb }
