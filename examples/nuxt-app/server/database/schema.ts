import { sqliteTable, text, blob, integer } from 'drizzle-orm/sqlite-core'

export const yjsUpdates = sqliteTable('yjs_updates', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  roomName: text('room_name').notNull(),
  update: blob('update', { mode: 'buffer' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
})

export const yjsSnapshots = sqliteTable('yjs_snapshots', {
  roomName: text('room_name').primaryKey(),
  snapshot: blob('snapshot', { mode: 'buffer' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
})
