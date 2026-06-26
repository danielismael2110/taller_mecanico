"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Plus } from "@untitledui/icons";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { Dialog, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { DataTable, type Columna } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import type { Proveedor } from "@/lib/types/database";
import { mensajeError } from "@/lib/utils/error-handler";
import { inventarioService } from "@/services/inventario.service";

export default function ProveedoresPage() {
    const router = useRouter();
    const [proveedores, setProveedores] = useState<Proveedor[]>([]);
    const [cargando, setCargando] = useState(true);
    const [modal, setModal] = useState(false);

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
        </div>
    );
}

function ModalProveedor({ onCerrar, onGuardado }: { onCerrar: () => void; onGuardado: () => void }) {
    const [form, setForm] = useState({ nombre: "", nit: "", telefono: "", correo: "", direccion: "" });
    const [guardando, setGuardando] = useState(false);

    const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

    const guardar = async () => {
        if (!form.nombre.trim()) return toast.error("El nombre es obligatorio.");
        setGuardando(true);
        try {
            await inventarioService.crearProveedor(form);
            toast.success("Proveedor creado.");
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
                        <h2 className="text-lg font-semibold text-primary">Nuevo proveedor</h2>
                        <div className="mt-4 flex flex-col gap-4">
                            <Input label="Nombre" value={form.nombre} onChange={set("nombre")} isRequired />
                            <Input label="NIT" value={form.nit} onChange={set("nit")} />
                            <Input label="Teléfono" value={form.telefono} onChange={set("telefono")} />
                            <Input label="Correo" type="email" value={form.correo} onChange={set("correo")} />
                            <Input label="Dirección" value={form.direccion} onChange={set("direccion")} />
                        </div>
                        <div className="mt-6 flex justify-end gap-3">
                            <Button color="secondary" onClick={onCerrar}>Cancelar</Button>
                            <Button color="primary" isLoading={guardando} onClick={guardar}>Crear</Button>
                        </div>
                    </div>
                </Dialog>
            </Modal>
        </ModalOverlay>
    );
}
