"use client";

import { Suspense } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { LogIn01, Mail01 } from "@untitledui/icons";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/base/buttons/button";
import { Card } from "@/components/ui/card";
import { FormInput } from "@/components/ui/form-fields";
import { DASHBOARD_POR_ROL } from "@/lib/constants";
import { mensajeError } from "@/lib/utils/error-handler";
import { loginSchema, type LoginInput } from "@/lib/utils/validators";
import { authService } from "@/services/auth.service";

function LoginForm() {
    const router = useRouter();
    const params = useSearchParams();
    const { control, handleSubmit, formState } = useForm<LoginInput>({
        resolver: zodResolver(loginSchema),
        defaultValues: { correo: "", password: "" },
    });

    const onSubmit = async (data: LoginInput) => {
        try {
            await authService.login(data.correo, data.password);
            const user = await authService.getUsuarioActual();
            const perfil = user ? await authService.getPerfil(user.id) : null;

            // Cuenta desactivada por el administrador: no se permite el acceso.
            if (perfil && perfil.activo === false) {
                await authService.logout();
                toast.error("Tu cuenta está desactivada. Contacta al administrador.");
                return;
            }

            toast.success(`Bienvenido, ${perfil?.nombre ?? ""}`.trim());
            const redirect = params.get("redirect");
            router.replace(redirect || DASHBOARD_POR_ROL[perfil?.rol ?? "cliente"]);
        } catch (e) {
            toast.error(mensajeError(e));
        }
    };

    return (
        <Card className="p-8">
            <h1 className="text-2xl font-semibold text-primary">Iniciar sesión</h1>
            <p className="mt-1 text-sm text-tertiary">Accede a tu cuenta de GaraGato.</p>

            <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-4">
                <FormInput control={control} name="correo" label="Correo electrónico" placeholder="tucorreo@ejemplo.com" icon={Mail01} type="email" isRequired />
                <FormInput control={control} name="password" label="Contraseña" placeholder="••••••••" type="password" isRequired />
                <div className="flex justify-end">
                    <Link href="/forgot-password" className="text-sm font-semibold text-brand-secondary hover:underline">
                        ¿Olvidaste tu contraseña?
                    </Link>
                </div>
                <Button type="submit" size="lg" color="primary" iconLeading={LogIn01} isLoading={formState.isSubmitting}>
                    Entrar
                </Button>
            </form>

            <p className="mt-6 text-center text-sm text-tertiary">
                ¿No tienes cuenta?{" "}
                <Link href="/register" className="font-semibold text-brand-secondary hover:underline">
                    Regístrate
                </Link>
            </p>
        </Card>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={null}>
            <LoginForm />
        </Suspense>
    );
}
