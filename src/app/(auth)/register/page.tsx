"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle, Mail01, Phone, User01, UserPlus01 } from "@untitledui/icons";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/base/buttons/button";
import { Card } from "@/components/ui/card";
import { FormInput } from "@/components/ui/form-fields";
import { mensajeError } from "@/lib/utils/error-handler";
import { registroSchema, type RegistroInput } from "@/lib/utils/validators";
import { authService } from "@/services/auth.service";

export default function RegisterPage() {
    const [registrado, setRegistrado] = useState(false);
    const { control, handleSubmit, formState } = useForm<RegistroInput>({
        resolver: zodResolver(registroSchema),
        defaultValues: { nombre: "", correo: "", telefono: "", password: "", confirmar: "" },
    });

    const onSubmit = async (data: RegistroInput) => {
        try {
            await authService.register({
                nombre: data.nombre,
                correo: data.correo,
                password: data.password,
                telefono: data.telefono,
            });
            setRegistrado(true);
            toast.success("Cuenta creada. Revisa tu correo para verificarla.");
        } catch (e) {
            toast.error(mensajeError(e));
        }
    };

    if (registrado) {
        return (
            <Card className="p-8 text-center">
                <CheckCircle className="mx-auto size-12 text-success-primary" />
                <h1 className="mt-4 text-2xl font-semibold text-primary">¡Cuenta creada!</h1>
                <p className="mt-2 text-sm text-tertiary">
                    Te enviamos un correo de verificación. Confírmalo para activar tu cuenta.
                </p>
                <Button color="primary" href="/login" className="mt-6 w-full">
                    Ir a iniciar sesión
                </Button>
            </Card>
        );
    }

    return (
        <Card className="p-8">
            <h1 className="text-2xl font-semibold text-primary">Crear cuenta</h1>
            <p className="mt-1 text-sm text-tertiary">Regístrate para gestionar tus vehículos y citas.</p>

            <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-4">
                <FormInput control={control} name="nombre" label="Nombre completo" placeholder="Tu nombre" icon={User01} isRequired />
                <FormInput control={control} name="correo" label="Correo electrónico" placeholder="tucorreo@ejemplo.com" icon={Mail01} type="email" isRequired />
                <FormInput control={control} name="telefono" label="Teléfono" placeholder="Tu teléfono" icon={Phone} />
                <FormInput control={control} name="password" label="Contraseña" placeholder="Mínimo 8 caracteres" type="password" isRequired />
                <FormInput control={control} name="confirmar" label="Confirmar contraseña" placeholder="Repite la contraseña" type="password" isRequired />
                <Button type="submit" size="lg" color="primary" iconLeading={UserPlus01} isLoading={formState.isSubmitting}>
                    Crear cuenta
                </Button>
            </form>

            <p className="mt-6 text-center text-sm text-tertiary">
                ¿Ya tienes cuenta?{" "}
                <Link href="/login" className="font-semibold text-brand-secondary hover:underline">
                    Inicia sesión
                </Link>
            </p>
        </Card>
    );
}
