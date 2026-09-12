import type { APIRoute } from 'astro';
import { destroySession, SESSION_COOKIE } from '~/lib/auth';

export const prerender = false;

export const POST: APIRoute = ({ cookies, redirect }) => {
  const token = cookies.get(SESSION_COOKIE)?.value;
  if (token) destroySession(token);
  cookies.delete(SESSION_COOKIE, { path: '/' });
  return redirect('/admin/login');
};
