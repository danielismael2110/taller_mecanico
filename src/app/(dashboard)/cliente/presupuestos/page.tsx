"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { DataTable, type Columna } from "@/components/ui/data-table";
import { EstadoBadge } from "@/components/ui/estado-badge";
import { PageHeader } from "@/components/ui/page-header";
import { ESTADOS_PRESUPUESTO } from "@/lib/constants";
import type { EstadoPresupuesto } from "@/lib/types/database";
import { mensajeError } from "@/lib/utils/error-handler";
import { formatFecha, formatMoneda } from "@/lib/utils/formatters";
import { presupuestosService } from "@/services/presupuestos.service";

interface Fila {
    id: string;
    estado: EstadoPresupuesto;
    total: number;
    creado_en: string;
    orden?: { numero?: string } | null;
}

export default function MisPresupuestosPage() {
    const router = useRouter();
    const [datos, setDatos] = useState<Fila[]>([]);
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        presupuestosService.listar().then((d) => setDatos(d as unknown as Fila[])).catch((e) => toast.error(mensajeError(e))).finally(() => setCargando(false));
    }, []);

    const columnas: Columna<Fila>[] = [
        { key: "orden", header: "Orden", isRowHeader: true, render: (p) => <span className="font-semibold text-primary">{p.orden?.numero ?? "—"}</span> },
        { key: "estado", header: "Estado", render: (p) => <EstadoBadge label={ESTADOS_PRESUPUESTO[p.estado].label} color={ESTADOS_PRESUPUESTO[p.estado].color} /> },
        { key: "total", header: "Total", render: (p) => formatMoneda(p.total) },
        { key: "fecha", header: "Fecha", render: (p) => formatFecha(p.creado_en) },
    ];

    return (
        <div>
            <PageHeader titulo="Mis presupuestos" descripcion="Revisa y aprueba tus presupuestos." />
            <DataTable columnas={columnas} filas={datos} getId={(p) => p.id} cargando={cargando} onFilaClick={(p) => router.push(`/cliente/presupuestos/${p.id}`)} mensajeVacio="No tienes presupuestos." />
        </div>
    );
}
