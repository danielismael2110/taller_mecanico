"use client";

import { Mail01 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { Card } from "@/components/ui/card";

/** Confirmación de verificación de correo. */
export default function VerifyEmailPage() {
    return (
        <Card className="p-8 text-center">
            <Mail01 className="mx-auto size-12 text-brand-secondary" />
            <h1 className="mt-4 text-2xl font-semibold text-primary">Verifica tu correo</h1>
            <p className="mt-2 text-sm text-tertiary">
                Hemos abierto este enlace desde tu bandeja de entrada. Si tu cuenta ya fue confirmada, inicia sesión para continuar.
            </p>
            <Button color="primary" href="/login" className="mt-6 w-full">
                Iniciar sesión
            </Button>
        </Card>
    );
}
