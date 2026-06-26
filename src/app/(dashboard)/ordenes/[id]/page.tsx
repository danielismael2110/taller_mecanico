"use client";

import { useCallback, useEffect, useState } from "react";
import {
    ArrowLeft,
    Check,
    Download01,
    Edit01,
    FilePlus02,
    Plus,
    Trash01,
    X as XClose,
} from "@untitledui/icons";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Input } from "@/components/base/input/input";
import { Select } from "@/components/base/select/select";
import { Dialog, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { Table, TableCard } from "@/components/application/table/table";
import { AdjuntosOrden } from "@/components/business/adjuntos-orden";
import { ConfirmacionModal } from "@/components/business/confirmacion-modal";
import { StepperEstados } from "@/components/business/stepper-estados";
import { TimelineEstados } from "@/components/business/timeline-estados";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EstadoBadge } from "@/components/ui/estado-badge";
import { PageHeader } from "@/components/ui/page-header";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/hooks/use-auth";
import { ESTADOS_ORDEN, ESTADO_ORDEN_OPCIONES, PRIORIDADES } from "@/lib/constants";
import type {
    EstadoOrden,
    HistorialEstadoOrden,
    OrdenRepuesto,
    OrdenServicio,
    OrdenTrabajo,
} from "@/lib/types/database";
import { mensajeError } from "@/lib/utils/error-handler";
import { formatMoneda } from "@/lib/utils/formatters";
import { generarOrdenPDF } from "@/lib/utils/pdf-generator";
import { inventarioService } from "@/services/inventario.service";
import { ordenesService } from "@/services/ordenes.service";
import { presupuestosService } from "@/services/presupuestos.service";
import { serviciosService } from "@/services/servicios.service";

type OrdenDetalle = OrdenTrabajo & {
    cliente?: { nombre?: string } | null;
    vehiculo?: { marca?: string; modelo?: string; placa?: string } | null;
};

type Asignacion = {
    mecanico_id: string;
    estado: "pendiente" | "aceptada" | "rechazada";
    respondido_en: string;
    perfiles?: { nombre?: string } | null;
};

export default function DetalleOrdenPage() {
    const router = useRouter();
    const { id } = useParams<{ id: string }>();
    const { rol, userId } = useAuth();

    const [orden, setOrden] = useState<OrdenDetalle | null>(null);
    const [servicios, setServicios] = useState<OrdenServicio[]>([]);
    const [repuestos, setRepuestos] = useState<OrdenRepuesto[]>([]);
    const [historial, setHistorial] = useState<HistorialEstadoOrden[]>([]);
    const [asignaciones, setAsignaciones] = useState<Asignacion[]>([]);
    const [cargando, setCargando] = useState(true);

    const [nuevoEstado, setNuevoEstado] = useState<string | null>(null);
    const [confirmarEstado, setConfirmarEstado] = useState(false);
    const [modalServicio, setModalServicio] = useState(false);
    const [modalRepuesto, setModalRepuesto] = useState(false);
    const [procesando, setProcesando] = useState(false);

    const puedeEditar = rol === "admin" || rol === "recepcionista" || rol === "mecanico";

    const cargar = useCallback(async () => {
        try {
            const [o, s, r, h, a] = await Promise.all([
                ordenesService.obtener(id),
                ordenesService.servicios(id),
                ordenesService.repuestos(id),
                ordenesService.historial(id),
                ordenesService.asignaciones(id),
            ]);
            setOrden(o as unknown as OrdenDetalle);
            setServicios(s);
            setRepuestos(r);
            setHistorial(h);
            setAsignaciones(a);
        } catch (e) {
            toast.error(mensajeError(e));
        } finally {
            setCargando(false);
        }
    }, [id]);

    const responder = async (aceptar: boolean) => {
        if (!userId) return;
        setProcesando(true);
        try {
            if (aceptar) await ordenesService.aceptarAsignacion(id, userId);
            else await ordenesService.rechazarAsignacion(id, userId);
            toast.success(aceptar ? "Aceptaste la orden." : "Rechazaste la orden.");
            cargar();
        } catch (e) {
            toast.error(mensajeError(e));
        } finally {
            setProcesando(false);
        }
    };

    useEffect(() => {
        cargar();
    }, [cargar]);

    const cambiarEstado = async () => {
        if (!orden || !nuevoEstado) return;
        setProcesando(true);
        try {
            await ordenesService.cambiarEstado(orden.id, nuevoEstado as EstadoOrden, orden.version);
            toast.success("Estado actualizado.");
            setConfirmarEstado(false);
            setNuevoEstado(null);
            cargar();
        } catch (e) {
            toast.error(mensajeError(e));
        } finally {
            setProcesando(false);
        }
    };

    const generarPresupuesto = async () => {
        try {
            const p = await presupuestosService.generarDesdeOrden(id);
            toast.success("Presupuesto generado.");
            router.push(`/presupuestos/${p.id}`);
        } catch (e) {
            toast.error(mensajeError(e));
        }
    };

    const exportarPDF = () => {
        if (!orden) return;
        const lineas = [
            ...servicios.map((s) => ({ tipo: "Servicio", descripcion: s.descripcion, cantidad: s.cantidad, precio: s.precio, subtotal: s.subtotal })),
            ...repuestos.map((r) => ({ tipo: "Repuesto", descripcion: r.descripcion, cantidad: r.cantidad, precio: r.precio, subtotal: r.subtotal })),
        ];
        generarOrdenPDF({
            numero: orden.numero ?? "",
            cliente: orden.cliente?.nombre ?? "",
            vehiculo: `${orden.vehiculo?.marca ?? ""} ${orden.vehiculo?.modelo ?? ""} · ${orden.vehiculo?.placa ?? ""}`,
            estado: ESTADOS_ORDEN[orden.estado].label,
            prioridad: PRIORIDADES[orden.prioridad].label,
            fecha: orden.creado_en,
            problema: orden.problema_reportado,
            diagnostico: orden.diagnostico,
            trabajo: orden.trabajo_realizado,
            horas: orden.horas_trabajo,
            lineas,
            subtotalServicios: orden.subtotal_servicios,
            subtotalRepuestos: orden.subtotal_repuestos,
            descuento: orden.descuento_monto,
            iva: orden.iva_monto,
            ivaPorcentaje: orden.iva_porcentaje,
            total: orden.total,
        });
    };

    const eliminarServicio = async (sid: string) => {
        await ordenesService.eliminarServicio(sid);
        cargar();
    };
    const eliminarRepuesto = async (rid: string) => {
        try {
            await ordenesService.eliminarRepuesto(rid);
            cargar();
        } catch (e) {
            toast.error(mensajeError(e));
        }
    };

    if (cargando || !orden) {
        return (
            <div className="flex justify-center py-20">
                <Spinner size="lg" label="Cargando orden..." />
            </div>
        );
    }

    return (
        <div>
            <Button color="link-gray" iconLeading={ArrowLeft} href="/ordenes" className="mb-4">
                Volver a órdenes
            </Button>

            <PageHeader
                titulo={orden.numero ?? "Orden"}
                descripcion={`${orden.cliente?.nombre ?? ""} · ${orden.vehiculo?.marca ?? ""} ${orden.vehiculo?.modelo ?? ""} (${orden.vehiculo?.placa ?? ""})`}
                acciones={
                    <>
                        <Button color="secondary" iconLeading={Download01} onClick={exportarPDF}>
                            Exportar PDF
                        </Button>
                        {(rol === "admin" || rol === "recepcionista") && (
                            <Button color="primary" iconLeading={FilePlus02} onClick={generarPresupuesto}>
                                Generar presupuesto
                            </Button>
                        )}
                    </>
                }
            />

            {/* Stepper */}
            <Card className="mb-6">
                <CardBody>
                    <div className="mb-4 flex flex-wrap items-center gap-2">
                        <EstadoBadge label={ESTADOS_ORDEN[orden.estado].label} color={ESTADOS_ORDEN[orden.estado].color} size="md" />
                        <EstadoBadge label={`Prioridad: ${PRIORIDADES[orden.prioridad].label}`} color={PRIORIDADES[orden.prioridad].color} />
                    </div>
                    <StepperEstados estado={orden.estado} />

                    {puedeEditar && (
                        <div className="mt-6 flex flex-col gap-3 border-t border-secondary pt-4 sm:flex-row sm:items-end">
                            <div className="sm:w-64">
                                <Select
                                    label="Cambiar estado"
                                    placeholder="Nuevo estado"
                                    selectedKey={nuevoEstado}
                                    onSelectionChange={(k) => setNuevoEstado(String(k))}
                                    items={ESTADO_ORDEN_OPCIONES.map((e) => ({ id: e.value, label: e.label }))}
                                >
                                    {(item) => <Select.Item id={item.id}>{item.label}</Select.Item>}
                                </Select>
                            </div>
                            <Button color="primary" isDisabled={!nuevoEstado} onClick={() => setConfirmarEstado(true)}>
                                Aplicar cambio
                            </Button>
                        </div>
                    )}
                </CardBody>
            </Card>

            {/* Asignación de mecánicos (flujo aceptar/rechazar) */}
            {(() => {
                const aceptados = asignaciones.filter((a) => a.estado === "aceptada");
                const miRespuesta = asignaciones.find((a) => a.mecanico_id === userId);
                const puedeResponder = rol === "mecanico" && orden.estado === "pendiente_asignacion" && miRespuesta?.estado !== "aceptada";
                return (
                    <Card className="mb-6">
                        <CardHeader
                            titulo="Mecánicos en esta orden"
                            descripcion={`${aceptados.length} de ${orden.cantidad_mecanicos_requeridos} mecánico(s) requerido(s) han aceptado`}
                        />
                        <CardBody className="flex flex-col gap-4">
                            {asignaciones.length === 0 ? (
                                <p className="text-sm text-tertiary">Aún no hay respuestas de mecánicos.</p>
                            ) : (
                                <ul className="flex flex-col gap-2">
                                    {asignaciones.map((a) => (
                                        <li key={a.mecanico_id} className="flex items-center justify-between rounded-lg border border-secondary px-3 py-2">
                                            <span className="text-sm font-medium text-primary">{a.perfiles?.nombre ?? "Mecánico"}</span>
                                            <EstadoBadge
                                                label={a.estado === "aceptada" ? "Trabajando" : a.estado === "rechazada" ? "Rechazó" : "Pendiente"}
                                                color={a.estado === "aceptada" ? "success" : a.estado === "rechazada" ? "error" : "warning"}
                                            />
                                        </li>
                                    ))}
                                </ul>
                            )}

                            {puedeResponder && (
                                <div className="flex gap-3 border-t border-secondary pt-4">
                                    <Button color="primary" iconLeading={Check} isLoading={procesando} onClick={() => responder(true)}>
                                        Aceptar orden
                                    </Button>
                                    <Button color="secondary-destructive" iconLeading={XClose} isLoading={procesando} onClick={() => responder(false)}>
                                        Rechazar
                                    </Button>
                                </div>
                            )}
                        </CardBody>
                    </Card>
                );
            })()}

            <div className="grid gap-6 lg:grid-cols-3">
                <div className="flex flex-col gap-6 lg:col-span-2">
                    {/* Servicios */}
                    <TablaLineas
                        titulo="Servicios"
                        filas={servicios.map((s) => ({ id: s.id, descripcion: s.descripcion, cantidad: s.cantidad, precio: s.precio, subtotal: s.subtotal }))}
                        onAgregar={puedeEditar ? () => setModalServicio(true) : undefined}
                        onEliminar={puedeEditar ? eliminarServicio : undefined}
                    />
                    {/* Repuestos */}
                    <TablaLineas
                        titulo="Repuestos"
                        filas={repuestos.map((r) => ({ id: r.id, descripcion: r.descripcion, cantidad: r.cantidad, precio: r.precio, subtotal: r.subtotal }))}
                        onAgregar={puedeEditar ? () => setModalRepuesto(true) : undefined}
                        onEliminar={puedeEditar ? eliminarRepuesto : undefined}
                    />
                    {/* Problema / diagnóstico */}
                    <Card>
                        <CardHeader
                            titulo="Detalle técnico"
                            descripcion="Diagnóstico, trabajo realizado y horas"
                            accion={
                                puedeEditar && (
                                    <Button size="sm" color="secondary" iconLeading={Edit01} onClick={() => router.push(`/ordenes/${id}/editar`)}>
                                        Editar
                                    </Button>
                                )
                            }
                        />
                        <CardBody className="flex flex-col gap-3 text-sm">
                            <Campo label="Problema reportado" valor={orden.problema_reportado} />
                            <Campo label="Diagnóstico" valor={orden.diagnostico} />
                            <Campo label="Trabajo realizado" valor={orden.trabajo_realizado} />
                            <Campo label="Horas de trabajo" valor={orden.horas_trabajo ? `${orden.horas_trabajo} h` : null} />
                        </CardBody>
                    </Card>

                    {/* Adjuntos / evidencias */}
                    <Card>
                        <CardHeader titulo="Adjuntos" descripcion="Fotos o documentos de la orden" />
                        <CardBody>
                            <AdjuntosOrden ordenId={id} puedeSubir={puedeEditar} />
                        </CardBody>
                    </Card>
                </div>

                <div className="flex flex-col gap-6">
                    {/* Totales */}
                    <Card>
                        <CardHeader titulo="Resumen" />
                        <CardBody className="flex flex-col gap-2 text-sm">
                            <LineaTotal label="Servicios" valor={orden.subtotal_servicios} />
                            <LineaTotal label="Repuestos" valor={orden.subtotal_repuestos} />
                            <LineaTotal label={`Descuento (${orden.descuento_porcentaje}%)`} valor={-orden.descuento_monto} />
                            <LineaTotal label={`IVA (${orden.iva_porcentaje}%)`} valor={orden.iva_monto} />
                            <div className="mt-2 flex justify-between border-t border-secondary pt-2 text-base font-semibold text-primary">
                                <span>Total</span>
                                <span>{formatMoneda(orden.total)}</span>
                            </div>
                            <div className="flex justify-between text-success-primary">
                                <span>Pagado</span>
                                <span>{formatMoneda(orden.total_pagado)}</span>
                            </div>
                        </CardBody>
                    </Card>

                    {/* Timeline */}
                    <Card>
                        <CardHeader titulo="Historial de estados" descripcion="Timeline de cambios" />
                        <CardBody>
                            <TimelineEstados historial={historial} />
                        </CardBody>
                    </Card>
                </div>
            </div>

            {/* Modales */}
            <ConfirmacionModal
                abierto={confirmarEstado}
                onCerrar={() => setConfirmarEstado(false)}
                onConfirmar={cambiarEstado}
                titulo="Cambiar estado de la orden"
                mensaje={`¿Cambiar el estado a "${nuevoEstado ? ESTADOS_ORDEN[nuevoEstado as EstadoOrden].label : ""}"?`}
                textoConfirmar="Cambiar estado"
                cargando={procesando}
            />

            {modalServicio && (
                <ModalAgregarServicio ordenId={id} onCerrar={() => setModalServicio(false)} onGuardado={() => { setModalServicio(false); cargar(); }} />
            )}
            {modalRepuesto && (
                <ModalAgregarRepuesto ordenId={id} onCerrar={() => setModalRepuesto(false)} onGuardado={() => { setModalRepuesto(false); cargar(); }} />
            )}
        </div>
    );
}

// --- Subcomponentes ---

function Campo({ label, valor }: { label: string; valor?: string | null }) {
    return (
        <div>
            <p className="text-xs font-medium text-quaternary">{label}</p>
            <p className="text-secondary">{valor || "—"}</p>
        </div>
    );
}

function LineaTotal({ label, valor }: { label: string; valor: number }) {
    return (
        <div className="flex justify-between text-tertiary">
            <span>{label}</span>
            <span className="text-primary">{formatMoneda(valor)}</span>
        </div>
    );
}

interface Linea {
    id: string;
    descripcion: string;
    cantidad: number;
    precio: number;
    subtotal: number;
}

function TablaLineas({
    titulo,
    filas,
    onAgregar,
    onEliminar,
}: {
    titulo: string;
    filas: Linea[];
    onAgregar?: () => void;
    onEliminar?: (id: string) => void;
}) {
    return (
        <TableCard.Root size="sm">
            <TableCard.Header
                title={titulo}
                contentTrailing={onAgregar && <Button size="sm" color="secondary" iconLeading={Plus} onClick={onAgregar}>Agregar</Button>}
            />
            {filas.length === 0 ? (
                <p className="px-5 py-6 text-sm text-tertiary">Sin {titulo.toLowerCase()} registrados.</p>
            ) : (
                <Table aria-label={titulo}>
                    <Table.Header>
                        <Table.Head id="desc" label="Descripción" isRowHeader />
                        <Table.Head id="cant" label="Cant." />
                        <Table.Head id="precio" label="Precio" />
                        <Table.Head id="sub" label="Subtotal" />
                        <Table.Head id="acc" label="" />
                    </Table.Header>
                    <Table.Body>
                        {filas.map((f) => (
                            <Table.Row key={f.id} id={f.id}>
                                <Table.Cell>{f.descripcion}</Table.Cell>
                                <Table.Cell>{f.cantidad}</Table.Cell>
                                <Table.Cell>{formatMoneda(f.precio)}</Table.Cell>
                                <Table.Cell>{formatMoneda(f.subtotal)}</Table.Cell>
                                <Table.Cell>
                                    {onEliminar && (
                                        <div onClick={(e) => e.stopPropagation()}>
                                            <ButtonUtility size="sm" color="tertiary" icon={Trash01} tooltip="Eliminar" onClick={() => onEliminar(f.id)} />
                                        </div>
                                    )}
                                </Table.Cell>
                            </Table.Row>
                        ))}
                    </Table.Body>
                </Table>
            )}
        </TableCard.Root>
    );
}

function ModalAgregarServicio({ ordenId, onCerrar, onGuardado }: { ordenId: string; onCerrar: () => void; onGuardado: () => void }) {
    const [opciones, setOpciones] = useState<{ id: string; nombre: string; precio: number }[]>([]);
    const [servicioId, setServicioId] = useState<string | null>(null);
    const [cantidad, setCantidad] = useState("1");
    const [guardando, setGuardando] = useState(false);

    useEffect(() => {
        serviciosService.opciones().then((o) => setOpciones(o.map((x) => ({ id: x.id, nombre: x.nombre, precio: x.precio })))).catch(() => {});
    }, []);

    const guardar = async () => {
        const serv = opciones.find((o) => o.id === servicioId);
        if (!serv) return toast.error("Selecciona un servicio.");
        setGuardando(true);
        try {
            await ordenesService.agregarServicio({
                orden_id: ordenId,
                servicio_id: serv.id,
                descripcion: serv.nombre,
                precio: serv.precio,
                cantidad: Number(cantidad) || 1,
            });
            toast.success("Servicio agregado.");
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
                        <h2 className="text-lg font-semibold text-primary">Agregar servicio</h2>
                        <div className="mt-4 flex flex-col gap-4">
                            <Select label="Servicio" placeholder="Selecciona un servicio" selectedKey={servicioId} onSelectionChange={(k) => setServicioId(String(k))} items={opciones.map((o) => ({ id: o.id, label: o.nombre }))}>
                                {(item) => <Select.Item id={item.id}>{item.label}</Select.Item>}
                            </Select>
                            <Input label="Cantidad" type="number" value={cantidad} onChange={setCantidad} />
                        </div>
                        <div className="mt-6 flex justify-end gap-3">
                            <Button color="secondary" onClick={onCerrar}>Cancelar</Button>
                            <Button color="primary" isLoading={guardando} onClick={guardar}>Agregar</Button>
                        </div>
                    </div>
                </Dialog>
            </Modal>
        </ModalOverlay>
    );
}

function ModalAgregarRepuesto({ ordenId, onCerrar, onGuardado }: { ordenId: string; onCerrar: () => void; onGuardado: () => void }) {
    const [opciones, setOpciones] = useState<{ id: string; nombre: string; precio_venta: number; stock: number }[]>([]);
    const [repuestoId, setRepuestoId] = useState<string | null>(null);
    const [cantidad, setCantidad] = useState("1");
    const [guardando, setGuardando] = useState(false);

    useEffect(() => {
        inventarioService.opciones().then((o) => setOpciones(o.map((x) => ({ id: x.id, nombre: x.nombre, precio_venta: x.precio_venta, stock: x.stock })))).catch(() => {});
    }, []);

    const guardar = async () => {
        const rep = opciones.find((o) => o.id === repuestoId);
        if (!rep) return toast.error("Selecciona un repuesto.");
        setGuardando(true);
        try {
            await ordenesService.agregarRepuesto({
                orden_id: ordenId,
                repuesto_id: rep.id,
                descripcion: rep.nombre,
                precio: rep.precio_venta,
                cantidad: Number(cantidad) || 1,
            });
            toast.success("Repuesto agregado (stock descontado).");
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
                        <h2 className="text-lg font-semibold text-primary">Agregar repuesto</h2>
                        <div className="mt-4 flex flex-col gap-4">
                            <Select label="Repuesto" placeholder="Selecciona un repuesto" selectedKey={repuestoId} onSelectionChange={(k) => setRepuestoId(String(k))} items={opciones.map((o) => ({ id: o.id, label: `${o.nombre} (stock: ${o.stock})` }))}>
                                {(item) => <Select.Item id={item.id}>{item.label}</Select.Item>}
                            </Select>
                            <Input label="Cantidad" type="number" value={cantidad} onChange={setCantidad} />
                        </div>
                        <div className="mt-6 flex justify-end gap-3">
                            <Button color="secondary" onClick={onCerrar}>Cancelar</Button>
                            <Button color="primary" isLoading={guardando} onClick={guardar}>Agregar</Button>
                        </div>
                    </div>
                </Dialog>
            </Modal>
        </ModalOverlay>
    );
}
