"use client";

import { useCallback, useEffect, useState } from "react";
import { Car01, Edit01, Eye, Plus } from "@untitledui/icons";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { ExportarButton } from "@/components/business/exportar-button";
import { SearchBar } from "@/components/business/search-bar";
import { DataTable, type Columna } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import type { Cliente } from "@/lib/types/database";
import { mensajeError } from "@/lib/utils/error-handler";
import { exportarExcel } from "@/lib/utils/excel-export";
import { formatFecha } from "@/lib/utils/formatters";
import { clientesService } from "@/services/clientes.service";

const POR_PAGINA = 10;

export default function ClientesPage() {
    const router = useRouter();
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [total, setTotal] = useState(0);
    const [pagina, setPagina] = useState(1);
    const [busqueda, setBusqueda] = useState("");
    const [cargando, setCargando] = useState(true);

    const cargar = useCallback(async () => {
        setCargando(true);
        try {
            const { datos, total } = await clientesService.listar({ busqueda, pagina, porPagina: POR_PAGINA });
            setClientes(datos);
            setTotal(total);
        } catch (e) {
            toast.error(mensajeError(e));
        } finally {
            setCargando(false);
        }
    }, [busqueda, pagina]);

    useEffect(() => {
        cargar();
    }, [cargar]);

    const handleBuscar = useCallback((v: string) => {
        setBusqueda(v);
        setPagina(1);
    }, []);

    const exportar = async () => {
        const { datos } = await clientesService.listar({ busqueda, porPagina: 1000 });
        exportarExcel(
            datos.map((c) => ({ Nombre: c.nombre, Teléfono: c.telefono, Correo: c.correo, "CI/NIT": c.ci_nit, Registrado: formatFecha(c.creado_en) })),
            "clientes",
        );
    };

    const columnas: Columna<Cliente>[] = [
        { key: "nombre", header: "Nombre", isRowHeader: true, render: (c) => <span className="font-medium text-primary">{c.nombre}</span> },
        { key: "telefono", header: "Teléfono", render: (c) => c.telefono ?? "—" },
        { key: "correo", header: "Correo", render: (c) => c.correo ?? "—" },
        { key: "ci_nit", header: "CI/NIT", render: (c) => c.ci_nit ?? "—" },
        {
            key: "acciones",
            header: "",
            render: (c) => (
                <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                    <ButtonUtility size="sm" color="tertiary" icon={Eye} tooltip="Ver" onClick={() => router.push(`/clientes/${c.id}`)} />
                    <ButtonUtility size="sm" color="tertiary" icon={Edit01} tooltip="Editar" onClick={() => router.push(`/clientes/${c.id}/editar`)} />
                </div>
            ),
        },
    ];

    return (
        <div>
            <PageHeader
                titulo="Clientes"
                descripcion="Gestiona la cartera de clientes del taller."
                acciones={
                    <>
                        <ExportarButton onExcel={exportar} label="Exportar" />
                        <Button color="secondary" iconLeading={Car01} href="/clientes/vehiculos/nuevo">
                            Nuevo vehículo
                        </Button>
                        <Button color="primary" iconLeading={Plus} href="/clientes/nuevo">
                            Nuevo cliente
                        </Button>
                    </>
                }
            />

            <div className="mb-4 max-w-md">
                <SearchBar onBuscar={handleBuscar} placeholder="Buscar por nombre, CI o teléfono..." />
            </div>

            <DataTable
                columnas={columnas}
                filas={clientes}
                getId={(c) => c.id}
                cargando={cargando}
                onFilaClick={(c) => router.push(`/clientes/${c.id}`)}
                pagina={pagina}
                totalPaginas={Math.ceil(total / POR_PAGINA)}
                onCambiarPagina={setPagina}
                mensajeVacio="No se encontraron clientes."
            />
        </div>
    );
}
