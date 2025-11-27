"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { ChangePasswordForm } from "./change-password-form";
import { Lock } from "lucide-react";

export function ChangePasswordDialog() {
    const t = useTranslations("profile.changePassword");
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <Lock className="mr-2 h-4 w-4" />
                    {t("trigger")}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{t("title")}</DialogTitle>
                    <DialogDescription>
                        {t("description")}
                    </DialogDescription>
                </DialogHeader>
                <ChangePasswordForm onSuccess={() => setOpen(false)} />
            </DialogContent>
        </Dialog>
    );
}
