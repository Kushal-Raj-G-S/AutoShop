import { pgTable, serial, integer, varchar, text, numeric, boolean, timestamp, jsonb, index } from 'drizzle-orm/pg-core';
import { categories } from '../category/schema.js';

export const items = pgTable('items', {
  id: serial('id').primaryKey(),
  categoryId: integer('category_id').notNull().references(() => categories.id, { onDelete: 'restrict' }),
  name: varchar('name', { length: 120 }).notNull(),
  slug: varchar('slug', { length: 140 }).notNull().unique(),
  description: text('description'),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  imageUrl: text('image_url'),
  isActive: boolean('is_active').default(true),
  stock: integer('stock').default(0),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  categoryActiveIdx: index('items_category_active_idx').on(table.categoryId, table.isActive),
  slugIdx: index('items_slug_idx').on(table.slug),
}));
