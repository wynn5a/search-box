"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, LogOut } from "lucide-react";
import { Link } from "@/routing";

/**
 * Get user initials from name or email
 */
function getUserInitials(name?: string | null, email?: string | null): string {
    if (name) {
        const parts = name.trim().split(/\s+/);
        if (parts.length >= 2) {
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        }
        return name.slice(0, 2).toUpperCase();
    }
    if (email) {
        return email.slice(0, 2).toUpperCase();
    }
    return "U";
}

export function UserMenu() {
    const { data: session, status } = useSession();
    const t = useTranslations("auth");
    const [showSignOutDialog, setShowSignOutDialog] = useState(false);

    if (status === "loading") {
        return (
            <Avatar className="h-8 w-8 cursor-not-allowed opacity-50">
                <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                    ...
                </AvatarFallback>
            </Avatar>
        );
    }

    // Don't show login/signup buttons - users will be on auth pages anyway
    if (!session?.user) {
        return null;
    }

    const handleSignOut = async () => {
        await signOut({ callbackUrl: "/auth/login" });
        setShowSignOutDialog(false);
    };

    const initials = getUserInitials(session.user.name, session.user.email);

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full p-0">
                        <Avatar className="h-8 w-8">
                            <AvatarImage 
                                src={session.user.image || undefined} 
                                alt={session.user.name || "User avatar"} 
                            />
                            <AvatarFallback className="bg-primary text-primary-foreground text-xs font-medium">
                                {initials}
                            </AvatarFallback>
                        </Avatar>
                        <span className="sr-only">User menu</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                        <div className="flex flex-col space-y-1">
                            <p className="text-sm font-medium leading-none">
                                {session.user.name || t("user")}
                            </p>
                            <p className="text-xs leading-none text-muted-foreground">
                                {session.user.email}
                            </p>
                        </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                        <Link href="/profile" className="cursor-pointer flex items-center">
                            <User className="mr-2 h-4 w-4" />
                            Profile
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        onClick={() => setShowSignOutDialog(true)}
                        className="cursor-pointer text-destructive focus:text-destructive"
                    >
                        <LogOut className="mr-2 h-4 w-4" />
                        {t("signOut")}
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <AlertDialog open={showSignOutDialog} onOpenChange={setShowSignOutDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t("signOutConfirmTitle")}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t("signOutConfirmDescription")}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                        <AlertDialogAction onClick={handleSignOut}>
                            {t("signOut")}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
