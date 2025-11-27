"use server";

import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { getTranslations } from "next-intl/server";

// Schema for updating name
const updateNameSchema = z.object({
    name: z.string().min(1, "Name is required"),
});

// Schema for updating password
const updatePasswordSchema = z.object({
    currentPassword: z.string().min(6, "Password must be at least 6 characters"),
    newPassword: z.string().min(6, "Password must be at least 6 characters"),
});

export type ActionState = {
    errors?: {
        name?: string[];
        currentPassword?: string[];
        newPassword?: string[];
        _form?: string[];
    };
    message?: string;
    success?: boolean;
};

export async function updateName(
    prevState: ActionState,
    formData: FormData
): Promise<ActionState> {
    const t = await getTranslations("profile.updateName");
    const session = await auth();

    if (!session?.user?.id) {
        return { message: t("unauthorized") };
    }

    const validatedFields = updateNameSchema.safeParse({
        name: formData.get("name"),
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: t("invalidFields"),
        };
    }

    try {
        await prisma.user.update({
            where: { id: session.user.id },
            data: { name: validatedFields.data.name },
        });
    } catch (error) {
        return { message: t("error") };
    }

    revalidatePath("/[locale]/profile", "page");
    return { success: true, message: t("success") };
}

export async function updatePassword(
    prevState: ActionState,
    formData: FormData
): Promise<ActionState> {
    const t = await getTranslations("profile.changePassword");
    const session = await auth();

    if (!session?.user?.id) {
        return { message: t("error") };
    }

    const validatedFields = updatePasswordSchema.safeParse({
        currentPassword: formData.get("currentPassword"),
        newPassword: formData.get("newPassword"),
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: "Invalid fields.",
        };
    }

    const { currentPassword, newPassword } = validatedFields.data;

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
    });

    if (!user || !user.password) {
        return { message: t("userNotFound") };
    }

    const passwordsMatch = await bcrypt.compare(currentPassword, user.password);

    if (!passwordsMatch) {
        return {
            errors: { currentPassword: [t("incorrectPassword")] },
            message: t("error"),
        };
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    try {
        await prisma.user.update({
            where: { id: session.user.id },
            data: { password: hashedPassword },
        });
    } catch (error) {
        return { message: t("error") };
    }

    revalidatePath("/[locale]/profile", "page");
    return { success: true, message: t("success") };
}
