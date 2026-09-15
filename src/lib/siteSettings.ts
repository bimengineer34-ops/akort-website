import { eq } from 'drizzle-orm';
import { db } from '~/db/client';
import { settings } from '~/db/schema';

export interface SiteSettings {
  name: string;
  url: string;
  googleSiteVerificationId: string;
  seoTitleDefault: string;
  seoTitleTemplate: string;
  seoDescription: string;
  googleAnalyticsId: string;
  yandexMetricaId: string;
}

/** Reads the admin-editable subset of site settings — called per request, never cached at module scope. */
export const getSiteSettings = (): SiteSettings | null =>
  (db.select().from(settings).where(eq(settings.key, 'site')).get()?.value as SiteSettings) ?? null;
