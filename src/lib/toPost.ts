import { cleanSlug } from '~/utils/permalinks';
import type { Post } from '~/types';
import type { posts } from '~/db/schema';

type PostRow = typeof posts.$inferSelect;

const estimateReadingTime = (body: string): number =>
  Math.max(1, Math.round(body.split(/\s+/).filter(Boolean).length / 200));

export const toPost = (row: PostRow): Post => ({
  id: String(row.id),
  slug: row.slug,
  permalink: `bilgi-merkezi/${row.slug}`,
  publishDate: row.publishDate,
  title: row.title,
  excerpt: row.excerpt ?? undefined,
  image: row.image ?? undefined,
  imageAlt: row.imageAlt ?? undefined,
  category: row.category ? { slug: cleanSlug(row.category), title: row.category } : undefined,
  tags: (row.tags ?? []).map((t) => ({ slug: cleanSlug(t), title: t })),
  author: row.author ?? undefined,
  draft: row.draft,
  readingTime: estimateReadingTime(row.body),
});
