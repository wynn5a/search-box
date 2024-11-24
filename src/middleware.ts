import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale, localePrefix } from './config';

export default createMiddleware({
  locales,
  defaultLocale,
  localePrefix
});

export const config = {
  // Skip all paths that should not be internationalized
  matcher: ['/((?!api|_next|.*\\..*).*)']
};
