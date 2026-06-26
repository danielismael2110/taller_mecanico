"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, ArrowLeft, Car01, Edit01 } from "@untitledui/icons";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/base/buttons/button";
import { VehiculoForm } from "@/components/business/vehiculo-form";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EstadoBadge } from "@/components/ui/estado-badge";
import { PageHeader } from "@/components/ui/page-header";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/hooks/use-auth";
import { ESTADOS_ORDEN } from "@/lib/constants";
import type { OrdenTrabajo, Vehiculo } from "@/lib/types/database";
import { mensajeError } from "@/lib/utils/error-handler";
import { formatFecha, formatMoneda } from "@/lib/utils/formatters";
import type { VehiculoInput } from "@/lib/utils/validators";
import { vehiculosService } from "@/services/vehiculos.service";

export default function DetalleVehiculoPage() {
    const { id } = useParams<{ id: string }>();
    const { rol } = useAuth();
    const [vehiculo, setVehiculo] = useState<Vehiculo | null>(null);
    const [ordenes, setOrdenes] = useState<OrdenTrabajo[]>([]);
    const [deuda, setDeuda] = useState(0);
    const [cargando, setCargando] = useState(true);
    const [editando, setEditando] = useState(false);

    const cargar = () =>
        Promise.all([vehiculosService.obtener(id), vehiculosService.ordenes(id), vehiculosService.deudaPendiente(id)])
            .then(([v, o, d]) => {
                setVehiculo(v);
                setOrdenes(o);
                setDeuda(d);
            })
            .catch((e) => toast.error(mensajeError(e)))
            .finally(() => setCargando(false));

    useEffect(() => {
        cargar();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const puedeEditar = rol === "admin" || rol === "recepcionista";

    const guardar = async (datos: VehiculoInput) => {
        await vehiculosService.actualizar(id, {
            marca: datos.marca,
            modelo: datos.modelo,
            anio: datos.anio,
            placa: datos.placa,
            color: datos.color,
            chasis: datos.chasis,
            motor: datos.motor,
            notas: datos.notas,
            foto_url: datos.foto_url || null,
        });
        toast.success("Vehículo actualizado.");
        setEditando(false);
        cargar();
    };

    if (cargando || !vehiculo) {
        return (
            <div className="flex justify-center py-20">
                <Spinner size="lg" label="Cargando vehículo..." />
            </div>
        );
    }

    if (editando) {
        return (
            <div className="mx-auto max-w-3xl">
                <Button color="link-gray" iconLeading={ArrowLeft} onClick={() => setEditando(false)} className="mb-4">
                    Cancelar edición
                </Button>
                <PageHeader titulo={`Editar ${vehiculo.marca} ${vehiculo.modelo}`} descripcion={`Placa ${vehiculo.placa}`} />
                <VehiculoForm
                    inicial={vehiculo}
                    clientes={[]}
                    clienteFijo
                    onGuardar={guardar}
                    onCancelar={() => setEditando(false)}
                    textoBoton="Guardar cambios"
                />
            </div>
        );
    }

    return (
        <div>
            <Button color="link-gray" iconLeading={ArrowLeft} href={`/clientes/${vehiculo.cliente_id}`} className="mb-4">
                Volver al cliente
            </Button>
            <PageHeader
                titulo={`${vehiculo.marca} ${vehiculo.modelo}`}
                descripcion={`Placa ${vehiculo.placa}`}
                acciones={puedeEditar && <Button color="secondary" iconLeading={Edit01} onClick={() => setEditando(true)}>Editar</Button>}
            />

            {deuda > 0 && (
                <div className="mb-4 flex items-center gap-3 rounded-xl bg-warning-primary px-4 py-3 ring-1 ring-warning">
                    <AlertTriangle className="size-5 text-warning-primary" />
                    <p className="text-sm font-medium text-warning-primary">
                        Este vehículo tiene una deuda pendiente de {formatMoneda(deuda)}.
                    </p>
                </div>
            )}

            <div className="grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-1">
                    <CardBody>
                        {vehiculo.foto_url && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={vehiculo.foto_url} alt={`${vehiculo.marca} ${vehiculo.modelo}`} className="mb-4 h-40 w-full rounded-lg object-cover ring-1 ring-secondary" />
                        )}
                        <div className="flex items-center gap-3">
                            <span className="flex size-12 items-center justify-center rounded-xl bg-brand-primary_alt text-brand-secondary">
                                <Car01 className="size-6" />
                            </span>
                            <div>
                                <p className="font-semibold text-primary">{vehiculo.marca} {vehiculo.modelo}</p>
                                <p className="text-sm text-tertiary">{vehiculo.anio ?? "—"}</p>
                            </div>
                        </div>
                        <dl className="mt-4 flex flex-col gap-2 text-sm">
                            <Fila label="Placa" valor={vehiculo.placa} />
                            <Fila label="Color" valor={vehiculo.color} />
                            <Fila label="Chasis" valor={vehiculo.chasis} />
                            <Fila label="Motor" valor={vehiculo.motor} />
                        </dl>
                    </CardBody>
                </Card>

                <Card className="lg:col-span-2">
                    <CardHeader titulo="Historial de órdenes" descripcion="Todas las OT del vehículo" />
                    <CardBody>
                        {ordenes.length === 0 ? (
                            <p className="text-sm text-tertiary">Sin órdenes registradas.</p>
                        ) : (
                            <div className="flex flex-col gap-3">
                                {ordenes.map((o) => (
                                    <Link key={o.id} href={`/ordenes/${o.id}`} className="flex items-center justify-between rounded-lg border border-secondary p-3 hover:bg-secondary">
                                        <div className="flex items-center gap-3">
                                            <span className="font-semibold text-primary">{o.numero}</span>
                                            <EstadoBadge label={ESTADOS_ORDEN[o.estado].label} color={ESTADOS_ORDEN[o.estado].color} />
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-medium text-primary">{formatMoneda(o.total)}</p>
                                            <p className="text-xs text-tertiary">{formatFecha(o.creado_en)}</p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </CardBody>
                </Card>
            </div>
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
