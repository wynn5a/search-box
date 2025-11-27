import { auth } from "@/auth";
import { UpdateNameDialog } from "@/components/profile/update-name-dialog";
import { ChangePasswordDialog } from "@/components/profile/change-password-dialog";
import { Separator } from "@/components/ui/separator";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";

export default async function ProfilePage({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    const session = await auth();

    if (!session?.user) {
        redirect(`/${locale}/auth/login`);
    }

    const t = await getTranslations("profile");

    return (
        <div className="space-y-6 p-10 pb-16 md:block">
            <div className="space-y-0.5">
                <h2 className="text-2xl font-bold tracking-tight">{t("title")}</h2>
                <p className="text-muted-foreground">
                    {t("description")}
                </p>
            </div>
            <Separator />
            <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
                <div className="flex-1 lg:max-w-2xl">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>{t("personalInfo.title")}</CardTitle>
                                    <CardDescription>{t("personalInfo.description")}</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid gap-1">
                                <Label className="text-muted-foreground">{t("fields.name")}</Label>
                                <div className="flex items-center justify-between">
                                    <div className="font-medium">{session.user.name}</div>
                                    <UpdateNameDialog initialName={session.user.name || ""} />
                                </div>
                            </div>
                            <div className="grid gap-1">
                                <Label className="text-muted-foreground">{t("fields.email")}</Label>
                                <div className="font-medium">{session.user.email}</div>
                            </div>
                            <div className="grid gap-1">
                                <Label className="text-muted-foreground">{t("fields.role")}</Label>
                                <div className="font-medium">{session.user.role}</div>
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between">
                                <div>
                                    <Label className="text-base">{t("fields.password")}</Label>
                                    <p className="text-sm text-muted-foreground">
                                        {t("fields.passwordDescription")}
                                    </p>
                                </div>
                                <ChangePasswordDialog />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
