"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Plus, Trash01 } from "@untitledui/icons";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Input } from "@/components/base/input/input";
import { Select } from "@/components/base/select/select";
import { TextArea } from "@/components/base/textarea/textarea";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import type { Proveedor } from "@/lib/types/database";
import { mensajeError } from "@/lib/utils/error-handler";
import { formatMoneda } from "@/lib/utils/formatters";
import { inventarioService } from "@/services/inventario.service";

interface ItemCompra {
    repuesto_id: string;
    nombre: string;
    cantidad: number;
    precio_unitario: number;
}

export default function NuevaCompraPage() {
    const router = useRouter();
    const [proveedores, setProveedores] = useState<Proveedor[]>([]);
    const [opcionesRep, setOpcionesRep] = useState<{ id: string; nombre: string; precio_compra: number }[]>([]);
    const [proveedorId, setProveedorId] = useState<string | null>(null);
    const [items, setItems] = useState<ItemCompra[]>([]);
    const [repSel, setRepSel] = useState<string | null>(null);
    const [cantidad, setCantidad] = useState("1");
    const [notas, setNotas] = useState("");
    const [guardando, setGuardando] = useState(false);

    useEffect(() => {
        inventarioService.proveedores().then(setProveedores).catch(() => {});
        inventarioService.listar().then((r) => setOpcionesRep(r.map((x) => ({ id: x.id, nombre: x.nombre, precio_compra: x.precio_compra })))).catch(() => {});
    }, []);

    const agregarItem = () => {
        const rep = opcionesRep.find((r) => r.id === repSel);
        if (!rep) return toast.error("Selecciona un repuesto.");
        setItems((prev) => [...prev, { repuesto_id: rep.id, nombre: rep.nombre, cantidad: Number(cantidad) || 1, precio_unitario: rep.precio_compra }]);
        setRepSel(null);
        setCantidad("1");
    };

    const total = items.reduce((acc, i) => acc + i.cantidad * i.precio_unitario, 0);

    const guardar = async () => {
        if (!proveedorId) return toast.error("Selecciona un proveedor.");
        if (items.length === 0) return toast.error("Agrega al menos un repuesto.");
        setGuardando(true);
        try {
            const oc = await inventarioService.crearCompra(
                { proveedor_id: proveedorId, total, notas: notas.trim() || null },
                items.map((i) => ({ repuesto_id: i.repuesto_id, cantidad: i.cantidad, precio_unitario: i.precio_unitario })),
            );
            toast.success(`Orden de compra ${oc.numero} creada.`);
            router.push("/inventario/compras");
        } catch (e) {
            toast.error(mensajeError(e));
        } finally {
            setGuardando(false);
        }
    };

    return (
        <div className="mx-auto max-w-3xl">
            <Button color="link-gray" iconLeading={ArrowLeft} href="/inventario/compras" className="mb-4">Volver a compras</Button>
            <PageHeader titulo="Nueva orden de compra" descripcion="Registra una compra a proveedor." />

            <Card className="mb-6">
                <CardBody className="flex flex-col gap-4">
                    <Select label="Proveedor" placeholder="Selecciona un proveedor" selectedKey={proveedorId} onSelectionChange={(k) => setProveedorId(String(k))} items={proveedores.map((p) => ({ id: p.id, label: p.nombre }))}>
                        {(item) => <Select.Item id={item.id}>{item.label}</Select.Item>}
                    </Select>
                    <TextArea label="Notas" value={notas} onChange={setNotas} placeholder="Observaciones de la compra (opcional)" />
                </CardBody>
            </Card>

            <Card>
                <CardHeader titulo="Repuestos a comprar" />
                <CardBody className="flex flex-col gap-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                        <div className="flex-1">
                            <Select label="Repuesto" placeholder="Selecciona" selectedKey={repSel} onSelectionChange={(k) => setRepSel(String(k))} items={opcionesRep.map((r) => ({ id: r.id, label: r.nombre }))}>
                                {(item) => <Select.Item id={item.id}>{item.label}</Select.Item>}
                            </Select>
                        </div>
                        <div className="w-28">
                            <Input label="Cantidad" type="number" value={cantidad} onChange={setCantidad} />
                        </div>
                        <Button color="secondary" iconLeading={Plus} onClick={agregarItem}>Agregar</Button>
                    </div>

                    {items.length > 0 && (
                        <ul className="divide-y divide-secondary rounded-lg border border-secondary">
                            {items.map((i, idx) => (
                                <li key={idx} className="flex items-center justify-between px-4 py-2 text-sm">
                                    <span className="text-primary">{i.nombre} × {i.cantidad}</span>
                                    <div className="flex items-center gap-3">
                                        <span className="text-tertiary">{formatMoneda(i.cantidad * i.precio_unitario)}</span>
                                        <ButtonUtility size="sm" color="tertiary" icon={Trash01} onClick={() => setItems((prev) => prev.filter((_, n) => n !== idx))} />
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}

                    <div className="flex items-center justify-between border-t border-secondary pt-3 text-base font-semibold text-primary">
                        <span>Total</span>
                        <span>{formatMoneda(total)}</span>
                    </div>

                    <div className="flex justify-end gap-3">
                        <Button color="secondary" onClick={() => router.push("/inventario/compras")}>Cancelar</Button>
                        <Button color="primary" isLoading={guardando} onClick={guardar}>Crear orden de compra</Button>
                    </div>
                </CardBody>
            </Card>
        </div>
    );
}
