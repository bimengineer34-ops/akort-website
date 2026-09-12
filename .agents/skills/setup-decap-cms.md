# Set Up Decap CMS (self-hosted, GitHub backend)

The admin panel lives at `/admin` (`public/admin/index.html` + `config.yml`). This project is **self-hosted** (Docker/nginx, not Netlify), so it uses Decap's `github` backend with a small self-hosted OAuth provider (`oauth-server/`) instead of Netlify's Git Gateway.

## How it fits together

1. `public/admin/config.yml` — `backend.name: github`, `backend.repo`, `backend.base_url` (the site's public URL) and `backend.auth_endpoint: oauth/auth`.
2. `oauth-server/server.mjs` — a dependency-free Node HTTP server implementing the two endpoints Decap's external-OAuth flow needs: `GET /oauth/auth` (redirects to GitHub) and `GET /oauth/callback` (exchanges the code for a token, posts it back to the admin page via `window.opener.postMessage`).
3. `nginx/nginx.conf` — proxies `/oauth/` to the `oauth` service (`docker-compose.yml`) so both the site and the OAuth dance share one public origin.
4. `.env` (never committed — see `.env.example`) — `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `PUBLIC_SITE_URL`.

## One-time setup

1. Deploy the site (Docker Compose brings up both `astrowind` and `oauth`).
2. On GitHub: [Settings → Developer settings → OAuth Apps → New OAuth App](https://github.com/settings/developers).
   - Homepage URL: your site's public URL.
   - Authorization callback URL: `<public URL>/oauth/callback`.
3. Copy `.env.example` to `.env` on the server and fill in `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `PUBLIC_SITE_URL`.
4. In `public/admin/config.yml`, set `backend.base_url` to the same public URL.
5. `docker compose up -d --build` (or redeploy).
6. Open `https://your-domain/admin`, click login — it redirects to GitHub, then back, and Decap opens with write access to the repo.

## Collections

| Collection                 | Edits                                                                                                                                                                                                                                                                      |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `post`                     | `src/data/post/*.md` (Bilgi Merkezi articles)                                                                                                                                                                                                                              |
| `project`                  | `src/data/project/*.md` (Projeler case studies)                                                                                                                                                                                                                            |
| `navigation` (single file) | `src/navigation.data.yaml` — header/footer menus, social links, contact details                                                                                                                                                                                            |
| `settings` (single file)   | `src/config.yaml` — **only** site name/URL, SEO title/description, Google Analytics ID. `apps.blog`, `i18n`, `ui` and the rest of `config.yaml` are intentionally left out of the schema (editing them from the panel could break the blog URL structure or i18n settings) |

Editing anything through the panel is a git commit to `main` — the host must be configured to rebuild/redeploy on push (or someone triggers a redeploy manually) for changes to go live.

## Extending

- Fields for `post`/`project` must match `src/content.config.ts`'s zod schema; add a field in both places together.
- To expose more of a page's copy in the panel, move that copy out of the `.astro` file and into a small YAML/Markdown data file the page imports — same pattern as `navigation.data.yaml` (loaded via a Vite `?raw` import + `js-yaml`, see `src/navigation.ts`). Don't add more fields to the `settings` file collection for anything that affects routing (blog `pathname`, `permalink`, `base`, `trailingSlash`) — those stay code-only.
- `media_folder`/`public_folder` are set so uploaded images are written as `~/assets/images/<file>` strings, which `findImage()` (see `src/utils/images.ts`) resolves and optimises through Sharp at build time.
