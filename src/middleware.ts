import { NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { authConfig } from "./auth.config";
import NextAuth from "next-auth";
import { locales, defaultLocale, localePrefix } from "./config";

const intlMiddleware = createIntlMiddleware({
  locales,
  defaultLocale,
  localePrefix,
});

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const pathname = req.nextUrl.pathname;

  // Extract locale from pathname
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  // Get the locale or default
  const locale = pathnameHasLocale
    ? pathname.split('/')[1]
    : defaultLocale;

  // Check if it's an auth page
  const isAuthPage = pathname.includes('/auth/');

  // If logged in and trying to access auth page, redirect to home
  if (req.auth && isAuthPage) {
    return Response.redirect(new URL(`/${locale}`, req.url));
  }

  // If not logged in and not on auth page, redirect to login
  if (!req.auth && !isAuthPage) {
    return Response.redirect(new URL(`/${locale}/auth/login`, req.url));
  }

  // Apply internationalization middleware
  return intlMiddleware(req);
});

export const config = {
  // Match all pathnames except for API routes and static files
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
