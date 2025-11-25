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
import { useActionState, useEffect, useState, startTransition } from "react";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const updateNameSchema = z.object({
    name: z.string().min(1, "Name is required"),
});

type UpdateNameFormValues = z.infer<typeof updateNameSchema>;

interface UpdateNameFormProps {
    initialName: string;
    onSuccess?: () => void;
}

export function UpdateNameForm({ initialName, onSuccess }: UpdateNameFormProps) {
    const { toast } = useToast();
    const [state, formAction, isPending] = useActionState(updateName, {} as ActionState);
    // const [isPending, setIsPending] = useState(false); // useActionState provides isPending

    const form = useForm<UpdateNameFormValues>({
        resolver: zodResolver(updateNameSchema),
        defaultValues: {
            name: initialName,
        },
    });

    useEffect(() => {
        if (state.message) {
            if (state.success) {
                toast({
                    title: "Success",
                    description: state.message,
                });
                if (onSuccess) {
                    onSuccess();
                }
            } else {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: state.message,
                });
            }
            // setIsPending(false); // Handled by useActionState
        }

        if (state.errors?.name) {
            form.setError("name", { message: state.errors.name[0] });
        }
    }, [state, toast, form, onSuccess]);

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
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                                <Input placeholder="Your name" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <div className="flex justify-end">
                    <Button type="submit" disabled={isPending}>
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save
                    </Button>
                </div>
            </form>
        </Form>
    );
}
