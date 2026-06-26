"use client";

import { useEffect, useState } from "react";
import { ArrowLeft } from "@untitledui/icons";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/base/buttons/button";
import { DataTable, type Columna } from "@/components/ui/data-table";
import { EstadoBadge } from "@/components/ui/estado-badge";
import { PageHeader } from "@/components/ui/page-header";
import { ESTADOS_PRESUPUESTO } from "@/lib/constants";
import type { Presupuesto } from "@/lib/types/database";
import { mensajeError } from "@/lib/utils/error-handler";
import { formatFecha, formatMoneda } from "@/lib/utils/formatters";
import { presupuestosService } from "@/services/presupuestos.service";

export default function HistorialPresupuestoPage() {
    const router = useRouter();
    const { id } = useParams<{ id: string }>(); // id = orden_id
    const [versiones, setVersiones] = useState<Presupuesto[]>([]);
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        presupuestosService.versiones(id).then(setVersiones).catch((e) => toast.error(mensajeError(e))).finally(() => setCargando(false));
    }, [id]);

    const columnas: Columna<Presupuesto>[] = [
        { key: "version", header: "Versión", isRowHeader: true, render: (p) => <span className="font-semibold text-primary">v{p.version}</span> },
        { key: "estado", header: "Estado", render: (p) => <EstadoBadge label={ESTADOS_PRESUPUESTO[p.estado].label} color={ESTADOS_PRESUPUESTO[p.estado].color} /> },
        { key: "total", header: "Total", render: (p) => formatMoneda(p.total) },
        { key: "enviado", header: "Enviado", render: (p) => (p.enviado_en ? formatFecha(p.enviado_en) : "—") },
        { key: "creado", header: "Creado", render: (p) => formatFecha(p.creado_en) },
    ];

    return (
        <div className="mx-auto max-w-4xl">
            <Button color="link-gray" iconLeading={ArrowLeft} onClick={() => router.back()} className="mb-4">
                Volver
            </Button>
            <PageHeader titulo="Historial de versiones" descripcion="Versiones del presupuesto de esta orden." />
            <DataTable
                columnas={columnas}
                filas={versiones}
                getId={(p) => p.id}
                cargando={cargando}
                onFilaClick={(p) => router.push(`/presupuestos/${p.id}`)}
                mensajeVacio="No hay versiones registradas."
            />
        </div>
    );
}
