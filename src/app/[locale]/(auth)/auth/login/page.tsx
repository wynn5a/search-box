import Link from "next/link";
import { useTranslations } from "next-intl";
import { LoginForm } from "@/components/auth/login-form";
import { LanguageToggle } from "@/components/language-toggle";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

export default function LoginPage({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const t = useTranslations("auth");

    return (
        <Card>
            <CardHeader className="space-y-1">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <CardTitle className="text-2xl font-bold">{t("loginTitle")}</CardTitle>
                        <CardDescription className="mt-1">{t("loginDescription")}</CardDescription>
                    </div>
                    <LanguageToggle />
                </div>
            </CardHeader>
            <CardContent>
                <LoginForm />
            </CardContent>
            <CardFooter className="flex flex-col space-y-2">
                <div className="text-sm text-muted-foreground">
                    {t("noAccount")}{" "}
                    <Link
                        href="/auth/signup"
                        className="font-medium text-primary hover:underline"
                    >
                        {t("signupLink")}
                    </Link>
                </div>
            </CardFooter>
        </Card>
    );
}
