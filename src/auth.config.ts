import type { NextAuthConfig } from "next-auth";

export const authConfig = {
    pages: {
        signIn: "/auth/login",
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isOnAuth = nextUrl.pathname.includes("/auth/");

            if (isOnAuth) {
                if (isLoggedIn) {
                    // Redirect logged-in users away from auth pages to home
                    return Response.redirect(new URL("/", nextUrl));
                }
                return true; // Allow access to auth pages when not logged in
            }

            // Require authentication for all other pages
            if (!isLoggedIn) {
                return false; // Redirect to login via middleware
            }

            return true;
        },
    },
    providers: [], // Add providers with an empty array for now
} satisfies NextAuthConfig;
