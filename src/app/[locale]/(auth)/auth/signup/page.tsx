import Link from "next/link";
import { useTranslations } from "next-intl";
import { SignupForm } from "@/components/auth/signup-form";
import { LanguageToggle } from "@/components/language-toggle";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

export default function SignupPage({
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
                        <CardTitle className="text-2xl font-bold">
                            {t("signupTitle")}
                        </CardTitle>
                        <CardDescription className="mt-1">{t("signupDescription")}</CardDescription>
                    </div>
                    <LanguageToggle />
                </div>
            </CardHeader>
            <CardContent>
                <SignupForm />
            </CardContent>
            <CardFooter className="flex flex-col space-y-2">
                <div className="text-sm text-muted-foreground">
                    {t("hasAccount")}{" "}
                    <Link
                        href="/auth/login"
                        className="font-medium text-primary hover:underline"
                    >
                        {t("loginLink")}
                    </Link>
                </div>
            </CardFooter>
        </Card>
    );
}
