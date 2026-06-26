"use client";

import { ArrowLeft } from "@untitledui/icons";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/base/buttons/button";
import { RepuestoForm } from "@/components/business/repuesto-form";
import { PageHeader } from "@/components/ui/page-header";
import type { RepuestoInput } from "@/lib/utils/validators";
import { inventarioService } from "@/services/inventario.service";

export default function NuevoRepuestoPage() {
    const router = useRouter();

    const guardar = async (datos: RepuestoInput) => {
        const r = await inventarioService.crear(datos);
        toast.success("Repuesto registrado.");
        router.push(`/inventario/${r.id}`);
    };

    return (
        <div className="mx-auto max-w-3xl">
            <Button color="link-gray" iconLeading={ArrowLeft} href="/inventario" className="mb-4">Volver al inventario</Button>
            <PageHeader titulo="Nuevo repuesto" descripcion="Registra un repuesto en el inventario." />
            <RepuestoForm onGuardar={guardar} onCancelar={() => router.push("/inventario")} textoBoton="Registrar repuesto" />
        </div>
    );
}
