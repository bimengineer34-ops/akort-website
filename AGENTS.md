# AKORT Mühendislik — Agent Instructions

## Project Overview

This started from the AstroWind template (Astro v7 + Tailwind CSS v4) and has been converted into **AKORT Mühendislik**'s live corporate site: an Astro **SSR** app (not static) backed by **SQLite** (via `better-sqlite3` + Drizzle ORM), with a custom database-backed admin dashboard at `/admin`. There is no CMS, no git-based publishing workflow — every edit made through `/admin` is an immediate database write, live on the next request.

**Stack:** Astro v7 (SSR, `@astrojs/node` adapter) | Tailwind CSS v4 | TypeScript 5.9 | SQLite (better-sqlite3 + Drizzle ORM) | Tabler (admin UI, via CDN)

**Read `.agents/skills/admin-panel.md` before touching anything related to the database, the admin panel, or content rendering** — it documents the schema, where each piece lives, and the pattern for adding new admin-editable fields.

## Skills

Before implementing a project-specific task, check `.agents/skills/` for an existing skill and follow it. `.agents/skills/admin-panel.md` is the most important one in this project.

## Quick Reference

| Command               | Purpose                                                                                                                    |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `npm run dev`         | Start dev server at localhost:4321 (SSR, hits the local SQLite DB at `./data/akort.db`)                                    |
| `npm run build`       | Production build (Astro SSR build, produces `dist/server/entry.mjs`)                                                       |
| `npm run preview`     | Preview the production build locally                                                                                       |
| `npm run check`       | Run astro check + ESLint + Prettier                                                                                        |
| `npm run fix`         | Auto-fix ESLint + Prettier issues                                                                                          |
| `npm run db:generate` | Generate a SQL migration after changing `src/db/schema.ts`                                                                 |
| `npm run db:seed`     | Idempotent: seeds empty tables only. Prints the generated admin password once, the first time it creates the `admin` user. |

**Node.js requirement:** >= 22.22.3

## Architecture

### Directory Structure

```
src/
  assets/styles/tailwind.css   # Tailwind v4 config (themes, utilities, plugins)
  components/
    common/        # Shared: Image, Metadata, Analytics, ToggleTheme
    ui/            # Primitives: Button, Form, Headline, Timeline, WidgetWrapper
    widgets/       # Page sections: Hero, Features, Bento, Pricing, Comparison, FAQs, Team, Gallery…
    blog/          # Bilgi Merkezi rendering components (SinglePost, List, ListItem, Pagination, Tags)
    CustomStyles.astro  # CSS variables for colors and fonts
  db/
    schema.ts      # Drizzle schema — the source of truth for all DB tables
    client.ts      # Opens the SQLite file, runs pending migrations on boot
  lib/
    auth.ts        # Password hashing (scrypt) + sessions
    upload.ts       # Image upload handling for admin forms
    markdown.ts     # Markdown -> HTML for post/project bodies
    siteSettings.ts # Reads the admin-editable subset of site/SEO settings
    toPost.ts       # DB row -> the `Post` shape the blog components expect
  layouts/          # Layout.astro, PageLayout.astro (public site), AdminLayout.astro (admin)
  middleware.ts     # Protects /admin/* routes (session cookie check)
  pages/
    admin/**        # The admin dashboard — all SSR, all POST-to-self forms
    api/mesaj.ts    # Single POST target for every public form (contact/quote/career)
    [slug].astro    # Catch-all: renders any `pages` DB row by slug
    bilgi-merkezi/**, projeler/**  # Blog & projects, DB-driven
  utils/            # blog permalinks helpers, images.ts, permalinks.ts, frontmatter.ts
  config.yaml       # Technical/routing config only now (blog URL structure, i18n, ui.theme) —
                     # NOT where site name/SEO/contact live anymore, see below
  navigation.ts     # Reads menus/footer/contact from the DB (functions, not static exports —
                     # each call re-reads the DB so admin edits show up without a restart)
  navigation.data.yaml  # Original seed source for navigation only; not read at runtime
  types.d.ts        # TypeScript type definitions
scripts/
  seed.ts           # One-time content seed, run automatically on every container start
vendor/integration/    # Custom Astro integration for config.yaml loading
```

### Path Aliases

Use `~/` to import from `src/`:

```typescript
import Image from '~/components/common/Image.astro';
import { SITE } from 'astrowind:config';
import { db } from '~/db/client';
```

### Where site content actually lives now

- **Site name / SEO defaults / GA id / Google verification** — `settings` DB row `key='site'`, editable at `/admin/ayarlar`. `src/lib/siteSettings.ts` reads it; `Metadata.astro`/`Analytics.astro`/`SiteVerification.astro` layer it over `astrowind:config` (the config.yaml-driven fallback).
- **Contact info (phone/email/address/social)** — `settings` row `key='contact'`, editable at `/admin/ayarlar`.
- **Header/footer menus** — `settings` row `key='navigation'`, editable at `/admin/menu` (raw JSON editor).
- **Homepage hero text + the two stat strips** — `settings` row `key='homepage'`, editable at `/admin/ayarlar`. The rest of the homepage (`src/pages/index.astro`) is still hand-written — too many one-off sections to generalize.
- **Hakkımızda / Neden AKORT / Çalışma Yaklaşımımız / Kalite Politikamız / Sektörler / all 11 hizmet pages** — the `pages` table, editable at `/admin/sayfalar`, rendered by the single catch-all `src/pages/[slug].astro`.
- **Bilgi Merkezi posts / Projeler** — `posts` / `projects` tables, editable at `/admin/blog` and `/admin/projeler`.
- **Galeri** — `gallery_items` table, editable at `/admin/galeri`.
- **İletişim, Kariyer, legal pages (KVKK/Gizlilik/Çerez), Projeler listing/detail template** — still plain `.astro` files; edit the code directly for these.

`src/config.yaml` still exists but is now technical/routing-only: `apps.blog.*` (URL structure), `i18n`, `ui.theme`. Do not add site name/SEO fields back there — they've moved to the DB on purpose (see `.agents/skills/admin-panel.md` for why).

### Configuration System

`src/config.yaml` is loaded as the Vite virtual module `astrowind:config` by the custom integration in `vendor/integration/`. Exports: `SITE`, `I18N`, `METADATA`, `APP_BLOG`, `UI`, `ANALYTICS` — but for `SITE`'s name/description and `ANALYTICS`, prefer `src/lib/siteSettings.ts` (the DB overrides these at render time).

## Tailwind CSS v4

Configuration is CSS-first in `src/assets/styles/tailwind.css` (unchanged from the original template):

- **Theme tokens:** `@theme { --color-primary: var(--aw-color-primary); ... }`
- **Custom utilities:** `@utility bg-page { ... }`
- **Dark mode:** Class-based via `@variant dark (&:where(.dark, .dark *))`
- **Plugins:** `@plugin "@tailwindcss/typography"`

CSS variables for colors/fonts are defined in `src/components/CustomStyles.astro`. The admin panel (`/admin/**`) does **not** use this design system — it's styled with Tabler (loaded via CDN in `AdminLayout.astro`), a deliberately different, dashboard-appropriate look.

### Class Merging

Components use `twMerge` from `tailwind-merge` v3 for conditional class composition (public site only).

## Database (Drizzle + SQLite)

- Schema: `src/db/schema.ts`. After changing it, run `npm run db:generate` (writes a migration to `drizzle/`) — migrations apply automatically on the next server boot via `src/db/client.ts`.
- The DB file lives at `./data/akort.db` locally (gitignored) and at `/app/data/akort.db` in the Docker container (bind-mounted so it survives rebuilds).
- `scripts/seed.ts` only inserts into empty tables — safe to run repeatedly, and runs on every container start (see `Dockerfile`).

## Auth

Single/multi admin user, session cookie (`src/lib/auth.ts`, `src/middleware.ts`). Password hashing uses Node's built-in `scrypt` — no extra dependency. Cookies are marked `secure` only when `NODE_ENV=production` (so login still works under plain-HTTP `astro dev`).

## Component Patterns

- Public-site props extend interfaces from `~/types`
- Use `class:list` for conditional classes
- Use `twMerge()` when accepting className overrides
- Admin pages follow a consistent POST-to-self pattern: `if (Astro.request.method === 'POST') { ...validate, write via Drizzle, Astro.redirect... }` at the top of the frontmatter, then render the (possibly just-updated) data below. No separate REST API layer for admin CRUD.

## Image Handling

- **Public site:** `src/components/common/Image.astro` — local images via `astro:assets` (Sharp), remote via Unpic CDN. `~/assets/...` images should be referenced as plain `<img src={x.src}>` (not the `<Image>` component) if they must also work when Astro's dev-time `/_image` Sharp endpoint is unavailable (see `src/components/Logo.astro` for why).
- **Admin uploads:** `src/lib/upload.ts` (`resolveImage`) saves to `public/uploads/` (bind-mounted volume in Docker) and returns a `/uploads/<file>` path; a file upload always wins over a manually-typed URL in the same form.

## Fonts

Unchanged from the original template: Astro's native Fonts API, configured in `astro.config.ts` under `fonts`, injected via `<Font />` in `src/layouts/Layout.astro`.

## Deploy

Self-hosted via Docker Compose (`docker-compose.yml`): `astrowind` (the Node SSR app) + `caddy` (public HTTPS entry point, automatic Let's Encrypt — see `Caddyfile`). No nginx, no separate OAuth/CMS service. `.env` (never committed) holds `DATABASE_PATH` and `NODE_ENV=production`.

`/admin*` returns 404 on the public port (443); it only answers on a dedicated port, **8443**, same domain — log in at `https://www.akortmuhendislik.com:8443/admin`. Same Node backend both ways, Caddy just routes by port. Port 8443 must be open in the VPS firewall/cloud security group (in addition to 80/443) for this to be reachable.

## Verification Checklist

After changes, always verify:

1. `npm run build` succeeds (SSR build)
2. `npm run check` passes (astro check + ESLint + Prettier)
3. Visual check in browser: homepage, a `[slug]` page, Bilgi Merkezi, Projeler, dark mode, mobile menu
4. If you touched the DB schema or an admin form: log into `/admin`, exercise the affected CRUD screen, and confirm the public page reflects the change immediately (no rebuild step exists anymore — if a change doesn't show up, something is being cached at module scope instead of read per-request, see `src/navigation.ts` for the pattern to follow)
5. Structured data on the homepage should describe the site as configured in Site Ayarları (`/admin/ayarlar`), not hard-coded values
