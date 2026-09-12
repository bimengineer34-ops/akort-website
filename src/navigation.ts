import { eq } from 'drizzle-orm';
import { db } from '~/db/client';
import { settings } from '~/db/schema';

// Menus, footer and contact details are stored in the database (editable at
// /admin/menu and /admin/ayarlar). These are functions, not static exports —
// each call re-reads the DB, so edits made in the admin panel show up on the
// very next page request without restarting the server. (A plain top-level
// `export const` here would be computed once at server start and cached for
// the process's lifetime, which is wrong for content that changes at runtime.)
// `src/navigation.data.yaml` is the original seed source only; it isn't read
// here anymore.

interface NavLink {
  text: string;
  href?: string;
  links?: NavLink[];
}

interface NavData {
  header: { links: NavLink[]; actions: Array<{ text: string; href: string }> };
  footer: {
    links: Array<{ title: string; links: Array<{ text: string; href: string }> }>;
    secondaryLinks: Array<{ text: string; href: string }>;
    socialLinks: Array<{ ariaLabel: string; icon: string; href: string }>;
    footNote: string;
  };
}

export interface ContactData {
  phone: string;
  email: string;
  address: string;
  linkedin: string;
  instagram: string;
}

const EMPTY_NAV: NavData = {
  header: { links: [], actions: [] },
  footer: { links: [], secondaryLinks: [], socialLinks: [], footNote: '' },
};
const EMPTY_CONTACT: ContactData = { phone: '', email: '', address: '', linkedin: '', instagram: '' };

const readNav = (): NavData =>
  (db.select().from(settings).where(eq(settings.key, 'navigation')).get()?.value as NavData) ?? EMPTY_NAV;

export const getContactData = (): ContactData =>
  (db.select().from(settings).where(eq(settings.key, 'contact')).get()?.value as ContactData) ?? EMPTY_CONTACT;

export const getHeaderData = () => readNav().header;

export const getFooterData = () => {
  const nav = readNav();
  const contact = getContactData();
  return {
    ...nav.footer,
    links: [
      ...nav.footer.links,
      {
        title: 'İletişim',
        links: [
          { text: `Telefon: ${contact.phone}`, href: `tel:${contact.phone.replace(/[^+\d]/g, '')}` },
          { text: `E-posta: ${contact.email}`, href: `mailto:${contact.email}` },
          { text: `Adres: ${contact.address}`, href: '/iletisim' },
        ],
      },
    ],
    footNote: nav.footer.footNote.replace('{year}', String(new Date().getFullYear())),
  };
};
