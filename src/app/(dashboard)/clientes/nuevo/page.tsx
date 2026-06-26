"use client";

import { ArrowLeft } from "@untitledui/icons";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/base/buttons/button";
import { ClienteForm } from "@/components/business/cliente-form";
import { PageHeader } from "@/components/ui/page-header";
import type { ClienteInput } from "@/lib/utils/validators";
import { clientesService } from "@/services/clientes.service";

export default function NuevoClientePage() {
    const router = useRouter();

    const guardar = async (datos: ClienteInput) => {
        const c = await clientesService.crear(datos);
        toast.success("Cliente creado correctamente.");
        router.push(`/clientes/${c.id}`);
    };

    return (
        <div className="mx-auto max-w-3xl">
            <Button color="link-gray" iconLeading={ArrowLeft} href="/clientes" className="mb-4">
                Volver a clientes
            </Button>
            <PageHeader titulo="Nuevo cliente" descripcion="Registra un nuevo cliente del taller." />
            <ClienteForm onGuardar={guardar} onCancelar={() => router.push("/clientes")} textoBoton="Crear cliente" />
        </div>
    );
}
