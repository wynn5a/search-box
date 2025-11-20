import { ReactNode } from "react";

export default function AuthGroupLayout({ children }: { children: ReactNode }) {
    return (
        <div className="flex min-h-screen items-center justify-center p-4">
            <div className="w-full max-w-md">{children}</div>
        </div>
    );
}
