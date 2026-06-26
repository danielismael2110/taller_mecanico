"use client";

import { useEffect, useState } from "react";
import { ArrowLeft } from "@untitledui/icons";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/base/buttons/button";
import { ClienteForm } from "@/components/business/cliente-form";
import { PageHeader } from "@/components/ui/page-header";
import { Spinner } from "@/components/ui/spinner";
import type { Cliente } from "@/lib/types/database";
import { mensajeError } from "@/lib/utils/error-handler";
import type { ClienteInput } from "@/lib/utils/validators";
import { clientesService } from "@/services/clientes.service";

export default function EditarClientePage() {
    const router = useRouter();
    const { id } = useParams<{ id: string }>();
    const [cliente, setCliente] = useState<Cliente | null>(null);

    useEffect(() => {
        clientesService.obtener(id).then(setCliente).catch((e) => toast.error(mensajeError(e)));
    }, [id]);

    const guardar = async (datos: ClienteInput) => {
        await clientesService.actualizar(id, datos);
        toast.success("Cliente actualizado.");
        router.push(`/clientes/${id}`);
    };

    if (!cliente) {
        return (
            <div className="flex justify-center py-20">
                <Spinner size="lg" label="Cargando..." />
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-3xl">
            <Button color="link-gray" iconLeading={ArrowLeft} href={`/clientes/${id}`} className="mb-4">
                Volver al cliente
            </Button>
            <PageHeader titulo="Editar cliente" descripcion={cliente.nombre} />
            <ClienteForm inicial={cliente} onGuardar={guardar} onCancelar={() => router.push(`/clientes/${id}`)} textoBoton="Guardar cambios" />
        </div>
    );
}
