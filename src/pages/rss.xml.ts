import { getRssString } from '@astrojs/rss';
import { desc, eq } from 'drizzle-orm';

import { SITE, METADATA } from 'astrowind:config';
import { db } from '~/db/client';
import { posts } from '~/db/schema';

export const prerender = false;

export const GET = async () => {
  const rows = db.select().from(posts).where(eq(posts.draft, false)).orderBy(desc(posts.publishDate)).all();

  const rss = await getRssString({
    title: `${SITE.name}’in Bilgi Merkezi`,
    description: METADATA?.description || '',
    site: import.meta.env.SITE,
    items: rows.map((post) => ({
      link: `/bilgi-merkezi/${post.slug}`,
      title: post.title,
      description: post.excerpt ?? '',
      pubDate: post.publishDate,
      ...(post.author ? { author: post.author } : {}),
      categories: [...(post.category ? [post.category] : []), ...(post.tags ?? [])],
    })),
    trailingSlash: SITE.trailingSlash,
  });

  return new Response(rss, { headers: { 'Content-Type': 'application/xml' } });
};
