import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3'
import * as schema from '../db/schema.js'

export type Database = BetterSQLite3Database<typeof schema>
