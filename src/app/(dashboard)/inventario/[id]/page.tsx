"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Edit01, Scale01, Clock } from "@untitledui/icons";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { TextArea } from "@/components/base/textarea/textarea";
import { Dialog, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { RepuestoForm } from "@/components/business/repuesto-form";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/hooks/use-auth";
import type { Repuesto } from "@/lib/types/database";
import { mensajeError } from "@/lib/utils/error-handler";
import { formatMoneda } from "@/lib/utils/formatters";
import type { RepuestoInput } from "@/lib/utils/validators";
import { inventarioService } from "@/services/inventario.service";

export default function DetalleRepuestoPage() {
    const { id } = useParams<{ id: string }>();
    const { rol } = useAuth();
    const [repuesto, setRepuesto] = useState<Repuesto | null>(null);
    const [editando, setEditando] = useState(false);
    const [modalAjuste, setModalAjuste] = useState(false);
    const [cargando, setCargando] = useState(true);

    const puedeGestionar = rol === "admin" || rol === "recepcionista";

    const cargar = useCallback(async () => {
        try {
            setRepuesto(await inventarioService.obtener(id));
        } catch (e) {
            toast.error(mensajeError(e));
        } finally {
            setCargando(false);
        }
    }, [id]);

    useEffect(() => {
        cargar();
    }, [cargar]);

    const guardar = async (datos: RepuestoInput) => {
        const { stock, ...resto } = datos;
        void stock; // el stock se gestiona por ajustes/movimientos, no por edición directa
        await inventarioService.actualizar(id, resto);
        toast.success("Repuesto actualizado.");
        setEditando(false);
        cargar();
    };

    if (cargando || !repuesto) {
        return (
            <div className="flex justify-center py-20">
                <Spinner size="lg" label="Cargando repuesto..." />
            </div>
        );
    }

    if (editando) {
        return (
            <div className="mx-auto max-w-3xl">
                <Button color="link-gray" iconLeading={ArrowLeft} onClick={() => setEditando(false)} className="mb-4">Cancelar edición</Button>
                <PageHeader titulo={`Editar ${repuesto.nombre}`} />
                <RepuestoForm inicial={repuesto} onGuardar={guardar} onCancelar={() => setEditando(false)} textoBoton="Guardar cambios" ocultarStock />
            </div>
        );
    }

    const critico = repuesto.stock <= repuesto.stock_minimo;

    return (
        <div>
            <Button color="link-gray" iconLeading={ArrowLeft} href="/inventario" className="mb-4">Volver al inventario</Button>
            <PageHeader
                titulo={repuesto.nombre}
                descripcion={`Código ${repuesto.codigo}`}
                acciones={
                    puedeGestionar && (
                        <>
                            <Button color="secondary" iconLeading={Scale01} onClick={() => setModalAjuste(true)}>Ajustar stock</Button>
                            <Button color="secondary" iconLeading={Edit01} onClick={() => setEditando(true)}>Editar</Button>
                        </>
                    )
                }
            />

            <div className="grid gap-6 lg:grid-cols-3">
                <Card>
                    <CardHeader titulo="Stock" />
                    <CardBody>
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-bold text-primary">{repuesto.stock}</span>
                            {critico && <Badge color="error" type="pill-color" size="sm">Stock crítico</Badge>}
                        </div>
                        <p className="mt-1 text-sm text-tertiary">Mínimo: {repuesto.stock_minimo}</p>
                        <Link href={`/inventario/movimientos/${id}`} className="mt-4 flex items-center gap-1 text-sm font-semibold text-brand-secondary hover:underline">
                            <Clock className="size-4" /> Ver historial de movimientos
                        </Link>
                    </CardBody>
                </Card>

                <Card className="lg:col-span-2">
                    <CardHeader titulo="Información" />
                    <CardBody>
                        <dl className="grid gap-4 sm:grid-cols-2 text-sm">
                            <Fila label="Categoría" valor={repuesto.categoria} />
                            <Fila label="Ubicación" valor={repuesto.ubicacion} />
                            <Fila label="Precio de compra" valor={formatMoneda(repuesto.precio_compra)} />
                            <Fila label="Precio de venta" valor={formatMoneda(repuesto.precio_venta)} />
                            {repuesto.descripcion && <Fila label="Descripción" valor={repuesto.descripcion} />}
                        </dl>
                    </CardBody>
                </Card>
            </div>

            {modalAjuste && (
                <ModalAjuste repuesto={repuesto} onCerrar={() => setModalAjuste(false)} onGuardado={() => { setModalAjuste(false); cargar(); }} />
            )}
        </div>
    );
}

function Fila({ label, valor }: { label: string; valor?: string | null }) {
    return (
        <div>
            <dt className="text-xs font-medium text-quaternary">{label}</dt>
            <dd className="mt-0.5 text-primary">{valor || "—"}</dd>
        </div>
    );
}

function ModalAjuste({ repuesto, onCerrar, onGuardado }: { repuesto: Repuesto; onCerrar: () => void; onGuardado: () => void }) {
    const [nuevoStock, setNuevoStock] = useState(String(repuesto.stock));
    const [motivo, setMotivo] = useState("");
    const [guardando, setGuardando] = useState(false);

    const guardar = async () => {
        if (!motivo.trim()) return toast.error("El motivo es obligatorio.");
        setGuardando(true);
        try {
            await inventarioService.ajustarStock(repuesto.id, Number(nuevoStock), motivo);
            toast.success("Stock ajustado.");
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
                        <h2 className="text-lg font-semibold text-primary">Ajuste manual de stock</h2>
                        <p className="mt-1 text-sm text-tertiary">Stock actual: {repuesto.stock}</p>
                        <div className="mt-4 flex flex-col gap-4">
                            <Input label="Nuevo stock" type="number" value={nuevoStock} onChange={setNuevoStock} />
                            <TextArea label="Motivo (obligatorio)" value={motivo} onChange={setMotivo} placeholder="Ej.: conteo físico, merma, corrección" isRequired />
                        </div>
                        <div className="mt-6 flex justify-end gap-3">
                            <Button color="secondary" onClick={onCerrar}>Cancelar</Button>
                            <Button color="primary" isLoading={guardando} onClick={guardar}>Aplicar ajuste</Button>
                        </div>
                    </div>
                </Dialog>
            </Modal>
        </ModalOverlay>
    );
}
