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
import { updatePassword, ActionState } from "@/app/[locale]/(dashboard)/profile/actions";
import { useActionState, useEffect, startTransition, useRef } from "react";
import { useTranslations } from "next-intl";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const changePasswordSchema = z.object({
    currentPassword: z.string().min(6, "Password must be at least 6 characters"),
    newPassword: z.string().min(6, "Password must be at least 6 characters"),
});

type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;

interface ChangePasswordFormProps {
    onSuccess?: () => void;
}

export function ChangePasswordForm({ onSuccess }: ChangePasswordFormProps) {
    const t = useTranslations("profile.changePassword");
    const tCommon = useTranslations("profile.common");
    const { toast } = useToast();
    const [state, formAction, isPending] = useActionState(updatePassword, {} as ActionState);
    const lastStateRef = useRef(state);

    const form = useForm<ChangePasswordFormValues>({
        resolver: zodResolver(changePasswordSchema),
        defaultValues: {
            currentPassword: "",
            newPassword: "",
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
                form.reset();
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

        if (state.errors) {
            if (state.errors.currentPassword) {
                form.setError("currentPassword", { message: state.errors.currentPassword[0] });
            }
            if (state.errors.newPassword) {
                form.setError("newPassword", { message: state.errors.newPassword[0] });
            }
        }
    }, [state, toast, form, onSuccess, tCommon]);

    const onSubmit = async (data: ChangePasswordFormValues) => {
        const formData = new FormData();
        formData.append("currentPassword", data.currentPassword);
        formData.append("newPassword", data.newPassword);

        startTransition(() => {
            formAction(formData);
        });
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="currentPassword"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t("currentPassword")}</FormLabel>
                            <FormControl>
                                <Input type="password" placeholder={t("placeholder")} {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="newPassword"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t("newPassword")}</FormLabel>
                            <FormControl>
                                <Input type="password" placeholder={t("placeholder")} {...field} />
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
