# Admin Panel (Custom, Database-Backed)

The site runs as an Astro SSR app (`output: 'server'`, `@astrojs/node` standalone adapter) backed by SQLite (`better-sqlite3` + Drizzle ORM), with a custom admin dashboard at `/admin`. There is no CMS/git-based editing anymore — every edit through the panel is an immediate database write, live on the next page request.

## Where things are

| Concern                                                           | File(s)                                                                  |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------ |
| DB schema                                                         | `src/db/schema.ts`                                                       |
| DB client (opens the file, runs pending migrations on boot)       | `src/db/client.ts`                                                       |
| Generate a migration after changing the schema                    | `npm run db:generate` (writes to `drizzle/`)                             |
| Auth (scrypt password hashing, sessions)                          | `src/lib/auth.ts`                                                        |
| Route protection for `/admin/*`                                   | `src/middleware.ts`                                                      |
| Image upload handling                                             | `src/lib/upload.ts` (`resolveImage` — file upload wins over a URL field) |
| Markdown → HTML for post/project bodies                           | `src/lib/markdown.ts`                                                    |
| One-time content seed (idempotent, runs on every container start) | `scripts/seed.ts` (`npm run db:seed`)                                    |
| Admin UI shell                                                    | `src/layouts/AdminLayout.astro` (Tabler CSS/JS via CDN)                  |
| Admin pages                                                       | `src/pages/admin/**`                                                     |

## Data model

- `pages` — the flexible "Sayfalar" content type (hero + feature list + approach list + CTA). Powers Hakkımızda, Neden AKORT, Çalışma Yaklaşımımız, Kalite Politikamız, Sektörler, and all 11 hizmet pages via the catch-all `src/pages/[slug].astro`. `group` is `'kurumsal' | 'hizmet' | 'diger'` — `/hizmetler` lists everything with `group = 'hizmet'`.
- `posts`, `projects` — Bilgi Merkezi and Projeler, rendered by `src/pages/bilgi-merkezi/**` and `src/pages/projeler/**`.
- `gallery_items` — `/galeri`.
- `messages` — every contact/quote/career form submission (`src/pages/api/mesaj.ts` is the single POST target for all three forms; `type` distinguishes them).
- `settings` — singleton JSON rows keyed `site` (name/URL/SEO/GA id — read by `src/lib/siteSettings.ts` and layered over `astrowind:config` in `Metadata.astro`/`Analytics.astro`/`SiteVerification.astro`), `contact`, `navigation` (header/footer/social — read by `src/navigation.ts`), `homepage` (hero + the two homepage stat strips only).
- `users` / `sessions` — panel logins.

**Scope boundary:** the homepage (`index.astro`) keeps most of its sections hard-coded in the file — only its hero text and the two stat strips are DB-driven. `apps.blog.*`, `i18n`, and `ui.theme` in `src/config.yaml` are still code-only (not exposed in the panel) because editing them changes URL structure/routing.

## Adding a new admin-editable field

1. Add the column to `src/db/schema.ts`, run `npm run db:generate`, restart the dev server (migration runs automatically on boot via `src/db/client.ts`).
2. Add the form field to the relevant `src/pages/admin/**/[id].astro` (or `ayarlar.astro`) and to its `POST` handler's `values` object.
3. Add it to `scripts/seed.ts` if new records should ship with a sensible default.

## Local dev

- `npm run db:seed` — safe to run any time; only inserts into empty tables. Prints the generated admin password once, the first time it creates the `admin` user.
- `astro dev` runs everything over plain HTTP — session cookies are only marked `secure` when `NODE_ENV=production` (see `src/lib/auth.ts`), so login works locally too.
- The SQLite file lives at `./data/akort.db` (gitignored) — delete it to start over from a clean seed.

## Deploy

`docker compose up -d --build` builds and runs two containers: `astrowind` (the app; not published to the host directly) and `caddy` (public HTTPS entry point — see `Caddyfile`, which lists the two domains it requests Let's Encrypt certs for). `./data` and `./public/uploads` are bind-mounted so the database and uploaded images survive rebuilds.
