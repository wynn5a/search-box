"use client";

import { usePathname } from "@/routing";

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isAuthPage = pathname?.includes("/auth/");

    if (isAuthPage) {
        return (
            <div className="flex min-h-screen items-center justify-center p-4">
                <div className="w-full max-w-md">{children}</div>
            </div>
        );
    }

    return children;
}
