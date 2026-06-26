"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, Package, Plus, Truck01, Users01 } from "@untitledui/icons";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { SearchBar } from "@/components/business/search-bar";
import { DataTable, type Columna } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import { useAuth } from "@/hooks/use-auth";
import type { Repuesto } from "@/lib/types/database";
import { mensajeError } from "@/lib/utils/error-handler";
import { formatMoneda } from "@/lib/utils/formatters";
import { inventarioService } from "@/services/inventario.service";

export default function InventarioPage() {
    const router = useRouter();
    const { rol } = useAuth();
    const [repuestos, setRepuestos] = useState<Repuesto[]>([]);
    const [busqueda, setBusqueda] = useState("");
    const [cargando, setCargando] = useState(true);

    const cargar = useCallback(async () => {
        setCargando(true);
        try {
            setRepuestos(await inventarioService.listar(busqueda));
        } catch (e) {
            toast.error(mensajeError(e));
        } finally {
            setCargando(false);
        }
    }, [busqueda]);

    useEffect(() => {
        cargar();
    }, [cargar]);

    const puedeGestionar = rol === "admin" || rol === "recepcionista";

    const columnas: Columna<Repuesto>[] = [
        { key: "codigo", header: "Código", isRowHeader: true, render: (r) => <span className="font-mono text-sm text-primary">{r.codigo}</span> },
        { key: "nombre", header: "Nombre", render: (r) => <span className="font-medium text-primary">{r.nombre}</span> },
        { key: "categoria", header: "Categoría", render: (r) => r.categoria ?? "—" },
        { key: "precio", header: "Precio venta", render: (r) => formatMoneda(r.precio_venta) },
        {
            key: "stock",
            header: "Stock",
            render: (r) =>
                r.stock <= r.stock_minimo ? (
                    <Badge color="error" type="pill-color" size="sm">{r.stock} (crítico)</Badge>
                ) : (
                    <span className="font-medium text-primary">{r.stock}</span>
                ),
        },
        { key: "ubicacion", header: "Ubicación", render: (r) => r.ubicacion ?? "—" },
    ];

    return (
        <div>
            <PageHeader
                titulo="Inventario"
                descripcion="Repuestos, stock y alertas."
                acciones={
                    puedeGestionar && (
                        <>
                            <Button color="secondary" iconLeading={Users01} href="/inventario/proveedores">Proveedores</Button>
                            <Button color="secondary" iconLeading={Truck01} href="/inventario/compras">Compras</Button>
                            <Button color="primary" iconLeading={Plus} href="/inventario/nuevo">Nuevo repuesto</Button>
                        </>
                    )
                }
            />

            <div className="mb-4 max-w-md">
                <SearchBar onBuscar={setBusqueda} placeholder="Buscar por nombre, código o categoría..." />
            </div>

            <DataTable
                columnas={columnas}
                filas={repuestos}
                getId={(r) => r.id}
                cargando={cargando}
                onFilaClick={(r) => router.push(`/inventario/${r.id}`)}
                mensajeVacio="No hay repuestos registrados."
            />
        </div>
    );
}
