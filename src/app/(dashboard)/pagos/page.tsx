"use client";

import { useEffect, useState } from "react";
import { QrCode01 } from "@untitledui/icons";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/base/buttons/button";
import { FiltroSelect } from "@/components/business/filtros";
import { DataTable, type Columna } from "@/components/ui/data-table";
import { EstadoBadge } from "@/components/ui/estado-badge";
import { PageHeader } from "@/components/ui/page-header";
import { useAuth } from "@/hooks/use-auth";
import { ESTADOS_PAGO, METODOS_PAGO } from "@/lib/constants";
import type { EstadoPago } from "@/lib/types/database";
import { mensajeError } from "@/lib/utils/error-handler";
import { formatFecha, formatMoneda } from "@/lib/utils/formatters";
import { pagosService } from "@/services/pagos.service";

interface FilaPago {
    id: string;
    metodo: keyof typeof METODOS_PAGO;
    estado: EstadoPago;
    monto: number;
    creado_en: string;
    orden?: { numero?: string; cliente?: { nombre?: string } } | null;
}

export default function PagosPage() {
    const router = useRouter();
    const { rol } = useAuth();
    const [datos, setDatos] = useState<FilaPago[]>([]);
    const [estado, setEstado] = useState<string | null>(null);
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        setCargando(true);
        pagosService
            .listar((estado as EstadoPago) ?? undefined)
            .then((d) => setDatos(d as unknown as FilaPago[]))
            .catch((e) => toast.error(mensajeError(e)))
            .finally(() => setCargando(false));
    }, [estado]);

    const columnas: Columna<FilaPago>[] = [
        { key: "orden", header: "Orden", isRowHeader: true, render: (p) => <span className="font-semibold text-primary">{p.orden?.numero ?? "—"}</span> },
        { key: "cliente", header: "Cliente", render: (p) => p.orden?.cliente?.nombre ?? "—" },
        { key: "metodo", header: "Método", render: (p) => METODOS_PAGO[p.metodo] },
        { key: "monto", header: "Monto", render: (p) => <span className="font-medium text-primary">{formatMoneda(p.monto)}</span> },
        { key: "estado", header: "Estado", render: (p) => <EstadoBadge label={ESTADOS_PAGO[p.estado].label} color={ESTADOS_PAGO[p.estado].color} /> },
        { key: "fecha", header: "Fecha", render: (p) => formatFecha(p.creado_en) },
    ];

    return (
        <div>
            <PageHeader
                titulo="Pagos"
                descripcion="Pagos y validación de comprobantes."
                acciones={
                    (rol === "admin" || rol === "recepcionista") && (
                        <Button color="secondary" iconLeading={QrCode01} href="/pagos/qr-config">Configurar QR</Button>
                    )
                }
            />
            <div className="mb-4 max-w-xs">
                <FiltroSelect placeholder="Todos los estados" opciones={Object.values(ESTADOS_PAGO).map((e) => ({ value: e.value, label: e.label }))} valor={estado} onCambio={setEstado} />
            </div>
            <DataTable columnas={columnas} filas={datos} getId={(p) => p.id} cargando={cargando} onFilaClick={(p) => router.push(`/pagos/${p.id}`)} mensajeVacio="No hay pagos registrados." />
        </div>
    );
}
