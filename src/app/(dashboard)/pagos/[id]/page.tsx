"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Check, FileX02, X } from "@untitledui/icons";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { Dialog, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EstadoBadge } from "@/components/ui/estado-badge";
import { PageHeader } from "@/components/ui/page-header";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/hooks/use-auth";
import { ESTADOS_PAGO, METODOS_PAGO } from "@/lib/constants";
import type { EstadoPago, MetodoPago } from "@/lib/types/database";
import { mensajeError } from "@/lib/utils/error-handler";
import { formatFechaHora, formatMoneda } from "@/lib/utils/formatters";
import { pagosService } from "@/services/pagos.service";

interface PagoDetalle {
    id: string;
    metodo: MetodoPago;
    estado: EstadoPago;
    monto: number;
    referencia: string | null;
    comprobante_url: string | null;
    creado_en: string;
    orden?: { numero?: string; cliente?: { nombre?: string } } | null;
}

export default function DetallePagoPage() {
    const { id } = useParams<{ id: string }>();
    const { rol, userId } = useAuth();
    const [pago, setPago] = useState<PagoDetalle | null>(null);
    const [cargando, setCargando] = useState(true);
    const [procesando, setProcesando] = useState(false);
    const [modalAnular, setModalAnular] = useState(false);
    const [motivo, setMotivo] = useState("");

    const puedeValidar = rol === "admin" || rol === "recepcionista";

    const cargar = useCallback(async () => {
        try {
            setPago((await pagosService.obtener(id)) as unknown as PagoDetalle);
        } catch (e) {
            toast.error(mensajeError(e));
        } finally {
            setCargando(false);
        }
    }, [id]);

    useEffect(() => {
        cargar();
    }, [cargar]);

    const validar = async () => {
        if (!userId) return;
        setProcesando(true);
        try {
            await pagosService.validar(id, userId);
            toast.success("Pago validado.");
            cargar();
        } catch (e) {
            toast.error(mensajeError(e));
        } finally {
            setProcesando(false);
        }
    };

    const anular = async () => {
        if (!motivo.trim()) return toast.error("Indica el motivo de anulación.");
        setProcesando(true);
        try {
            await pagosService.anular(id, motivo);
            toast.success("Comprobante anulado.");
            setModalAnular(false);
            cargar();
        } catch (e) {
            toast.error(mensajeError(e));
        } finally {
            setProcesando(false);
        }
    };

    if (cargando || !pago) {
        return (
            <div className="flex justify-center py-20">
                <Spinner size="lg" label="Cargando pago..." />
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-3xl">
            <Button color="link-gray" iconLeading={ArrowLeft} href="/pagos" className="mb-4">Volver a pagos</Button>
            <PageHeader titulo={`Pago · ${pago.orden?.numero ?? ""}`} descripcion={pago.orden?.cliente?.nombre ?? ""} />

            <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                    <CardHeader titulo="Detalle del pago" accion={<EstadoBadge label={ESTADOS_PAGO[pago.estado].label} color={ESTADOS_PAGO[pago.estado].color} size="md" />} />
                    <CardBody className="flex flex-col gap-3 text-sm">
                        <Fila label="Método" valor={METODOS_PAGO[pago.metodo]} />
                        <Fila label="Monto" valor={formatMoneda(pago.monto)} />
                        <Fila label="Referencia" valor={pago.referencia} />
                        <Fila label="Fecha" valor={formatFechaHora(pago.creado_en)} />
                    </CardBody>
                </Card>

                <Card>
                    <CardHeader titulo="Comprobante" />
                    <CardBody>
                        {pago.comprobante_url ? (
                            <a href={pago.comprobante_url} target="_blank" rel="noopener noreferrer" className="block">
                                {pago.comprobante_url.endsWith(".pdf") ? (
                                    <div className="flex items-center gap-2 rounded-lg border border-secondary p-4 text-sm text-brand-secondary hover:bg-secondary">
                                        <FileX02 className="size-5" /> Ver comprobante (PDF)
                                    </div>
                                ) : (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={pago.comprobante_url} alt="Comprobante" className="max-h-64 w-full rounded-lg object-contain ring-1 ring-secondary" />
                                )}
                            </a>
                        ) : (
                            <p className="text-sm text-tertiary">El cliente aún no ha subido un comprobante.</p>
                        )}
                    </CardBody>
                </Card>
            </div>

            {puedeValidar && pago.estado !== "pagado" && pago.estado !== "anulado" && (
                <div className="mt-4 flex gap-3">
                    <Button color="primary" iconLeading={Check} isLoading={procesando} onClick={validar}>Validar pago</Button>
                    <Button color="secondary-destructive" iconLeading={X} onClick={() => setModalAnular(true)}>Anular comprobante</Button>
                </div>
            )}

            {modalAnular && (
                <ModalOverlay isOpen onOpenChange={(o) => !o && setModalAnular(false)} isDismissable>
                    <Modal className="max-w-md">
                        <Dialog>
                            <div className="rounded-2xl bg-primary p-6 shadow-xl">
                                <h2 className="text-lg font-semibold text-primary">Anular comprobante</h2>
                                <div className="mt-4">
                                    <Input label="Motivo" value={motivo} onChange={setMotivo} placeholder="Motivo de la anulación" isRequired />
                                </div>
                                <div className="mt-6 flex justify-end gap-3">
                                    <Button color="secondary" onClick={() => setModalAnular(false)}>Cancelar</Button>
                                    <Button color="primary-destructive" isLoading={procesando} onClick={anular}>Anular</Button>
                                </div>
                            </div>
                        </Dialog>
                    </Modal>
                </ModalOverlay>
            )}
        </div>
    );
}

function Fila({ label, valor }: { label: string; valor?: string | null }) {
    return (
        <div className="flex justify-between">
            <dt className="text-tertiary">{label}</dt>
            <dd className="font-medium text-primary">{valor || "—"}</dd>
        </div>
    );
}
