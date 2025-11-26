"use client";

import { useState } from "react";
import { useRouter } from "@/routing";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslations } from "next-intl";

const signupSchema = z
    .object({
        email: z.string().email("Invalid email address"),
        name: z.string().optional(),
        password: z.string().min(6, "Password must be at least 6 characters"),
        confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords don't match",
        path: ["confirmPassword"],
    });

type SignupFormData = z.infer<typeof signupSchema>;

export function SignupForm() {
    const [error, setError] = useState<string>("");
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const t = useTranslations("auth");

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<SignupFormData>({
        resolver: zodResolver(signupSchema),
    });

    const onSubmit = async (data: SignupFormData) => {
        setIsLoading(true);
        setError("");

        try {
            const response = await fetch("/api/auth/signup", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email: data.email,
                    password: data.password,
                    name: data.name,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                setError(result.error || t("signupError"));
                return;
            }

            // Auto-login after successful signup
            const signInResult = await signIn("credentials", {
                email: data.email,
                password: data.password,
                redirect: false,
            });

            if (signInResult?.error) {
                // Signup succeeded but login failed, redirect to login page
                router.push("/auth/login");
            } else {
                router.push("/");
                router.refresh();
            }
        } catch (error) {
            setError(t("signupError"));
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
                <Label htmlFor="name">{t("name")}</Label>
                <Input
                    id="name"
                    type="text"
                    placeholder={t("namePlaceholder")}
                    {...register("name")}
                    disabled={isLoading}
                />
                {errors.name && (
                    <p className="text-sm text-destructive">{errors.name.message}</p>
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

            <div className="space-y-2">
                <Label htmlFor="confirmPassword">{t("confirmPassword")}</Label>
                <Input
                    id="confirmPassword"
                    type="password"
                    placeholder={t("confirmPasswordPlaceholder")}
                    {...register("confirmPassword")}
                    disabled={isLoading}
                />
                {errors.confirmPassword && (
                    <p className="text-sm text-destructive">
                        {errors.confirmPassword.message}
                    </p>
                )}
            </div>

            {error && (
                <div className="rounded-md bg-destructive/10 p-3">
                    <p className="text-sm text-destructive">{error}</p>
                </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? t("signingUp") : t("signup")}
            </Button>
        </form>
    );
}
