"use client";

import { useEffect, useState } from "react";
import { ArrowLeft } from "@untitledui/icons";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/base/buttons/button";
import { DataTable, type Columna } from "@/components/ui/data-table";
import { EstadoBadge } from "@/components/ui/estado-badge";
import { PageHeader } from "@/components/ui/page-header";
import { TIPOS_MOVIMIENTO } from "@/lib/constants";
import type { MovimientoInventario } from "@/lib/types/database";
import { mensajeError } from "@/lib/utils/error-handler";
import { formatFechaHora } from "@/lib/utils/formatters";
import { inventarioService } from "@/services/inventario.service";

export default function MovimientosPage() {
    const router = useRouter();
    const { id } = useParams<{ id: string }>();
    const [movimientos, setMovimientos] = useState<MovimientoInventario[]>([]);
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        inventarioService.movimientos(id).then(setMovimientos).catch((e) => toast.error(mensajeError(e))).finally(() => setCargando(false));
    }, [id]);

    const columnas: Columna<MovimientoInventario>[] = [
        { key: "fecha", header: "Fecha", isRowHeader: true, render: (m) => formatFechaHora(m.creado_en) },
        { key: "tipo", header: "Tipo", render: (m) => <EstadoBadge label={TIPOS_MOVIMIENTO[m.tipo].label} color={TIPOS_MOVIMIENTO[m.tipo].color} /> },
        { key: "cantidad", header: "Cantidad", render: (m) => <span className={m.cantidad < 0 ? "text-error-primary" : "text-success-primary"}>{m.cantidad > 0 ? "+" : ""}{m.cantidad}</span> },
        { key: "antes", header: "Stock antes", render: (m) => m.stock_anterior },
        { key: "despues", header: "Stock después", render: (m) => m.stock_nuevo },
        { key: "motivo", header: "Motivo", render: (m) => m.motivo ?? "—" },
    ];

    return (
        <div>
            <Button color="link-gray" iconLeading={ArrowLeft} onClick={() => router.back()} className="mb-4">Volver</Button>
            <PageHeader titulo="Movimientos de inventario" descripcion="Historial de entradas, salidas y ajustes." />
            <DataTable columnas={columnas} filas={movimientos} getId={(m) => String(m.id)} cargando={cargando} mensajeVacio="Sin movimientos registrados." />
        </div>
    );
}
