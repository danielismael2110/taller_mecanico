"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Edit01, Eye, Plus } from "@untitledui/icons";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Avatar } from "@/components/base/avatar/avatar";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Input } from "@/components/base/input/input";
import { Dialog, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { DataTable, type Columna } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import type { Proveedor } from "@/lib/types/database";
import { mensajeError } from "@/lib/utils/error-handler";
import { formatFechaHora, getIniciales } from "@/lib/utils/formatters";
import { inventarioService } from "@/services/inventario.service";

export default function ProveedoresPage() {
    const router = useRouter();
    const [proveedores, setProveedores] = useState<Proveedor[]>([]);
    const [cargando, setCargando] = useState(true);
    const [modal, setModal] = useState(false);
    const [aEditar, setAEditar] = useState<Proveedor | null>(null);
    const [aVer, setAVer] = useState<Proveedor | null>(null);

    const cargar = useCallback(async () => {
        setCargando(true);
        try {
            setProveedores(await inventarioService.proveedores());
        } catch (e) {
            toast.error(mensajeError(e));
        } finally {
            setCargando(false);
        }
    }, []);

    useEffect(() => {
        cargar();
    }, [cargar]);

    const columnas: Columna<Proveedor>[] = [
        { key: "nombre", header: "Nombre", isRowHeader: true, render: (p) => <span className="font-medium text-primary">{p.nombre}</span> },
        { key: "nit", header: "NIT", render: (p) => p.nit ?? "—" },
        { key: "telefono", header: "Teléfono", render: (p) => p.telefono ?? "—" },
        { key: "correo", header: "Correo", render: (p) => p.correo ?? "—" },
        {
            key: "acc",
            header: "",
            render: (p) => (
                <div className="flex justify-end gap-1">
                    <ButtonUtility size="sm" color="tertiary" icon={Eye} tooltip="Ver detalle" onClick={() => setAVer(p)} />
                    <ButtonUtility size="sm" color="tertiary" icon={Edit01} tooltip="Editar" onClick={() => setAEditar(p)} />
                </div>
            ),
        },
    ];

    return (
        <div>
            <Button color="link-gray" iconLeading={ArrowLeft} href="/inventario" className="mb-4">Volver al inventario</Button>
            <PageHeader
                titulo="Proveedores"
                descripcion="Gestión de proveedores."
                acciones={<Button color="primary" iconLeading={Plus} onClick={() => setModal(true)}>Nuevo proveedor</Button>}
            />
            <DataTable columnas={columnas} filas={proveedores} getId={(p) => p.id} cargando={cargando} mensajeVacio="No hay proveedores." />

            {modal && <ModalProveedor onCerrar={() => setModal(false)} onGuardado={() => { setModal(false); cargar(); }} />}
            {aEditar && <ModalProveedor proveedor={aEditar} onCerrar={() => setAEditar(null)} onGuardado={() => { setAEditar(null); cargar(); }} />}
            {aVer && (
                <ModalDetalleProveedor
                    proveedor={aVer}
                    onCerrar={() => setAVer(null)}
                    onEditar={() => { setAEditar(aVer); setAVer(null); }}
                />
            )}
        </div>
    );
}

function FilaDetalle({ etiqueta, valor }: { etiqueta: string; valor: string }) {
    return (
        <div className="flex justify-between gap-4 py-3">
            <dt className="shrink-0 text-sm text-tertiary">{etiqueta}</dt>
            <dd className="text-right text-sm font-medium break-all text-primary">{valor}</dd>
        </div>
    );
}

/** Vista de detalle de un proveedor: datos completos + acción de edición. */
function ModalDetalleProveedor({ proveedor, onCerrar, onEditar }: { proveedor: Proveedor; onCerrar: () => void; onEditar: () => void }) {
    return (
        <ModalOverlay isOpen onOpenChange={(o) => !o && onCerrar()} isDismissable>
            <Modal className="max-w-lg">
                <Dialog>
                    <div className="rounded-2xl bg-primary p-6 shadow-xl">
                        <div className="flex items-center gap-4">
                            <Avatar size="lg" initials={getIniciales(proveedor.nombre)} alt={proveedor.nombre} />
                            <div className="min-w-0">
                                <h2 className="truncate text-lg font-semibold text-primary">{proveedor.nombre}</h2>
                                <p className="mt-0.5 text-sm text-tertiary">Proveedor</p>
                            </div>
                            <div className="ml-auto shrink-0">
                                <Badge color={proveedor.activo ? "success" : "gray"} type="pill-color" size="md">
                                    {proveedor.activo ? "Activo" : "Inactivo"}
                                </Badge>
                            </div>
                        </div>

                        <dl className="mt-6 divide-y divide-secondary border-t border-secondary">
                            <FilaDetalle etiqueta="Nombre" valor={proveedor.nombre} />
                            <FilaDetalle etiqueta="NIT" valor={proveedor.nit ?? "—"} />
                            <FilaDetalle etiqueta="Teléfono" valor={proveedor.telefono ?? "—"} />
                            <FilaDetalle etiqueta="Correo" valor={proveedor.correo ?? "—"} />
                            <FilaDetalle etiqueta="Dirección" valor={proveedor.direccion ?? "—"} />
                            <FilaDetalle etiqueta="Estado" valor={proveedor.activo ? "Activo" : "Inactivo"} />
                            <FilaDetalle etiqueta="Fecha de creación" valor={formatFechaHora(proveedor.creado_en)} />
                        </dl>

                        <div className="mt-6 flex justify-end gap-3">
                            <Button color="secondary" onClick={onCerrar}>Cerrar</Button>
                            <Button color="primary" iconLeading={Edit01} onClick={onEditar}>Editar</Button>
                        </div>
                    </div>
                </Dialog>
            </Modal>
        </ModalOverlay>
    );
}

/** Formulario de creación/edición de proveedor. Si recibe `proveedor`, edita. */
function ModalProveedor({ proveedor, onCerrar, onGuardado }: { proveedor?: Proveedor; onCerrar: () => void; onGuardado: () => void }) {
    const esEdicion = Boolean(proveedor);
    const [form, setForm] = useState({
        nombre: proveedor?.nombre ?? "",
        nit: proveedor?.nit ?? "",
        telefono: proveedor?.telefono ?? "",
        correo: proveedor?.correo ?? "",
        direccion: proveedor?.direccion ?? "",
    });
    const [guardando, setGuardando] = useState(false);

    const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

    const guardar = async () => {
        if (!form.nombre.trim()) return toast.error("El nombre es obligatorio.");
        setGuardando(true);
        try {
            if (proveedor) {
                await inventarioService.actualizarProveedor(proveedor.id, form);
                toast.success("Proveedor actualizado.");
            } else {
                await inventarioService.crearProveedor(form);
                toast.success("Proveedor creado.");
            }
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
                        <h2 className="text-lg font-semibold text-primary">{esEdicion ? "Editar proveedor" : "Nuevo proveedor"}</h2>
                        <div className="mt-4 flex flex-col gap-4">
                            <Input label="Nombre" value={form.nombre} onChange={set("nombre")} isRequired />
                            <Input label="NIT" value={form.nit} onChange={set("nit")} />
                            <Input label="Teléfono" value={form.telefono} onChange={set("telefono")} />
                            <Input label="Correo" type="email" value={form.correo} onChange={set("correo")} />
                            <Input label="Dirección" value={form.direccion} onChange={set("direccion")} />
                        </div>
                        <div className="mt-6 flex justify-end gap-3">
                            <Button color="secondary" onClick={onCerrar}>Cancelar</Button>
                            <Button color="primary" isLoading={guardando} onClick={guardar}>{esEdicion ? "Guardar cambios" : "Crear"}</Button>
                        </div>
                    </div>
                </Dialog>
            </Modal>
        </ModalOverlay>
    );
}
