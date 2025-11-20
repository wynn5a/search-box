"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslations } from "next-intl";

const loginSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm() {
    const [error, setError] = useState<string>("");
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const t = useTranslations("auth");

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginFormData) => {
        setIsLoading(true);
        setError("");

        try {
            const result = await signIn("credentials", {
                email: data.email,
                password: data.password,
                redirect: false,
            });

            if (result?.error) {
                setError(t("loginError"));
            } else {
                router.push("/");
                router.refresh();
            }
        } catch (error) {
            setError(t("loginError"));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="email">{t("email")}</Label>
                <Input
                    id="email"
                    type="email"
                    placeholder={t("emailPlaceholder")}
                    {...register("email")}
                    disabled={isLoading}
                />
                {errors.email && (
                    <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
            </div>

            <div className="space-y-2">
                <Label htmlFor="password">{t("password")}</Label>
                <Input
                    id="password"
                    type="password"
                    placeholder={t("passwordPlaceholder")}
                    {...register("password")}
                    disabled={isLoading}
                />
                {errors.password && (
                    <p className="text-sm text-destructive">{errors.password.message}</p>
                )}
            </div>

            {error && (
                <div className="rounded-md bg-destructive/10 p-3">
                    <p className="text-sm text-destructive">{error}</p>
                </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? t("loggingIn") : t("login")}
            </Button>
        </form>
    );
}
