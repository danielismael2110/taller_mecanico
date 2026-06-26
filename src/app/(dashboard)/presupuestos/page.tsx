"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FiltroSelect } from "@/components/business/filtros";
import { DataTable, type Columna } from "@/components/ui/data-table";
import { EstadoBadge } from "@/components/ui/estado-badge";
import { PageHeader } from "@/components/ui/page-header";
import { ESTADOS_PRESUPUESTO } from "@/lib/constants";
import type { EstadoPresupuesto } from "@/lib/types/database";
import { mensajeError } from "@/lib/utils/error-handler";
import { formatFecha, formatMoneda } from "@/lib/utils/formatters";
import { presupuestosService } from "@/services/presupuestos.service";

interface FilaPresupuesto {
    id: string;
    version: number;
    estado: EstadoPresupuesto;
    total: number;
    creado_en: string;
    orden?: { numero?: string; cliente?: { nombre?: string } } | null;
}

export default function PresupuestosPage() {
    const router = useRouter();
    const [datos, setDatos] = useState<FilaPresupuesto[]>([]);
    const [estado, setEstado] = useState<string | null>(null);
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        setCargando(true);
        presupuestosService
            .listar((estado as EstadoPresupuesto) ?? undefined)
            .then((d) => setDatos(d as unknown as FilaPresupuesto[]))
            .catch((e) => toast.error(mensajeError(e)))
            .finally(() => setCargando(false));
    }, [estado]);

    const columnas: Columna<FilaPresupuesto>[] = [
        { key: "orden", header: "Orden", isRowHeader: true, render: (p) => <span className="font-semibold text-primary">{p.orden?.numero ?? "—"}</span> },
        { key: "cliente", header: "Cliente", render: (p) => p.orden?.cliente?.nombre ?? "—" },
        { key: "version", header: "Versión", render: (p) => `v${p.version}` },
        { key: "estado", header: "Estado", render: (p) => <EstadoBadge label={ESTADOS_PRESUPUESTO[p.estado].label} color={ESTADOS_PRESUPUESTO[p.estado].color} /> },
        { key: "total", header: "Total", render: (p) => <span className="font-medium text-primary">{formatMoneda(p.total)}</span> },
        { key: "fecha", header: "Fecha", render: (p) => formatFecha(p.creado_en) },
    ];

    return (
        <div>
            <PageHeader titulo="Presupuestos" descripcion="Presupuestos generados desde las órdenes." />
            <div className="mb-4 max-w-xs">
                <FiltroSelect
                    placeholder="Todos los estados"
                    opciones={Object.values(ESTADOS_PRESUPUESTO).map((e) => ({ value: e.value, label: e.label }))}
                    valor={estado}
                    onCambio={setEstado}
                />
            </div>
            <DataTable
                columnas={columnas}
                filas={datos}
                getId={(p) => p.id}
                cargando={cargando}
                onFilaClick={(p) => router.push(`/presupuestos/${p.id}`)}
                mensajeVacio="No hay presupuestos."
            />
        </div>
    );
}
