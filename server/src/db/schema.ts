import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

// 사용자 테이블 스키마
export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  role: text('role', { enum: ['ADMIN', 'USER', 'GUEST'] })
    .notNull()
    .default('USER'),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString())
})

// 사용자 타입 정의
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type UpdateUser = Partial<Omit<NewUser, 'id' | 'createdAt'>>

export const sleepRecords = sqliteTable('sleep_records', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  startTime: text('start_time').notNull(),
  endTime: text('end_time').notNull(),
  notes: text('notes'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
})
