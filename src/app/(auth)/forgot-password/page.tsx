"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Mail01 } from "@untitledui/icons";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/base/buttons/button";
import { Card } from "@/components/ui/card";
import { FormInput } from "@/components/ui/form-fields";
import { mensajeError } from "@/lib/utils/error-handler";
import { recuperarSchema } from "@/lib/utils/validators";
import { authService } from "@/services/auth.service";
import type { z } from "zod";

type Input = z.infer<typeof recuperarSchema>;

export default function ForgotPasswordPage() {
    const [enviado, setEnviado] = useState(false);
    const { control, handleSubmit, formState } = useForm<Input>({
        resolver: zodResolver(recuperarSchema),
        defaultValues: { correo: "" },
    });

    const onSubmit = async (data: Input) => {
        try {
            await authService.resetPassword(data.correo);
            setEnviado(true);
            toast.success("Te enviamos un enlace de recuperación.");
        } catch (e) {
            toast.error(mensajeError(e));
        }
    };

    return (
        <Card className="p-8">
            <h1 className="text-2xl font-semibold text-primary">Recuperar contraseña</h1>
            <p className="mt-1 text-sm text-tertiary">Te enviaremos un enlace para restablecerla.</p>

            {enviado ? (
                <p className="mt-6 rounded-lg bg-success-primary px-4 py-3 text-sm text-success-primary ring-1 ring-success">
                    Si el correo existe, recibirás un enlace para restablecer tu contraseña.
                </p>
            ) : (
                <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-4">
                    <FormInput control={control} name="correo" label="Correo electrónico" placeholder="tucorreo@ejemplo.com" icon={Mail01} type="email" isRequired />
                    <Button type="submit" size="lg" color="primary" isLoading={formState.isSubmitting}>
                        Enviar enlace
                    </Button>
                </form>
            )}

            <Link href="/login" className="mt-6 flex items-center justify-center gap-1 text-sm font-semibold text-brand-secondary hover:underline">
                <ArrowLeft className="size-4" /> Volver a iniciar sesión
            </Link>
        </Card>
    );
}
