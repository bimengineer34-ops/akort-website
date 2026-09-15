import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(), // random token, doubles as the cookie value
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
});

export const messages = sqliteTable('messages', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  type: text('type').notNull(), // 'contact' | 'quote' | 'career'
  name: text('name').notNull(),
  email: text('email').notNull(),
  phone: text('phone'),
  company: text('company'),
  /** Extra type-specific fields (project location/type/area/stage, position interest…) as JSON. */
  meta: text('meta', { mode: 'json' }).$type<Record<string, string>>(),
  message: text('message'),
  status: text('status').notNull().default('yeni'), // 'yeni' | 'okundu'
  priority: text('priority').notNull().default('orta'), // 'dusuk' | 'orta' | 'yuksek'
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const posts = sqliteTable('posts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  excerpt: text('excerpt'),
  /** Meta description override — falls back to `excerpt` when empty. Kept
   * separate because a good on-page excerpt and a good ~155-char SEO
   * description are usually not the same sentence. */
  seoDescription: text('seo_description'),
  image: text('image'),
  imageAlt: text('image_alt'),
  category: text('category'),
  tags: text('tags', { mode: 'json' }).$type<string[]>().default([]),
  author: text('author'),
  publishDate: integer('publish_date', { mode: 'timestamp' }).notNull(),
  draft: integer('draft', { mode: 'boolean' }).notNull().default(false),
  body: text('body').notNull().default(''),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const projects = sqliteTable('projects', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  excerpt: text('excerpt'),
  /** Meta description override — falls back to `excerpt` when empty. */
  seoDescription: text('seo_description'),
  image: text('image'),
  imageAlt: text('image_alt'),
  tags: text('tags', { mode: 'json' }).$type<string[]>().default([]),
  client: text('client'),
  location: text('location'),
  year: text('year'),
  area: text('area'),
  scope: text('scope'),
  need: text('need'),
  solution: text('solution'),
  systems: text('systems', { mode: 'json' }).$type<string[]>().default([]),
  outcomes: text('outcomes', { mode: 'json' }).$type<string[]>().default([]),
  draft: integer('draft', { mode: 'boolean' }).notNull().default(false),
  body: text('body').notNull().default(''),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const galleryItems = sqliteTable('gallery_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  image: text('image').notNull(),
  caption: text('caption'),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export interface PageFeatureItem {
  icon?: string;
  title: string;
  description: string;
}

export interface PageApproachItem {
  title: string;
  description: string;
}

export const pages = sqliteTable('pages', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  slug: text('slug').notNull().unique(),
  group: text('group').notNull().default('kurumsal'), // 'kurumsal' | 'hizmet' | 'diger' — for listing on /hizmetler
  title: text('title').notNull(),
  seoDescription: text('seo_description'),
  tagline: text('tagline'),
  heroTitle: text('hero_title'),
  heroSubtitle: text('hero_subtitle'),
  features: text('features', { mode: 'json' }).$type<PageFeatureItem[]>().default([]),
  approachTagline: text('approach_tagline'),
  approachTitle: text('approach_title'),
  approachItems: text('approach_items', { mode: 'json' }).$type<PageApproachItem[]>().default([]),
  image: text('image'),
  imageAlt: text('image_alt'),
  /** Long-form Markdown section rendered below the approach block (methodology, scope detail, standards). */
  body: text('body').notNull().default(''),
  ctaTitle: text('cta_title'),
  ctaSubtitle: text('cta_subtitle'),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

/** Singleton rows, one per key: 'site' | 'contact' | 'navigation' | 'homepage'. */
export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value', { mode: 'json' }).notNull(),
});

/** One row per public page request, logged by middleware.ts — powers the
 * Dashboard's own visit counts, independent of Google/Yandex. Never records
 * anything about who the visitor is (no IP, no user agent, no cookie/ID) —
 * just which path was hit and when. */
export const pageViews = sqliteTable('page_views', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  path: text('path').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});
