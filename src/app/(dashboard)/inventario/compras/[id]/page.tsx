"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Check } from "@untitledui/icons";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/base/buttons/button";
import { Select } from "@/components/base/select/select";
import { Table, TableCard } from "@/components/application/table/table";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EstadoBadge } from "@/components/ui/estado-badge";
import { PageHeader } from "@/components/ui/page-header";
import { Spinner } from "@/components/ui/spinner";
import { ESTADOS_COMPRA } from "@/lib/constants";
import type { EstadoCompra, OrdenCompra } from "@/lib/types/database";
import { mensajeError } from "@/lib/utils/error-handler";
import { formatFecha, formatMoneda } from "@/lib/utils/formatters";
import { inventarioService } from "@/services/inventario.service";

type Compra = OrdenCompra & { proveedor?: { nombre?: string; nit?: string } | null };
type Item = {
    id: string;
    cantidad: number;
    cantidad_recibida: number;
    precio_unitario: number;
    subtotal: number;
    repuesto?: { nombre?: string; codigo?: string } | null;
};

export default function DetalleCompraPage() {
    const router = useRouter();
    const { id } = useParams<{ id: string }>();
    const [compra, setCompra] = useState<Compra | null>(null);
    const [items, setItems] = useState<Item[]>([]);
    const [nuevoEstado, setNuevoEstado] = useState<string | null>(null);
    const [cargando, setCargando] = useState(true);
    const [procesando, setProcesando] = useState(false);

    const cargar = useCallback(async () => {
        try {
            const [c, d] = await Promise.all([inventarioService.compra(id), inventarioService.detalleCompra(id)]);
            setCompra(c as unknown as Compra);
            setItems(d);
            setNuevoEstado((c as unknown as Compra).estado);
        } catch (e) {
            toast.error(mensajeError(e));
        } finally {
            setCargando(false);
        }
    }, [id]);

    useEffect(() => {
        cargar();
    }, [cargar]);

    const cambiarEstado = async () => {
        if (!nuevoEstado) return;
        setProcesando(true);
        try {
            await inventarioService.cambiarEstadoCompra(id, nuevoEstado as EstadoCompra);
            toast.success("Estado de la compra actualizado.");
            cargar();
        } catch (e) {
            toast.error(mensajeError(e));
        } finally {
            setProcesando(false);
        }
    };

    const recibir = async (item: Item) => {
        const pendiente = item.cantidad - item.cantidad_recibida;
        if (pendiente <= 0) return;
        setProcesando(true);
        try {
            await inventarioService.recibirItem(item.id, pendiente);
            toast.success(`Recibido: ${item.repuesto?.nombre ?? "repuesto"} (+${pendiente} al stock).`);
            cargar();
        } catch (e) {
            toast.error(mensajeError(e));
        } finally {
            setProcesando(false);
        }
    };

    if (cargando || !compra) {
        return (
            <div className="flex justify-center py-20">
                <Spinner size="lg" label="Cargando compra..." />
            </div>
        );
    }

    return (
        <div>
            <Button color="link-gray" iconLeading={ArrowLeft} href="/inventario/compras" className="mb-4">
                Volver a compras
            </Button>
            <PageHeader
                titulo={`Orden de compra ${compra.numero ?? ""}`}
                descripcion={compra.proveedor?.nombre ?? ""}
                acciones={<EstadoBadge label={ESTADOS_COMPRA[compra.estado].label} color={ESTADOS_COMPRA[compra.estado].color} size="md" />}
            />

            <div className="grid gap-6 lg:grid-cols-3">
                <Card>
                    <CardHeader titulo="Cambiar estado" descripcion="Borrador → enviada → recibida" />
                    <CardBody className="flex flex-col gap-4">
                        <Select
                            label="Estado de la compra"
                            selectedKey={nuevoEstado}
                            onSelectionChange={(k) => setNuevoEstado(String(k))}
                            items={Object.values(ESTADOS_COMPRA).map((e) => ({ id: e.value, label: e.label }))}
                        >
                            {(item) => <Select.Item id={item.id}>{item.label}</Select.Item>}
                        </Select>
                        <Button color="primary" iconLeading={Check} isLoading={procesando} isDisabled={nuevoEstado === compra.estado} onClick={cambiarEstado}>
                            Actualizar estado
                        </Button>
                        <dl className="mt-2 flex flex-col gap-1 text-sm">
                            <div className="flex justify-between"><dt className="text-tertiary">Total</dt><dd className="font-medium text-primary">{formatMoneda(compra.total)}</dd></div>
                            <div className="flex justify-between"><dt className="text-tertiary">Creada</dt><dd className="text-primary">{formatFecha(compra.creado_en)}</dd></div>
                            {compra.recibida_en && (
                                <div className="flex justify-between"><dt className="text-tertiary">Recibida</dt><dd className="text-primary">{formatFecha(compra.recibida_en)}</dd></div>
                            )}
                        </dl>
                    </CardBody>
                </Card>

                <div className="lg:col-span-2">
                    <TableCard.Root size="sm">
                        <TableCard.Header title="Repuestos de la compra" description="Recibe cada repuesto para sumarlo al stock" />
                        <Table aria-label="Detalle de compra">
                            <Table.Header>
                                <Table.Head id="rep" label="Repuesto" isRowHeader />
                                <Table.Head id="cant" label="Cant." />
                                <Table.Head id="rec" label="Recibido" />
                                <Table.Head id="precio" label="Precio" />
                                <Table.Head id="acc" label="" />
                            </Table.Header>
                            <Table.Body>
                                {items.map((it) => {
                                    const pendiente = it.cantidad - it.cantidad_recibida;
                                    return (
                                        <Table.Row key={it.id} id={it.id}>
                                            <Table.Cell>{it.repuesto?.nombre ?? "—"}</Table.Cell>
                                            <Table.Cell>{it.cantidad}</Table.Cell>
                                            <Table.Cell>{it.cantidad_recibida}</Table.Cell>
                                            <Table.Cell>{formatMoneda(it.precio_unitario)}</Table.Cell>
                                            <Table.Cell>
                                                {pendiente > 0 ? (
                                                    <Button size="sm" color="secondary" isLoading={procesando} onClick={() => recibir(it)}>
                                                        Recibir ({pendiente})
                                                    </Button>
                                                ) : (
                                                    <EstadoBadge label="Recibido" color="success" />
                                                )}
                                            </Table.Cell>
                                        </Table.Row>
                                    );
                                })}
                            </Table.Body>
                        </Table>
                    </TableCard.Root>
                </div>
            </div>
        </div>
    );
}
