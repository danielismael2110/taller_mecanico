"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Plus } from "@untitledui/icons";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/base/buttons/button";
import { DataTable, type Columna } from "@/components/ui/data-table";
import { EstadoBadge } from "@/components/ui/estado-badge";
import { PageHeader } from "@/components/ui/page-header";
import { ESTADOS_COMPRA } from "@/lib/constants";
import type { EstadoCompra } from "@/lib/types/database";
import { mensajeError } from "@/lib/utils/error-handler";
import { formatFecha, formatMoneda } from "@/lib/utils/formatters";
import { inventarioService } from "@/services/inventario.service";

interface FilaCompra {
    id: string;
    numero: string | null;
    estado: EstadoCompra;
    total: number;
    creado_en: string;
    proveedor?: { nombre?: string } | null;
}

export default function ComprasPage() {
    const router = useRouter();
    const [compras, setCompras] = useState<FilaCompra[]>([]);
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        inventarioService.compras().then((c) => setCompras(c as unknown as FilaCompra[])).catch((e) => toast.error(mensajeError(e))).finally(() => setCargando(false));
    }, []);

    const columnas: Columna<FilaCompra>[] = [
        { key: "numero", header: "N° OC", isRowHeader: true, render: (c) => <span className="font-semibold text-primary">{c.numero}</span> },
        { key: "proveedor", header: "Proveedor", render: (c) => c.proveedor?.nombre ?? "—" },
        { key: "estado", header: "Estado", render: (c) => <EstadoBadge label={ESTADOS_COMPRA[c.estado].label} color={ESTADOS_COMPRA[c.estado].color} /> },
        { key: "total", header: "Total", render: (c) => formatMoneda(c.total) },
        { key: "fecha", header: "Fecha", render: (c) => formatFecha(c.creado_en) },
    ];

    return (
        <div>
            <Button color="link-gray" iconLeading={ArrowLeft} href="/inventario" className="mb-4">Volver al inventario</Button>
            <PageHeader
                titulo="Órdenes de compra"
                descripcion="Compras a proveedores."
                acciones={<Button color="primary" iconLeading={Plus} href="/inventario/compras/nueva">Nueva compra</Button>}
            />
            <DataTable
                columnas={columnas}
                filas={compras}
                getId={(c) => c.id}
                cargando={cargando}
                onFilaClick={(c) => router.push(`/inventario/compras/${c.id}`)}
                mensajeVacio="No hay órdenes de compra."
            />
        </div>
    );
}
