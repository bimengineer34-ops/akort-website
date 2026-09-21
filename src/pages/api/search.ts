import type { APIRoute } from 'astro';
import { and, eq, like, or } from 'drizzle-orm';
import { db } from '~/db/client';
import { pages, posts, projects } from '~/db/schema';

export const prerender = false;

interface SearchResult {
  title: string;
  url: string;
  excerpt: string;
  type: 'Sayfa' | 'Blog' | 'Proje';
}

const MAX_RESULTS = 8;

export const GET: APIRoute = async ({ url }) => {
  const q = (url.searchParams.get('q') ?? '').trim();
  const headers = { 'Content-Type': 'application/json' };

  if (q.length < 2) {
    return new Response(JSON.stringify({ results: [] }), { headers });
  }

  const term = `%${q}%`;

  const pageRows = db
    .select({ title: pages.title, slug: pages.slug, tagline: pages.tagline, heroSubtitle: pages.heroSubtitle })
    .from(pages)
    .where(or(like(pages.title, term), like(pages.tagline, term), like(pages.heroSubtitle, term)))
    .limit(MAX_RESULTS)
    .all();

  const postRows = db
    .select({ title: posts.title, slug: posts.slug, excerpt: posts.excerpt })
    .from(posts)
    .where(and(eq(posts.draft, false), or(like(posts.title, term), like(posts.excerpt, term))))
    .limit(MAX_RESULTS)
    .all();

  const projectRows = db
    .select({ title: projects.title, slug: projects.slug, excerpt: projects.excerpt })
    .from(projects)
    .where(and(eq(projects.draft, false), or(like(projects.title, term), like(projects.excerpt, term))))
    .limit(MAX_RESULTS)
    .all();

  const results: SearchResult[] = [
    ...pageRows.map((p) => ({
      title: p.title,
      url: `/${p.slug}`,
      excerpt: p.tagline || p.heroSubtitle || '',
      type: 'Sayfa' as const,
    })),
    ...postRows.map((p) => ({
      title: p.title,
      url: `/bilgi-merkezi/${p.slug}`,
      excerpt: p.excerpt || '',
      type: 'Blog' as const,
    })),
    ...projectRows.map((p) => ({
      title: p.title,
      url: `/projeler/${p.slug}`,
      excerpt: p.excerpt || '',
      type: 'Proje' as const,
    })),
  ].slice(0, MAX_RESULTS);

  return new Response(JSON.stringify({ results }), { headers });
};
