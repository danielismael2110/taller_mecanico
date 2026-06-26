"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus } from "@untitledui/icons";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/base/buttons/button";
import { FiltroSelect } from "@/components/business/filtros";
import { SearchBar } from "@/components/business/search-bar";
import { DataTable, type Columna } from "@/components/ui/data-table";
import { EstadoBadge } from "@/components/ui/estado-badge";
import { PageHeader } from "@/components/ui/page-header";
import { useAuth } from "@/hooks/use-auth";
import { ESTADOS_ORDEN, ESTADO_ORDEN_OPCIONES, PRIORIDADES, PRIORIDAD_OPCIONES } from "@/lib/constants";
import type { EstadoOrden, PrioridadOrden } from "@/lib/types/database";
import { mensajeError } from "@/lib/utils/error-handler";
import { formatFecha, formatMoneda } from "@/lib/utils/formatters";
import { ordenesService } from "@/services/ordenes.service";

const POR_PAGINA = 10;

interface FilaOrden {
    id: string;
    numero: string | null;
    estado: EstadoOrden;
    prioridad: PrioridadOrden;
    total: number;
    creado_en: string;
    cliente?: { nombre?: string } | null;
    vehiculo?: { marca?: string; modelo?: string; placa?: string } | null;
}

export default function OrdenesPage() {
    const router = useRouter();
    const { rol } = useAuth();
    const [ordenes, setOrdenes] = useState<FilaOrden[]>([]);
    const [total, setTotal] = useState(0);
    const [pagina, setPagina] = useState(1);
    const [busqueda, setBusqueda] = useState("");
    const [estado, setEstado] = useState<string | null>(null);
    const [prioridad, setPrioridad] = useState<string | null>(null);
    const [cargando, setCargando] = useState(true);

    const cargar = useCallback(async () => {
        setCargando(true);
        try {
            const { datos, total } = await ordenesService.listar({
                busqueda,
                estado: (estado as EstadoOrden) ?? undefined,
                prioridad: (prioridad as PrioridadOrden) ?? undefined,
                pagina,
                porPagina: POR_PAGINA,
            });
            setOrdenes(datos as unknown as FilaOrden[]);
            setTotal(total);
        } catch (e) {
            toast.error(mensajeError(e));
        } finally {
            setCargando(false);
        }
    }, [busqueda, estado, prioridad, pagina]);

    useEffect(() => {
        cargar();
    }, [cargar]);

    const columnas: Columna<FilaOrden>[] = [
        { key: "numero", header: "N° OT", isRowHeader: true, render: (o) => <span className="font-semibold text-primary">{o.numero}</span> },
        { key: "cliente", header: "Cliente", render: (o) => o.cliente?.nombre ?? "—" },
        {
            key: "vehiculo",
            header: "Vehículo",
            render: (o) => (o.vehiculo ? `${o.vehiculo.marca} ${o.vehiculo.modelo} · ${o.vehiculo.placa}` : "—"),
        },
        { key: "estado", header: "Estado", render: (o) => <EstadoBadge label={ESTADOS_ORDEN[o.estado].label} color={ESTADOS_ORDEN[o.estado].color} /> },
        { key: "prioridad", header: "Prioridad", render: (o) => <EstadoBadge label={PRIORIDADES[o.prioridad].label} color={PRIORIDADES[o.prioridad].color} /> },
        { key: "total", header: "Total", render: (o) => <span className="font-medium text-primary">{formatMoneda(o.total)}</span> },
        { key: "fecha", header: "Fecha", render: (o) => formatFecha(o.creado_en) },
    ];

    const puedeCrear = rol === "admin" || rol === "recepcionista";

    return (
        <div>
            <PageHeader
                titulo="Órdenes de trabajo"
                descripcion="Administra las OT del taller."
                acciones={
                    puedeCrear && (
                        <Button color="primary" iconLeading={Plus} href="/ordenes/nueva">
                            Nueva OT
                        </Button>
                    )
                }
            />

            <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <SearchBar onBuscar={(v) => { setBusqueda(v); setPagina(1); }} placeholder="Buscar por N° OT..." />
                <FiltroSelect placeholder="Todos los estados" opciones={ESTADO_ORDEN_OPCIONES} valor={estado} onCambio={(v) => { setEstado(v); setPagina(1); }} />
                <FiltroSelect placeholder="Todas las prioridades" opciones={PRIORIDAD_OPCIONES} valor={prioridad} onCambio={(v) => { setPrioridad(v); setPagina(1); }} />
            </div>

            <DataTable
                columnas={columnas}
                filas={ordenes}
                getId={(o) => o.id}
                cargando={cargando}
                onFilaClick={(o) => router.push(`/ordenes/${o.id}`)}
                pagina={pagina}
                totalPaginas={Math.ceil(total / POR_PAGINA)}
                onCambiarPagina={setPagina}
                mensajeVacio="No se encontraron órdenes de trabajo."
            />
        </div>
    );
}
