"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { UploadCloud01, Wallet01 } from "@untitledui/icons";
import { toast } from "sonner";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { Select } from "@/components/base/select/select";
import { Dialog, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EstadoBadge } from "@/components/ui/estado-badge";
import { PageHeader } from "@/components/ui/page-header";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/hooks/use-auth";
import { useTallerContext } from "@/contexts/taller-context";
import { ESTADOS_PAGO, METODOS_PAGO } from "@/lib/constants";
import type { EstadoPago, MetodoPago, OrdenTrabajo } from "@/lib/types/database";
import { mensajeError } from "@/lib/utils/error-handler";
import { formatFecha, formatMoneda } from "@/lib/utils/formatters";
import { clientesService } from "@/services/clientes.service";
import { pagosService } from "@/services/pagos.service";

interface FilaPago {
    id: string;
    metodo: MetodoPago;
    estado: EstadoPago;
    monto: number;
    creado_en: string;
    comprobante_url: string | null;
    orden?: { numero?: string } | null;
}

export default function MisPagosPage() {
    const { userId } = useAuth();
    const { config } = useTallerContext();
    const [pagos, setPagos] = useState<FilaPago[]>([]);
    const [ordenes, setOrdenes] = useState<OrdenTrabajo[]>([]);
    const [cargando, setCargando] = useState(true);
    const [subiendoId, setSubiendoId] = useState<string | null>(null);
    const [aPagar, setAPagar] = useState<OrdenTrabajo | null>(null);
    const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

    const cargar = useCallback(async () => {
        if (!userId) return;
        setCargando(true);
        try {
            const ficha = await clientesService.miFicha(userId);
            const [ps, os] = await Promise.all([
                pagosService.listar(),
                ficha ? clientesService.ordenes(ficha.id) : Promise.resolve([]),
            ]);
            setPagos(ps as unknown as FilaPago[]);
            setOrdenes(os);
        } catch (e) {
            toast.error(mensajeError(e));
        } finally {
            setCargando(false);
        }
    }, [userId]);

    useEffect(() => {
        cargar();
    }, [cargar]);

    const subir = async (pagoId: string, file: File) => {
        setSubiendoId(pagoId);
        try {
            await pagosService.subirComprobante(pagoId, file);
            toast.success("Comprobante subido. El taller lo revisará.");
            cargar();
        } catch (e) {
            toast.error(mensajeError(e));
        } finally {
            setSubiendoId(null);
        }
    };

    // Órdenes con saldo pendiente
    const porPagar = ordenes.filter((o) => o.estado !== "cancelado" && o.total - o.total_pagado > 0.009);

    if (cargando) {
        return (
            <div className="flex justify-center py-20">
                <Spinner size="lg" label="Cargando tus pagos..." />
            </div>
        );
    }

    return (
        <div>
            <PageHeader titulo="Mis pagos" descripcion="Paga tus órdenes y sube tus comprobantes." />

            <div className="grid gap-6 lg:grid-cols-3">
                <Card>
                    <CardHeader titulo="Pago por QR" descripcion="Escanea y transfiere" />
                    <CardBody className="flex flex-col items-center gap-3">
                        {config?.qr_imagen_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={config.qr_imagen_url} alt="QR del taller" className="size-44 rounded-lg object-contain ring-1 ring-secondary" />
                        ) : (
                            <div className="flex size-44 items-center justify-center rounded-lg border border-dashed border-secondary text-sm text-tertiary">QR no disponible</div>
                        )}
                        {config?.qr_titular && <p className="text-sm text-primary">{config.qr_titular}</p>}
                        {config?.qr_banco && <p className="text-sm text-tertiary">{config.qr_banco}</p>}
                        {config?.qr_instrucciones && <p className="text-center text-xs text-tertiary">{config.qr_instrucciones}</p>}
                    </CardBody>
                </Card>

                <div className="flex flex-col gap-6 lg:col-span-2">
                    {/* Órdenes por pagar */}
                    <Card>
                        <CardHeader titulo="Órdenes por pagar" descripcion="Registra tu pago y sube el comprobante" />
                        <CardBody>
                            {porPagar.length === 0 ? (
                                <p className="text-sm text-tertiary">No tienes órdenes con saldo pendiente.</p>
                            ) : (
                                <ul className="flex flex-col gap-3">
                                    {porPagar.map((o) => (
                                        <li key={o.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-secondary p-4">
                                            <div>
                                                <p className="font-semibold text-primary">{o.numero}</p>
                                                <p className="text-sm text-tertiary">
                                                    Saldo: <span className="font-medium text-primary">{formatMoneda(o.total - o.total_pagado)}</span> de {formatMoneda(o.total)}
                                                </p>
                                            </div>
                                            <Button size="sm" color="primary" iconLeading={Wallet01} onClick={() => setAPagar(o)}>
                                                Pagar / Subir comprobante
                                            </Button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </CardBody>
                    </Card>

                    {/* Historial */}
                    <Card>
                        <CardHeader titulo="Historial de pagos" />
                        <CardBody>
                            {pagos.length === 0 ? (
                                <p className="text-sm text-tertiary">No tienes pagos registrados.</p>
                            ) : (
                                <ul className="flex flex-col gap-3">
                                    {pagos.map((p) => (
                                        <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-secondary p-4">
                                            <div>
                                                <p className="font-semibold text-primary">{p.orden?.numero ?? "—"} · {formatMoneda(p.monto)}</p>
                                                <p className="text-sm text-tertiary">{METODOS_PAGO[p.metodo]} · {formatFecha(p.creado_en)}</p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <EstadoBadge label={ESTADOS_PAGO[p.estado].label} color={ESTADOS_PAGO[p.estado].color} />
                                                {(p.estado === "pendiente" || p.estado === "anulado") && (
                                                    <>
                                                        <input
                                                            ref={(el) => { fileRefs.current[p.id] = el; }}
                                                            type="file"
                                                            accept="image/*,application/pdf"
                                                            className="hidden"
                                                            onChange={(e) => e.target.files?.[0] && subir(p.id, e.target.files[0])}
                                                        />
                                                        <Button size="sm" color="secondary" iconLeading={UploadCloud01} isLoading={subiendoId === p.id} onClick={() => fileRefs.current[p.id]?.click()}>
                                                            Subir comprobante
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </CardBody>
                    </Card>
                </div>
            </div>

            {aPagar && (
                <PagarModal orden={aPagar} onCerrar={() => setAPagar(null)} onGuardado={() => { setAPagar(null); cargar(); }} />
            )}
        </div>
    );
}

function PagarModal({ orden, onCerrar, onGuardado }: { orden: OrdenTrabajo; onCerrar: () => void; onGuardado: () => void }) {
    const saldo = orden.total - orden.total_pagado;
    const [metodo, setMetodo] = useState<string>("qr");
    const [monto, setMonto] = useState(String(saldo.toFixed(2)));
    const [file, setFile] = useState<File | null>(null);
    const [guardando, setGuardando] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    const guardar = async () => {
        const montoNum = Number(monto);
        if (!montoNum || montoNum <= 0) return toast.error("Indica un monto válido.");
        if (metodo === "qr" && !file) return toast.error("Adjunta el comprobante de tu pago por QR.");
        setGuardando(true);
        try {
            const pago = await pagosService.registrar({
                orden_id: orden.id,
                metodo: metodo as MetodoPago,
                monto: montoNum,
                estado: "pendiente",
            });
            if (metodo === "qr" && file) await pagosService.subirComprobante(pago.id, file);
            toast.success(
                metodo === "qr"
                    ? "Pago registrado y comprobante enviado. El taller lo validará."
                    : "Pago en efectivo registrado. Acércate al taller para abonarlo; recepción lo validará.",
            );
            onGuardado();
        } catch (e) {
            toast.error(mensajeError(e));
        } finally {
            setGuardando(false);
        }
    };

    return (
        <ModalOverlay isOpen onOpenChange={(o) => !o && onCerrar()} isDismissable>
            <Modal className="max-w-md">
                <Dialog>
                    <div className="rounded-2xl bg-primary p-6 shadow-xl">
                        <h2 className="text-lg font-semibold text-primary">Pagar orden {orden.numero}</h2>
                        <p className="mt-1 text-sm text-tertiary">Saldo pendiente: {formatMoneda(saldo)}</p>

                        <div className="mt-4 flex flex-col gap-4">
                            <Select
                                label="Método de pago"
                                selectedKey={metodo}
                                onSelectionChange={(k) => setMetodo(String(k))}
                                items={[{ id: "qr", label: "QR" }, { id: "efectivo", label: "Efectivo" }]}
                            >
                                {(item) => <Select.Item id={item.id}>{item.label}</Select.Item>}
                            </Select>
                            <Input label="Monto a pagar (Bs)" type="number" value={monto} onChange={setMonto} />
                            {metodo === "qr" ? (
                                <div>
                                    <p className="mb-1.5 text-sm font-medium text-secondary">Comprobante</p>
                                    <input ref={fileRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
                                    <Button color="secondary" iconLeading={UploadCloud01} onClick={() => fileRef.current?.click()}>
                                        {file ? file.name : "Seleccionar archivo"}
                                    </Button>
                                </div>
                            ) : (
                                <p className="rounded-lg bg-secondary px-3 py-2 text-xs text-tertiary">
                                    El pago en efectivo se abona en el taller. Recepción lo registrará como pagado al recibirlo.
                                </p>
                            )}
                        </div>

                        <div className="mt-6 flex justify-end gap-3">
                            <Button color="secondary" onClick={onCerrar}>Cancelar</Button>
                            <Button color="primary" isLoading={guardando} onClick={guardar}>Enviar pago</Button>
                        </div>
                    </div>
                </Dialog>
            </Modal>
        </ModalOverlay>
    );
}
