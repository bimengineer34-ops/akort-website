import yaml from 'js-yaml';
// `?raw` inlines the file's text content at build time (Vite), so this works
// the same in `astro dev` and in a bundled `astro build` — unlike reading the
// file from disk via `fs` relative to the compiled module's own location.
import navRaw from './navigation.data.yaml?raw';

// Menu, footer and contact details live in `navigation.data.yaml` so they can
// be edited from the admin panel (Decap CMS, `/admin`) without touching code.
const nav = yaml.load(navRaw) as {
  header: { links: Array<Record<string, unknown>>; actions: Array<Record<string, unknown>> };
  footer: {
    links: Array<{ title: string; links: Array<{ text: string; href: string }> }>;
    secondaryLinks: Array<{ text: string; href: string }>;
    socialLinks: Array<{ ariaLabel: string; icon: string; href: string }>;
    footNote: string;
  };
  contact: { phone: string; email: string; address: string; linkedin: string; instagram: string };
};

export const contactData = nav.contact;

export const headerData = nav.header;

export const footerData = {
  ...nav.footer,
  links: [
    ...nav.footer.links,
    {
      title: 'İletişim',
      links: [
        { text: `Telefon: ${nav.contact.phone}`, href: `tel:${nav.contact.phone.replace(/[^+\d]/g, '')}` },
        { text: `E-posta: ${nav.contact.email}`, href: `mailto:${nav.contact.email}` },
        { text: `Adres: ${nav.contact.address}`, href: '/iletisim' },
      ],
    },
  ],
  footNote: nav.footer.footNote.replace('{year}', String(new Date().getFullYear())),
};
