"use client";

import { useState } from "react";
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
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Pencil className="h-4 w-4" />
                    <span className="sr-only">Edit name</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit Name</DialogTitle>
                    <DialogDescription>
                        Update your public display name.
                    </DialogDescription>
                </DialogHeader>
                <UpdateNameForm initialName={initialName} onSuccess={() => setOpen(false)} />
            </DialogContent>
        </Dialog>
    );
}
