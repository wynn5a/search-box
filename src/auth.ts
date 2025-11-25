import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { authConfig } from "./auth.config";
import { z } from "zod";

const prisma = new PrismaClient();

export const { handlers, auth, signIn, signOut } = NextAuth({
    ...authConfig,
    adapter: PrismaAdapter(prisma),
    session: { strategy: "jwt" },
    callbacks: {
        ...authConfig.callbacks,
        async jwt({ token, user }) {
            // Include user id in the token when user first signs in
            if (user) {
                token.id = user.id || '';
                token.role = user.role;
            }
            return token;
        },
        async session({ session, token }) {
            // Add user id and role to the session object
            if (session.user && token.id) {
                session.user.id = token.id as string;
                session.user.role = token.role as string;

                // Fetch fresh user data from database to ensure name is up to date
                const user = await prisma.user.findUnique({
                    where: { id: token.id as string },
                    select: { name: true, email: true, role: true }
                });

                if (user) {
                    session.user.name = user.name;
                    session.user.email = user.email;
                    session.user.role = user.role as string; // Ensure role is updated too
                }
            }
            return session;
        },
    },
    providers: [
        Credentials({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                const parsedCredentials = z
                    .object({
                        email: z.string().email(),
                        password: z.string().min(6)
                    })
                    .safeParse(credentials);

                if (!parsedCredentials.success) {
                    return null;
                }

                const { email, password } = parsedCredentials.data;

                const user = await prisma.user.findUnique({
                    where: { email },
                });

                if (!user || !user.password) {
                    return null;
                }

                const passwordsMatch = await bcrypt.compare(password, user.password);

                if (!passwordsMatch) {
                    return null;
                }

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                };
            },
        }),
    ],
});
