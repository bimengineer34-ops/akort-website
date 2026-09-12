// Minimal OAuth provider for Decap CMS's `backend: github` external-auth flow.
// No framework dependency on purpose: this handles a GitHub client secret, so
// keeping it small and auditable matters more than convenience.
//
// Required env vars:
//   GITHUB_CLIENT_ID      - from your GitHub OAuth App
//   GITHUB_CLIENT_SECRET  - from your GitHub OAuth App
//   PUBLIC_SITE_URL       - the site's public origin, e.g. https://www.akortmuhendislik.com
//                           (must match the OAuth App's "Authorization callback URL"
//                           host, and must be the same origin Decap's admin page runs on)
// Optional:
//   PORT                  - default 8081
//   OAUTH_SCOPE           - default "repo"

import http from 'node:http';
import https from 'node:https';
import crypto from 'node:crypto';
import { URL } from 'node:url';

const { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, PUBLIC_SITE_URL, PORT = '8081', OAUTH_SCOPE = 'repo' } = process.env;

for (const [name, value] of Object.entries({ GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, PUBLIC_SITE_URL })) {
  if (!value) {
    console.error(`Missing required env var: ${name}`);
    process.exit(1);
  }
}

const CALLBACK_PATH = '/oauth/callback';
const AUTH_PATH = '/oauth/auth';

// Stateless CSRF token: HMAC of a timestamp, so we don't need server-side
// session storage. Valid for 10 minutes.
const STATE_TTL_MS = 10 * 60 * 1000;
const signState = (ts) => crypto.createHmac('sha256', GITHUB_CLIENT_SECRET).update(String(ts)).digest('hex');
const makeState = () => {
  const ts = Date.now();
  return `${ts}.${signState(ts)}`;
};
const verifyState = (state) => {
  if (typeof state !== 'string' || !state.includes('.')) return false;
  const [ts, sig] = state.split('.');
  if (!ts || !sig) return false;
  if (Date.now() - Number(ts) > STATE_TTL_MS) return false;
  const expected = signState(Number(ts));
  return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
};

const postJson = (urlStr, body) =>
  new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const data = JSON.stringify(body);
    const req = https.request(
      {
        hostname: url.hostname,
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'Content-Length': Buffer.byteLength(data),
          'User-Agent': 'akort-oauth-provider',
        },
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => (raw += chunk));
        res.on('end', () => {
          try {
            resolve(JSON.parse(raw));
          } catch (err) {
            reject(err);
          }
        });
      }
    );
    req.on('error', reject);
    req.write(data);
    req.end();
  });

const html = (body) => `<!doctype html><html><body>${body}</body></html>`;

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `${PUBLIC_SITE_URL}`);

  if (url.pathname === AUTH_PATH) {
    const redirectUri = `${PUBLIC_SITE_URL}${CALLBACK_PATH}`;
    const authorizeUrl = new URL('https://github.com/login/oauth/authorize');
    authorizeUrl.searchParams.set('client_id', GITHUB_CLIENT_ID);
    authorizeUrl.searchParams.set('redirect_uri', redirectUri);
    authorizeUrl.searchParams.set('scope', OAUTH_SCOPE);
    authorizeUrl.searchParams.set('state', makeState());
    res.writeHead(302, { Location: authorizeUrl.toString() });
    res.end();
    return;
  }

  if (url.pathname === CALLBACK_PATH) {
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');

    if (!code || !verifyState(state)) {
      res.writeHead(400, { 'Content-Type': 'text/html' });
      res.end(html('<p>Invalid or expired login attempt. Close this window and try again.</p>'));
      return;
    }

    try {
      const tokenResponse = await postJson('https://github.com/login/oauth/access_token', {
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: `${PUBLIC_SITE_URL}${CALLBACK_PATH}`,
      });

      if (!tokenResponse.access_token) {
        res.writeHead(400, { 'Content-Type': 'text/html' });
        res.end(html(`<p>GitHub login failed: ${tokenResponse.error_description ?? 'unknown error'}</p>`));
        return;
      }

      const payload = JSON.stringify({ token: tokenResponse.access_token, provider: 'github' });
      // Standard Decap/Netlify CMS external-OAuth handshake: the popup waits
      // for a ping from the opener, then replies with the token, targeted at
      // the opener's own origin (never "*") once we know it.
      const script = `
        (function() {
          function receiveMessage(e) {
            window.opener.postMessage(
              'authorization:github:success:${payload.replace(/'/g, "\\'")}',
              e.origin
            );
            window.removeEventListener('message', receiveMessage, false);
          }
          window.addEventListener('message', receiveMessage, false);
          window.opener.postMessage('authorizing:github', '*');
        })();
      `;
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(html(`<script>${script}</script><p>Giriş başarılı, bu pencere kapanabilir.</p>`));
    } catch (err) {
      console.error('OAuth callback error:', err);
      res.writeHead(500, { 'Content-Type': 'text/html' });
      res.end(html('<p>Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.</p>'));
    }
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not found');
});

server.listen(Number(PORT), () => {
  console.log(`OAuth provider listening on :${PORT} (public URL: ${PUBLIC_SITE_URL})`);
});
