import { db } from '~/db/client';
import { pageViews } from '~/db/schema';

const EXCLUDED_PREFIXES = ['/admin', '/uploads', '/_astro', '/api', '/@fs', '/@vite', '/@id'];

/** True for a real page navigation worth counting — not an admin route, an
 * asset, or a non-HTML request (a file has a dot in its last path segment:
 * robots.txt, sitemap-index.xml, favicon.ico, site.webmanifest, *.css/js…). */
export const isTrackablePageRequest = (pathname: string, method: string, acceptHeader: string | null): boolean => {
  if (method !== 'GET') return false;
  if (EXCLUDED_PREFIXES.some((p) => pathname.startsWith(p))) return false;
  const lastSegment = pathname.split('/').pop() ?? '';
  if (lastSegment.includes('.')) return false;
  if (acceptHeader && !acceptHeader.includes('text/html')) return false;
  return true;
};

/** No IP, no user agent, no cookie/visitor ID — just which path, when. */
export const logPageView = (path: string): void => {
  try {
    db.insert(pageViews).values({ path, createdAt: new Date() }).run();
  } catch {
    // Never let analytics logging break a page request.
  }
};
