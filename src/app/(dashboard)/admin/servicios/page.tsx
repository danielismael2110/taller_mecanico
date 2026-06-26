"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Edit01, Image01, Plus, Trash01, UploadCloud01 } from "@untitledui/icons";
import { toast } from "sonner";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { Input } from "@/components/base/input/input";
import { TextArea } from "@/components/base/textarea/textarea";
import { Dialog, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { ConfirmacionModal } from "@/components/business/confirmacion-modal";
import { RequiereRol } from "@/components/layout/requiere-rol";
import { DataTable, type Columna } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import type { Servicio } from "@/lib/types/database";
import { mensajeError } from "@/lib/utils/error-handler";
import { formatDuracion, formatMoneda } from "@/lib/utils/formatters";
import { serviciosService } from "@/services/servicios.service";

export default function ServiciosAdminPage() {
    const [servicios, setServicios] = useState<Servicio[]>([]);
    const [cargando, setCargando] = useState(true);
    const [editar, setEditar] = useState<Servicio | "nuevo" | null>(null);
    const [aEliminar, setAEliminar] = useState<Servicio | null>(null);
    const [procesando, setProcesando] = useState(false);

    const cargar = useCallback(async () => {
        setCargando(true);
        try {
            setServicios(await serviciosService.listar(false));
        } catch (e) {
            toast.error(mensajeError(e));
        } finally {
            setCargando(false);
        }
    }, []);

    useEffect(() => {
        cargar();
    }, [cargar]);

    const eliminar = async () => {
        if (!aEliminar) return;
        setProcesando(true);
        try {
            await serviciosService.eliminar(aEliminar.id);
            toast.success("Servicio eliminado.");
            setAEliminar(null);
            cargar();
        } catch (e) {
            toast.error(mensajeError(e));
        } finally {
            setProcesando(false);
        }
    };

    const columnas: Columna<Servicio>[] = [
        {
            key: "img",
            header: "",
            render: (s) =>
                s.imagen_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={s.imagen_url} alt={s.nombre} className="size-10 rounded-md object-cover ring-1 ring-secondary" />
                ) : (
                    <span className="flex size-10 items-center justify-center rounded-md bg-secondary text-fg-quaternary"><Image01 className="size-5" /></span>
                ),
        },
        { key: "nombre", header: "Servicio", isRowHeader: true, render: (s) => <span className="font-medium text-primary">{s.nombre}</span> },
        { key: "categoria", header: "Categoría", render: (s) => s.categoria ?? "—" },
        { key: "precio", header: "Precio", render: (s) => formatMoneda(s.precio) },
        { key: "tiempo", header: "Tiempo", render: (s) => formatDuracion(s.tiempo_estimado_min) },
        {
            key: "visible",
            header: "Portal",
            render: (s) => (
                <div className="flex flex-wrap gap-1">
                    <Badge color={s.visible_portal ? "success" : "gray"} type="pill-color" size="sm">
                        {s.visible_portal ? "Visible" : "Oculto"}
                    </Badge>
                    {s.destacado && (
                        <Badge color="brand" type="pill-color" size="sm">Destacado</Badge>
                    )}
                </div>
            ),
        },
        {
            key: "acc",
            header: "",
            render: (s) => (
                <div className="flex justify-end gap-1">
                    <ButtonUtility size="sm" color="tertiary" icon={Edit01} tooltip="Editar" onClick={() => setEditar(s)} />
                    <ButtonUtility size="sm" color="tertiary" icon={Trash01} tooltip="Eliminar" onClick={() => setAEliminar(s)} />
                </div>
            ),
        },
    ];

    return (
        <RequiereRol roles={["admin", "recepcionista"]}>
            <PageHeader
                titulo="Catálogo de servicios"
                descripcion="Agrega, edita o elimina los servicios del taller."
                acciones={<Button color="primary" iconLeading={Plus} onClick={() => setEditar("nuevo")}>Nuevo servicio</Button>}
            />
            <DataTable columnas={columnas} filas={servicios} getId={(s) => s.id} cargando={cargando} mensajeVacio="Aún no hay servicios. Crea el primero." />

            {editar && (
                <ModalServicio
                    servicio={editar === "nuevo" ? null : editar}
                    onCerrar={() => setEditar(null)}
                    onGuardado={() => { setEditar(null); cargar(); }}
                />
            )}

            <ConfirmacionModal
                abierto={!!aEliminar}
                onCerrar={() => setAEliminar(null)}
                onConfirmar={eliminar}
                titulo="Eliminar servicio"
                mensaje={`¿Eliminar "${aEliminar?.nombre}" del catálogo?`}
                textoConfirmar="Eliminar"
                peligro
                cargando={procesando}
            />
        </RequiereRol>
    );
}

function ModalServicio({ servicio, onCerrar, onGuardado }: { servicio: Servicio | null; onCerrar: () => void; onGuardado: () => void }) {
    const [nombre, setNombre] = useState(servicio?.nombre ?? "");
    const [descripcion, setDescripcion] = useState(servicio?.descripcion ?? "");
    const [categoria, setCategoria] = useState(servicio?.categoria ?? "");
    const [precio, setPrecio] = useState(String(servicio?.precio ?? 0));
    const [tiempo, setTiempo] = useState(servicio?.tiempo_estimado_min ? String(servicio.tiempo_estimado_min) : "");
    const [visible, setVisible] = useState(servicio?.visible_portal ?? true);
    const [destacado, setDestacado] = useState(servicio?.destacado ?? false);
    const [imagenUrl, setImagenUrl] = useState<string | null>(servicio?.imagen_url ?? null);
    const [subiendo, setSubiendo] = useState(false);
    const [guardando, setGuardando] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    const subirImagen = async (file: File) => {
        setSubiendo(true);
        try {
            const url = await serviciosService.subirImagen(file);
            setImagenUrl(url);
            toast.success("Imagen subida.");
        } catch (e) {
            toast.error(mensajeError(e));
        } finally {
            setSubiendo(false);
        }
    };

    const guardar = async () => {
        if (!nombre.trim()) return toast.error("El nombre es obligatorio.");
        if (!imagenUrl) return toast.error("Agrega una imagen del servicio.");
        setGuardando(true);
        try {
            const datos = {
                nombre,
                descripcion: descripcion || null,
                categoria: categoria || null,
                precio: Number(precio) || 0,
                tiempo_estimado_min: tiempo ? Number(tiempo) : null,
                imagen_url: imagenUrl,
                visible_portal: visible,
                destacado,
            };
            if (servicio) await serviciosService.actualizar(servicio.id, datos);
            else await serviciosService.crear(datos);
            toast.success(servicio ? "Servicio actualizado." : "Servicio creado.");
            onGuardado();
        } catch (e) {
            toast.error(mensajeError(e));
        } finally {
            setGuardando(false);
        }
    };

    return (
        <ModalOverlay isOpen onOpenChange={(o) => !o && onCerrar()} isDismissable>
            <Modal className="max-w-lg">
                <Dialog>
                    <div className="rounded-2xl bg-primary p-6 shadow-xl">
                        <h2 className="text-lg font-semibold text-primary">{servicio ? "Editar servicio" : "Nuevo servicio"}</h2>
                        <div className="mt-4 flex flex-col gap-4">
                            <div>
                                <p className="mb-1.5 text-sm font-medium text-secondary">Imagen del servicio</p>
                                <div className="flex items-center gap-4">
                                    {imagenUrl ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={imagenUrl} alt="Servicio" className="size-20 rounded-lg object-cover ring-1 ring-secondary" />
                                    ) : (
                                        <div className="flex size-20 items-center justify-center rounded-lg border border-dashed border-secondary text-fg-quaternary">
                                            <Image01 className="size-6" />
                                        </div>
                                    )}
                                    <div>
                                        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && subirImagen(e.target.files[0])} />
                                        <Button size="sm" color="secondary" iconLeading={UploadCloud01} isLoading={subiendo} onClick={() => fileRef.current?.click()}>
                                            {imagenUrl ? "Cambiar imagen" : "Subir imagen"}
                                        </Button>
                                        <p className="mt-1 text-xs text-tertiary">JPG, PNG o WebP. Máx. 5 MB.</p>
                                    </div>
                                </div>
                            </div>
                            <Input label="Nombre" value={nombre} onChange={setNombre} isRequired />
                            <div className="grid gap-4 sm:grid-cols-2">
                                <Input label="Categoría" value={categoria} onChange={setCategoria} placeholder="Mantenimiento, Frenos..." />
                                <Input label="Precio (Bs)" type="number" value={precio} onChange={setPrecio} />
                            </div>
                            <Input label="Tiempo estimado (minutos)" type="number" value={tiempo} onChange={setTiempo} placeholder="60" />
                            <TextArea label="Descripción" value={descripcion} onChange={setDescripcion} placeholder="Qué incluye el servicio" />
                            <Checkbox
                                label="Visible en el portal público"
                                hint="Si lo desactivas, no aparece en el catálogo público."
                                isSelected={visible}
                                onChange={setVisible}
                            />
                            <Checkbox
                                label="Destacado en el inicio"
                                hint="Aparece en la sección 'Servicios destacados' de la página de inicio."
                                isSelected={destacado}
                                onChange={setDestacado}
                            />
                        </div>
                        <div className="mt-6 flex justify-end gap-3">
                            <Button color="secondary" onClick={onCerrar}>Cancelar</Button>
                            <Button color="primary" isLoading={guardando} onClick={guardar}>{servicio ? "Guardar" : "Crear servicio"}</Button>
                        </div>
                    </div>
                </Dialog>
            </Modal>
        </ModalOverlay>
    );
}
