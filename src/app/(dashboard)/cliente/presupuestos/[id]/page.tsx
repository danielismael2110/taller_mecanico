"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Check, X } from "@untitledui/icons";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/base/buttons/button";
import { TextArea } from "@/components/base/textarea/textarea";
import { Table, TableCard } from "@/components/application/table/table";
import { Dialog, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { ConfirmacionModal } from "@/components/business/confirmacion-modal";
import { Card, CardBody } from "@/components/ui/card";
import { EstadoBadge } from "@/components/ui/estado-badge";
import { PageHeader } from "@/components/ui/page-header";
import { Spinner } from "@/components/ui/spinner";
import { ESTADOS_PRESUPUESTO } from "@/lib/constants";
import type { DetallePresupuesto, Presupuesto } from "@/lib/types/database";
import { mensajeError } from "@/lib/utils/error-handler";
import { formatMoneda } from "@/lib/utils/formatters";
import { presupuestosService } from "@/services/presupuestos.service";

type Detalle = Presupuesto & {
    orden?: {
        numero?: string;
        problema_reportado?: string | null;
        diagnostico?: string | null;
        vehiculo?: { marca?: string; modelo?: string; placa?: string } | null;
    } | null;
};

export default function ClientePresupuestoPage() {
    const router = useRouter();
    const { id } = useParams<{ id: string }>();
    const [presupuesto, setPresupuesto] = useState<Detalle | null>(null);
    const [lineas, setLineas] = useState<DetallePresupuesto[]>([]);
    const [cargando, setCargando] = useState(true);
    const [confirmarAprobar, setConfirmarAprobar] = useState(false);
    const [modalRechazo, setModalRechazo] = useState(false);
    const [motivo, setMotivo] = useState("");
    const [procesando, setProcesando] = useState(false);

    const cargar = useCallback(async () => {
        try {
            const [p, l] = await Promise.all([presupuestosService.obtener(id), presupuestosService.detalle(id)]);
            setPresupuesto(p as unknown as Detalle);
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

    const aprobar = async () => {
        setProcesando(true);
        try {
            await presupuestosService.aprobar(id);
            toast.success("Presupuesto aprobado. El taller continuará con la reparación.");
            setConfirmarAprobar(false);
            cargar();
        } catch (e) {
            toast.error(mensajeError(e));
        } finally {
            setProcesando(false);
        }
    };

    const rechazar = async () => {
        if (!motivo.trim()) return toast.error("Indica el motivo del rechazo.");
        setProcesando(true);
        try {
            await presupuestosService.rechazar(id, motivo);
            toast.success("Presupuesto rechazado.");
            setModalRechazo(false);
            cargar();
        } catch (e) {
            toast.error(mensajeError(e));
        } finally {
            setProcesando(false);
        }
    };

    if (cargando || !presupuesto) {
        return (
            <div className="flex justify-center py-20">
                <Spinner size="lg" label="Cargando presupuesto..." />
            </div>
        );
    }

    const pendiente = presupuesto.estado === "enviado";

    return (
        <div className="mx-auto max-w-3xl">
            <Button color="link-gray" iconLeading={ArrowLeft} href="/cliente/presupuestos" className="mb-4">Volver</Button>
            <PageHeader
                titulo={`Presupuesto · ${presupuesto.orden?.numero ?? ""}`}
                acciones={<EstadoBadge label={ESTADOS_PRESUPUESTO[presupuesto.estado].label} color={ESTADOS_PRESUPUESTO[presupuesto.estado].color} size="md" />}
            />

            <Card className="mb-6">
                <CardBody className="flex flex-col gap-3 text-sm">
                    {presupuesto.orden?.vehiculo && (
                        <div>
                            <p className="text-xs font-medium text-quaternary">Vehículo</p>
                            <p className="text-primary">
                                {presupuesto.orden.vehiculo.marca} {presupuesto.orden.vehiculo.modelo} · {presupuesto.orden.vehiculo.placa}
                            </p>
                        </div>
                    )}
                    <div>
                        <p className="text-xs font-medium text-quaternary">Problema reportado</p>
                        <p className="text-secondary">{presupuesto.orden?.problema_reportado || "—"}</p>
                    </div>
                    <div>
                        <p className="text-xs font-medium text-quaternary">Diagnóstico del taller</p>
                        <p className="text-secondary">{presupuesto.orden?.diagnostico || "Aún sin diagnóstico registrado."}</p>
                    </div>
                </CardBody>
            </Card>

            <TableCard.Root size="sm">
                <TableCard.Header title="Detalle" />
                <Table aria-label="Detalle">
                    <Table.Header>
                        <Table.Head id="desc" label="Descripción" isRowHeader />
                        <Table.Head id="cant" label="Cant." />
                        <Table.Head id="precio" label="Precio" />
                        <Table.Head id="sub" label="Subtotal" />
                    </Table.Header>
                    <Table.Body>
                        {lineas.map((l) => (
                            <Table.Row key={l.id} id={l.id}>
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
                    <div className="flex justify-between text-tertiary"><span>Descuento</span><span className="text-primary">- {formatMoneda(presupuesto.descuento_monto)}</span></div>
                    <div className="flex justify-between text-tertiary"><span>IVA</span><span className="text-primary">{formatMoneda(presupuesto.iva_monto)}</span></div>
                    <div className="mt-1 flex justify-between border-t border-secondary pt-2 text-base font-semibold text-primary"><span>Total</span><span>{formatMoneda(presupuesto.total)}</span></div>
                </CardBody>
            </Card>

            {presupuesto.motivo_rechazo && (
                <div className="mt-4 rounded-lg bg-error-primary px-4 py-3 text-sm text-error-primary ring-1 ring-error">
                    Motivo de rechazo: {presupuesto.motivo_rechazo}
                </div>
            )}

            {pendiente && (
                <div className="mt-6 flex gap-3">
                    <Button color="primary" iconLeading={Check} onClick={() => setConfirmarAprobar(true)}>Aprobar presupuesto</Button>
                    <Button color="secondary-destructive" iconLeading={X} onClick={() => setModalRechazo(true)}>Rechazar</Button>
                </div>
            )}

            <ConfirmacionModal
                abierto={confirmarAprobar}
                onCerrar={() => setConfirmarAprobar(false)}
                onConfirmar={aprobar}
                titulo="Aprobar presupuesto"
                mensaje="Al aprobar, autorizas al taller a continuar con la reparación. ¿Confirmas?"
                textoConfirmar="Aprobar"
                cargando={procesando}
            />

            {modalRechazo && (
                <ModalOverlay isOpen onOpenChange={(o) => !o && setModalRechazo(false)} isDismissable>
                    <Modal className="max-w-md">
                        <Dialog>
                            <div className="rounded-2xl bg-primary p-6 shadow-xl">
                                <h2 className="text-lg font-semibold text-primary">Rechazar presupuesto</h2>
                                <p className="mt-1 text-sm text-tertiary">Indícanos por qué lo rechazas (obligatorio, RF-037).</p>
                                <div className="mt-4">
                                    <TextArea label="Motivo" value={motivo} onChange={setMotivo} placeholder="Escribe el motivo del rechazo" isRequired />
                                </div>
                                <div className="mt-6 flex justify-end gap-3">
                                    <Button color="secondary" onClick={() => setModalRechazo(false)}>Cancelar</Button>
                                    <Button color="primary-destructive" isLoading={procesando} onClick={rechazar}>Rechazar presupuesto</Button>
                                </div>
                            </div>
                        </Dialog>
                    </Modal>
                </ModalOverlay>
            )}
        </div>
    );
}
