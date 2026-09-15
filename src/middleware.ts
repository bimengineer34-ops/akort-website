import { defineMiddleware } from 'astro:middleware';
import { getUserForSession, SESSION_COOKIE } from '~/lib/auth';
import { isTrackablePageRequest, logPageView } from '~/lib/analytics';

export const onRequest = defineMiddleware((context, next) => {
  const { pathname } = context.url;
  if (!pathname.startsWith('/admin')) {
    if (isTrackablePageRequest(pathname, context.request.method, context.request.headers.get('accept'))) {
      logPageView(pathname);
    }
    return next();
  }

  const token = context.cookies.get(SESSION_COOKIE)?.value;
  const user = getUserForSession(token);
  context.locals.user = user;

  const isLoginPage = pathname === '/admin/login';
  if (!user && !isLoginPage) {
    return context.redirect('/admin/login');
  }
  if (user && isLoginPage) {
    return context.redirect('/admin');
  }
  return next();
});
