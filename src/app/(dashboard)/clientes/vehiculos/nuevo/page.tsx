"use client";

import { Suspense, useEffect, useState } from "react";
import { ArrowLeft } from "@untitledui/icons";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/base/buttons/button";
import { VehiculoForm } from "@/components/business/vehiculo-form";
import { PageHeader } from "@/components/ui/page-header";
import { mensajeError } from "@/lib/utils/error-handler";
import type { VehiculoInput } from "@/lib/utils/validators";
import { clientesService } from "@/services/clientes.service";
import { vehiculosService } from "@/services/vehiculos.service";

function NuevoVehiculo() {
    const router = useRouter();
    const params = useSearchParams();
    const clienteId = params.get("cliente") ?? undefined;
    const [clientes, setClientes] = useState<{ id: string; label: string }[]>([]);

    useEffect(() => {
        clientesService.opciones().then((cs) => setClientes(cs.map((c) => ({ id: c.id, label: c.nombre })))).catch(() => {});
    }, []);

    const guardar = async (datos: VehiculoInput) => {
        try {
            const v = await vehiculosService.crear({ ...datos, cliente_id: clienteId ?? datos.cliente_id });
            toast.success("Vehículo registrado.");
            router.push(clienteId ? `/clientes/${clienteId}` : `/clientes/vehiculos/${v.id}`);
        } catch (e) {
            toast.error(mensajeError(e));
            throw e;
        }
    };

    return (
        <div className="mx-auto max-w-3xl">
            <Button color="link-gray" iconLeading={ArrowLeft} href={clienteId ? `/clientes/${clienteId}` : "/clientes"} className="mb-4">
                Volver
            </Button>
            <PageHeader titulo="Nuevo vehículo" descripcion="Registra un vehículo del cliente." />
            <VehiculoForm
                clientes={clientes}
                clienteFijo={!!clienteId}
                inicial={clienteId ? { cliente_id: clienteId } : undefined}
                onGuardar={guardar}
                onCancelar={() => router.back()}
                textoBoton="Registrar vehículo"
            />
        </div>
    );
}

export default function NuevoVehiculoPage() {
    return (
        <Suspense fallback={null}>
            <NuevoVehiculo />
        </Suspense>
    );
}
