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
import { UpdateNameForm } from "./update-name-form";
import { Pencil } from "lucide-react";

interface UpdateNameDialogProps {
    initialName: string;
}

export function UpdateNameDialog({ initialName }: UpdateNameDialogProps) {
    const t = useTranslations("profile.updateName");
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Pencil className="h-4 w-4" />
                    <span className="sr-only">{t("trigger")}</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{t("title")}</DialogTitle>
                    <DialogDescription>
                        {t("description")}
                    </DialogDescription>
                </DialogHeader>
                <UpdateNameForm initialName={initialName} onSuccess={() => setOpen(false)} />
            </DialogContent>
        </Dialog>
    );
}
