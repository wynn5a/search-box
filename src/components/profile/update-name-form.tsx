"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { updateName, ActionState } from "@/app/[locale]/(dashboard)/profile/actions";
import { useActionState, useEffect, useState, startTransition, useRef } from "react";
import { useTranslations } from "next-intl";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";

const updateNameSchema = z.object({
    name: z.string().min(1, "Name is required"),
});

type UpdateNameFormValues = z.infer<typeof updateNameSchema>;

interface UpdateNameFormProps {
    initialName: string;
    onSuccess?: () => void;
}

export function UpdateNameForm({ initialName, onSuccess }: UpdateNameFormProps) {
    const t = useTranslations("profile.updateName");
    const tCommon = useTranslations("profile.common");
    const { toast } = useToast();
    const { update } = useSession();
    const [state, formAction, isPending] = useActionState(updateName, {} as ActionState);
    const lastStateRef = useRef(state);

    const form = useForm<UpdateNameFormValues>({
        resolver: zodResolver(updateNameSchema),
        defaultValues: {
            name: initialName,
        },
    });

    useEffect(() => {
        if (state === lastStateRef.current) return;
        lastStateRef.current = state;

        if (state.message) {
            if (state.success) {
                toast({
                    title: tCommon("success"),
                    description: state.message,
                });
                // Update the session to reflect the new name immediately
                update();
                if (onSuccess) {
                    onSuccess();
                }
            } else {
                toast({
                    variant: "destructive",
                    title: tCommon("error"),
                    description: state.message,
                });
            }
        }

        if (state.errors?.name) {
            form.setError("name", { message: state.errors.name[0] });
        }
    }, [state, toast, form, onSuccess, update, tCommon]);

    const onSubmit = async (data: UpdateNameFormValues) => {
        const formData = new FormData();
        formData.append("name", data.name);
        startTransition(() => {
            formAction(formData);
        });
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t("label")}</FormLabel>
                            <FormControl>
                                <Input placeholder={t("placeholder")} {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <div className="flex justify-end">
                    <Button type="submit" disabled={isPending}>
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {t("save")}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
