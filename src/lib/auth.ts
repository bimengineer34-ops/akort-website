import crypto from 'node:crypto';
import { eq, lt } from 'drizzle-orm';
import { db } from '~/db/client';
import { sessions, users } from '~/db/schema';

export const SESSION_COOKIE = 'akort_session';
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

const scrypt = (password: string, salt: string): Promise<Buffer> =>
  new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey);
    });
  });

export const hashPassword = async (password: string): Promise<string> => {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = await scrypt(password, salt);
  return `${salt}:${derived.toString('hex')}`;
};

export const verifyPassword = async (password: string, stored: string): Promise<boolean> => {
  const [salt, hashHex] = stored.split(':');
  if (!salt || !hashHex) return false;
  const derived = await scrypt(password, salt);
  const storedBuf = Buffer.from(hashHex, 'hex');
  if (derived.length !== storedBuf.length) return false;
  return crypto.timingSafeEqual(derived, storedBuf);
};

export const generateRandomPassword = (): string => crypto.randomBytes(12).toString('base64url');

export const createSession = (userId: number): string => {
  const token = crypto.randomBytes(32).toString('hex');
  db.insert(sessions)
    .values({ id: token, userId, expiresAt: new Date(Date.now() + SESSION_TTL_MS) })
    .run();
  return token;
};

export const destroySession = (token: string): void => {
  db.delete(sessions).where(eq(sessions.id, token)).run();
};

export interface SessionUser {
  id: number;
  username: string;
}

export const getUserForSession = (token: string | undefined): SessionUser | null => {
  if (!token) return null;

  // Opportunistic cleanup of expired sessions.
  db.delete(sessions).where(lt(sessions.expiresAt, new Date())).run();

  const row = db
    .select({ id: users.id, username: users.username, expiresAt: sessions.expiresAt })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(eq(sessions.id, token))
    .get();

  if (!row || row.expiresAt.getTime() < Date.now()) return null;
  return { id: row.id, username: row.username };
};

export const sessionCookieOptions = {
  path: '/',
  httpOnly: true,
  // Caddy terminates TLS in front of the app in production; `astro dev` runs
  // over plain HTTP locally, where a `secure` cookie would never be sent back.
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: SESSION_TTL_MS / 1000,
};
