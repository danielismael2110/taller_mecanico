"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Clock, Download01, Send01 } from "@untitledui/icons";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/base/buttons/button";
import { Table, TableCard } from "@/components/application/table/table";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EstadoBadge } from "@/components/ui/estado-badge";
import { PageHeader } from "@/components/ui/page-header";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/hooks/use-auth";
import { ESTADOS_PRESUPUESTO } from "@/lib/constants";
import type { DetallePresupuesto, Presupuesto } from "@/lib/types/database";
import { mensajeError } from "@/lib/utils/error-handler";
import { formatFecha, formatMoneda } from "@/lib/utils/formatters";
import { exportarTablaPDF } from "@/lib/utils/pdf-generator";
import { presupuestosService } from "@/services/presupuestos.service";

type PresupuestoDetalle = Presupuesto & { orden?: { numero?: string; cliente?: { nombre?: string } } | null };

export default function DetallePresupuestoPage() {
    const { id } = useParams<{ id: string }>();
    const { rol } = useAuth();
    const [presupuesto, setPresupuesto] = useState<PresupuestoDetalle | null>(null);
    const [lineas, setLineas] = useState<DetallePresupuesto[]>([]);
    const [cargando, setCargando] = useState(true);
    const [enviando, setEnviando] = useState(false);

    const cargar = useCallback(async () => {
        try {
            const [p, l] = await Promise.all([presupuestosService.obtener(id), presupuestosService.detalle(id)]);
            setPresupuesto(p as unknown as PresupuestoDetalle);
            setLineas(l);
        } catch (e) {
            toast.error(mensajeError(e));
        } finally {
            setCargando(false);
        }
    }, [id]);

    useEffect(() => {
        cargar();
    }, [cargar]);

    const enviar = async () => {
        setEnviando(true);
        try {
            await presupuestosService.enviar(id);
            toast.success("Presupuesto enviado al cliente.");
            cargar();
        } catch (e) {
            toast.error(mensajeError(e));
        } finally {
            setEnviando(false);
        }
    };

    const exportar = () => {
        if (!presupuesto) return;
        exportarTablaPDF(
            `Presupuesto ${presupuesto.orden?.numero ?? ""} v${presupuesto.version}`,
            ["Tipo", "Descripción", "Cant.", "Precio", "Subtotal"],
            lineas.map((l) => [l.tipo, l.descripcion, l.cantidad, formatMoneda(l.precio), formatMoneda(l.subtotal)]),
            `presupuesto-${presupuesto.id.slice(0, 8)}`,
            `Total: ${formatMoneda(presupuesto.total)}`,
        );
    };

    if (cargando || !presupuesto) {
        return (
            <div className="flex justify-center py-20">
                <Spinner size="lg" label="Cargando presupuesto..." />
            </div>
        );
    }

    const puedeEnviar = (rol === "admin" || rol === "recepcionista") && (presupuesto.estado === "borrador");

    return (
        <div className="mx-auto max-w-4xl">
            <Button color="link-gray" iconLeading={ArrowLeft} href="/presupuestos" className="mb-4">
                Volver a presupuestos
            </Button>
            <PageHeader
                titulo={`Presupuesto · ${presupuesto.orden?.numero ?? ""}`}
                descripcion={`Versión ${presupuesto.version} · ${presupuesto.orden?.cliente?.nombre ?? ""}`}
                acciones={
                    <>
                        <Button color="secondary" iconLeading={Download01} onClick={exportar}>PDF</Button>
                        {puedeEnviar && (
                            <Button color="primary" iconLeading={Send01} isLoading={enviando} onClick={enviar}>
                                Enviar al cliente
                            </Button>
                        )}
                    </>
                }
            />

            <div className="mb-4 flex items-center gap-3">
                <EstadoBadge label={ESTADOS_PRESUPUESTO[presupuesto.estado].label} color={ESTADOS_PRESUPUESTO[presupuesto.estado].color} size="md" />
                <Link href={`/presupuestos/historial/${presupuesto.orden_id}`} className="flex items-center gap-1 text-sm font-semibold text-brand-secondary hover:underline">
                    <Clock className="size-4" /> Ver historial de versiones
                </Link>
            </div>

            {presupuesto.motivo_rechazo && (
                <div className="mb-4 rounded-lg bg-error-primary px-4 py-3 text-sm text-error-primary ring-1 ring-error">
                    Motivo de rechazo: {presupuesto.motivo_rechazo}
                </div>
            )}

            <TableCard.Root size="sm">
                <TableCard.Header title="Detalle del presupuesto" />
                <Table aria-label="Detalle">
                    <Table.Header>
                        <Table.Head id="tipo" label="Tipo" isRowHeader />
                        <Table.Head id="desc" label="Descripción" />
                        <Table.Head id="cant" label="Cant." />
                        <Table.Head id="precio" label="Precio" />
                        <Table.Head id="sub" label="Subtotal" />
                    </Table.Header>
                    <Table.Body>
                        {lineas.map((l) => (
                            <Table.Row key={l.id} id={l.id}>
                                <Table.Cell className="capitalize">{l.tipo}</Table.Cell>
                                <Table.Cell>{l.descripcion}</Table.Cell>
                                <Table.Cell>{l.cantidad}</Table.Cell>
                                <Table.Cell>{formatMoneda(l.precio)}</Table.Cell>
                                <Table.Cell>{formatMoneda(l.subtotal)}</Table.Cell>
                            </Table.Row>
                        ))}
                    </Table.Body>
                </Table>
            </TableCard.Root>

            <Card className="mt-6 ml-auto max-w-sm">
                <CardBody className="flex flex-col gap-2 text-sm">
                    <div className="flex justify-between text-tertiary"><span>Servicios</span><span className="text-primary">{formatMoneda(presupuesto.subtotal_servicios)}</span></div>
                    <div className="flex justify-between text-tertiary"><span>Repuestos</span><span className="text-primary">{formatMoneda(presupuesto.subtotal_repuestos)}</span></div>
                    <div className="flex justify-between text-tertiary"><span>Descuento</span><span className="text-primary">- {formatMoneda(presupuesto.descuento_monto)}</span></div>
                    <div className="flex justify-between text-tertiary"><span>IVA</span><span className="text-primary">{formatMoneda(presupuesto.iva_monto)}</span></div>
                    <div className="mt-1 flex justify-between border-t border-secondary pt-2 text-base font-semibold text-primary"><span>Total</span><span>{formatMoneda(presupuesto.total)}</span></div>
                    {presupuesto.vigencia_hasta && <p className="text-xs text-tertiary">Vigente hasta {formatFecha(presupuesto.vigencia_hasta)}</p>}
                </CardBody>
            </Card>
        </div>
    );
}
