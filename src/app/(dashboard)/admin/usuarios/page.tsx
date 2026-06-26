"use client";

import { useCallback, useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Edit01, Plus, UserCheck01, UserX01 } from "@untitledui/icons";
import { useForm, type Resolver } from "react-hook-form";
import { toast } from "sonner";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Input } from "@/components/base/input/input";
import { Select } from "@/components/base/select/select";
import { Dialog, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { FormInput, FormSelect } from "@/components/ui/form-fields";
import { DataTable, type Columna } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import { RequiereRol } from "@/components/layout/requiere-rol";
import { ROLES, ROL_OPCIONES } from "@/lib/constants";
import type { Perfil } from "@/lib/types/database";
import { mensajeError } from "@/lib/utils/error-handler";
import { usuarioSchema, type UsuarioInput } from "@/lib/utils/validators";
import { usuariosService } from "@/services/usuarios.service";

export default function UsuariosPage() {
    const [usuarios, setUsuarios] = useState<Perfil[]>([]);
    const [cargando, setCargando] = useState(true);
    const [modal, setModal] = useState(false);
    const [aEditar, setAEditar] = useState<Perfil | null>(null);

    const cargar = useCallback(async () => {
        setCargando(true);
        try {
            setUsuarios(await usuariosService.listar());
        } catch (e) {
            toast.error(mensajeError(e));
        } finally {
            setCargando(false);
        }
    }, []);

    useEffect(() => {
        cargar();
    }, [cargar]);

    const toggleActivo = async (u: Perfil) => {
        try {
            if (u.activo) await usuariosService.desactivar(u.id);
            else await usuariosService.reactivar(u.id);
            toast.success(u.activo ? "Usuario desactivado." : "Usuario reactivado.");
            cargar();
        } catch (e) {
            toast.error(mensajeError(e));
        }
    };

    const columnas: Columna<Perfil>[] = [
        { key: "nombre", header: "Nombre", isRowHeader: true, render: (u) => <span className="font-medium text-primary">{u.nombre}</span> },
        { key: "correo", header: "Correo", render: (u) => u.correo ?? "—" },
        {
            key: "rol",
            header: "Rol",
            render: (u) => (
                <span className="inline-flex items-center gap-1.5 text-sm text-primary">
                    <span className="size-2.5 rounded-full" style={{ background: ROLES[u.rol].color }} />
                    {ROLES[u.rol].label}
                </span>
            ),
        },
        { key: "activo", header: "Estado", render: (u) => <Badge color={u.activo ? "success" : "gray"} type="pill-color" size="sm">{u.activo ? "Activo" : "Inactivo"}</Badge> },
        {
            key: "acc",
            header: "",
            render: (u) => (
                <div className="flex justify-end gap-1">
                    <ButtonUtility size="sm" color="tertiary" icon={Edit01} tooltip="Editar" onClick={() => setAEditar(u)} />
                    <ButtonUtility
                        size="sm"
                        color="tertiary"
                        icon={u.activo ? UserX01 : UserCheck01}
                        tooltip={u.activo ? "Desactivar" : "Reactivar"}
                        onClick={() => toggleActivo(u)}
                    />
                </div>
            ),
        },
    ];

    return (
        <RequiereRol roles={["admin"]}>
            <PageHeader
                titulo="Usuarios"
                descripcion="Gestión de usuarios internos."
                acciones={<Button color="primary" iconLeading={Plus} onClick={() => setModal(true)}>Nuevo usuario</Button>}
            />
            <DataTable columnas={columnas} filas={usuarios} getId={(u) => u.id} cargando={cargando} mensajeVacio="No hay usuarios." />
            {modal && <ModalUsuario onCerrar={() => setModal(false)} onGuardado={() => { setModal(false); cargar(); }} />}
            {aEditar && <ModalEditarUsuario usuario={aEditar} onCerrar={() => setAEditar(null)} onGuardado={() => { setAEditar(null); cargar(); }} />}
        </RequiereRol>
    );
}

function ModalEditarUsuario({ usuario, onCerrar, onGuardado }: { usuario: Perfil; onCerrar: () => void; onGuardado: () => void }) {
    const [nombre, setNombre] = useState(usuario.nombre ?? "");
    const [telefono, setTelefono] = useState(usuario.telefono ?? "");
    const [rol, setRol] = useState<string>(usuario.rol);
    const [guardando, setGuardando] = useState(false);

    const guardar = async () => {
        if (!nombre.trim()) return toast.error("El nombre es obligatorio.");
        setGuardando(true);
        try {
            await usuariosService.actualizar(usuario.id, { nombre, telefono, rol: rol as Perfil["rol"] });
            toast.success("Usuario actualizado.");
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
                        <h2 className="text-lg font-semibold text-primary">Editar usuario</h2>
                        <p className="mt-1 text-sm text-tertiary">{usuario.correo}</p>
                        <div className="mt-4 flex flex-col gap-4">
                            <Input label="Nombre" value={nombre} onChange={setNombre} isRequired />
                            <Input label="Teléfono" value={telefono} onChange={setTelefono} />
                            <Select
                                label="Rol"
                                selectedKey={rol}
                                onSelectionChange={(k) => setRol(String(k))}
                                items={ROL_OPCIONES.map((r) => ({ id: r.value, label: r.label }))}
                            >
                                {(item) => <Select.Item id={item.id}>{item.label}</Select.Item>}
                            </Select>
                        </div>
                        <div className="mt-6 flex justify-end gap-3">
                            <Button color="secondary" onClick={onCerrar}>Cancelar</Button>
                            <Button color="primary" isLoading={guardando} onClick={guardar}>Guardar cambios</Button>
                        </div>
                    </div>
                </Dialog>
            </Modal>
        </ModalOverlay>
    );
}

function ModalUsuario({ onCerrar, onGuardado }: { onCerrar: () => void; onGuardado: () => void }) {
    const { control, handleSubmit, formState } = useForm<UsuarioInput>({
        resolver: zodResolver(usuarioSchema) as unknown as Resolver<UsuarioInput>,
        defaultValues: { nombre: "", correo: "", telefono: "", rol: "recepcionista", password: "" },
    });

    const submit = async (datos: UsuarioInput) => {
        try {
            await usuariosService.crear(datos);
            toast.success("Usuario creado. Debe verificar su correo para activarse.");
            onGuardado();
        } catch (e) {
            toast.error(mensajeError(e));
        }
    };

    return (
        <ModalOverlay isOpen onOpenChange={(o) => !o && onCerrar()} isDismissable>
            <Modal className="max-w-md">
                <Dialog>
                    <form onSubmit={handleSubmit(submit)} className="rounded-2xl bg-primary p-6 shadow-xl">
                        <h2 className="text-lg font-semibold text-primary">Nuevo usuario interno</h2>
                        <div className="mt-4 flex flex-col gap-4">
                            <FormInput control={control} name="nombre" label="Nombre" isRequired />
                            <FormInput control={control} name="correo" label="Correo" type="email" isRequired />
                            <FormInput control={control} name="telefono" label="Teléfono" />
                            <FormSelect control={control} name="rol" label="Rol" items={ROL_OPCIONES.filter((r) => r.value !== "cliente").map((r) => ({ id: r.value, label: r.label }))} isRequired />
                            <FormInput control={control} name="password" label="Contraseña temporal" type="password" isRequired />
                        </div>
                        <div className="mt-6 flex justify-end gap-3">
                            <Button color="secondary" type="button" onClick={onCerrar}>Cancelar</Button>
                            <Button color="primary" type="submit" isLoading={formState.isSubmitting}>Crear usuario</Button>
                        </div>
                    </form>
                </Dialog>
            </Modal>
        </ModalOverlay>
    );
}
