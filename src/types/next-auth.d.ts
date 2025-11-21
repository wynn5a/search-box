import { DefaultSession, DefaultUser } from "next-auth";
import { DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            role: string;
        } & DefaultSession["user"];
    }

    interface User extends DefaultUser {
        role: string;
    }
}

declare module "@auth/core/adapters" {
    interface AdapterUser extends DefaultUser {
        role: string;
    }
}

declare module "@auth/prisma-adapter" {
    export function PrismaAdapter(client: any): any;
}

declare module "next-auth/jwt" {
    interface JWT extends DefaultJWT {
        id: string;
        role: string;
    }
}
