"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";
import { Button } from "@/components/base/buttons/button";
import { Card } from "@/components/ui/card";
import { FormInput } from "@/components/ui/form-fields";
import { mensajeError } from "@/lib/utils/error-handler";
import { nuevaPasswordSchema } from "@/lib/utils/validators";
import { authService } from "@/services/auth.service";

type Input = z.infer<typeof nuevaPasswordSchema>;

export default function ResetPasswordPage() {
    const router = useRouter();
    const { control, handleSubmit, formState } = useForm<Input>({
        resolver: zodResolver(nuevaPasswordSchema),
        defaultValues: { password: "", confirmar: "" },
    });

    const onSubmit = async (data: Input) => {
        try {
            await authService.updatePassword(data.password);
            toast.success("Contraseña actualizada. Inicia sesión.");
            router.replace("/login");
        } catch (e) {
            toast.error(mensajeError(e));
        }
    };

    return (
        <Card className="p-8">
            <h1 className="text-2xl font-semibold text-primary">Nueva contraseña</h1>
            <p className="mt-1 text-sm text-tertiary">Define tu nueva contraseña de acceso.</p>

            <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-4">
                <FormInput control={control} name="password" label="Nueva contraseña" placeholder="Mínimo 8 caracteres" type="password" isRequired />
                <FormInput control={control} name="confirmar" label="Confirmar contraseña" placeholder="Repite la contraseña" type="password" isRequired />
                <Button type="submit" size="lg" color="primary" isLoading={formState.isSubmitting}>
                    Guardar contraseña
                </Button>
            </form>
        </Card>
    );
}
