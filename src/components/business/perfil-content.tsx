"use client";

import { useEffect, useRef, useState } from "react";
import { UploadCloud01 } from "@untitledui/icons";
import { toast } from "sonner";
import { Avatar } from "@/components/base/avatar/avatar";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { useAuth } from "@/hooks/use-auth";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { mensajeError } from "@/lib/utils/error-handler";
import { getIniciales } from "@/lib/utils/formatters";
import { authService } from "@/services/auth.service";

/** Contenido del perfil: datos, avatar y cambio de contraseña. */
export function PerfilContent() {
    const { userId, perfil, correo, refrescarPerfil } = useAuth();
    const fileRef = useRef<HTMLInputElement>(null);
    const [nombre, setNombre] = useState("");
    const [telefono, setTelefono] = useState("");
    const [password, setPassword] = useState("");
    const [guardando, setGuardando] = useState(false);
    const [cambiando, setCambiando] = useState(false);
    const [subiendo, setSubiendo] = useState(false);

    useEffect(() => {
        if (perfil) {
            setNombre(perfil.nombre ?? "");
            setTelefono(perfil.telefono ?? "");
        }
    }, [perfil]);

    const guardar = async () => {
        if (!userId) return;
        setGuardando(true);
        try {
            await authService.actualizarPerfil(userId, { nombre, telefono });
            await refrescarPerfil();
            toast.success("Perfil actualizado.");
        } catch (e) {
            toast.error(mensajeError(e));
        } finally {
            setGuardando(false);
        }
    };

    const cambiarPassword = async () => {
        if (password.length < 8) return toast.error("La contraseña debe tener al menos 8 caracteres.");
        setCambiando(true);
        try {
            await authService.updatePassword(password);
            setPassword("");
            toast.success("Contraseña actualizada.");
        } catch (e) {
            toast.error(mensajeError(e));
        } finally {
            setCambiando(false);
        }
    };

    const subirAvatar = async (file: File) => {
        if (!userId) return;
        setSubiendo(true);
        try {
            const supabase = getSupabaseBrowserClient();
            const ext = file.name.split(".").pop();
            const path = `${userId}/${Date.now()}.${ext}`;
            const { error } = await supabase.storage.from("avatares").upload(path, file, { upsert: true });
            if (error) throw error;
            const { data } = supabase.storage.from("avatares").getPublicUrl(path);
            await authService.actualizarPerfil(userId, { avatar_url: data.publicUrl });
            await refrescarPerfil();
            toast.success("Avatar actualizado.");
        } catch (e) {
            toast.error(mensajeError(e));
        } finally {
            setSubiendo(false);
        }
    };

    return (
        <div className="mx-auto max-w-2xl">
            <PageHeader titulo="Mi perfil" descripcion="Administra tus datos y tu contraseña." />

            <div className="flex flex-col gap-6">
                <Card>
                    <CardHeader titulo="Datos personales" />
                    <CardBody className="flex flex-col gap-5">
                        <div className="flex items-center gap-4">
                            <Avatar size="xl" src={perfil?.avatar_url} initials={getIniciales(perfil?.nombre)} alt={perfil?.nombre ?? "Usuario"} />
                            <div>
                                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && subirAvatar(e.target.files[0])} />
                                <Button size="sm" color="secondary" iconLeading={UploadCloud01} isLoading={subiendo} onClick={() => fileRef.current?.click()}>
                                    Cambiar foto
                                </Button>
                                <p className="mt-1 text-xs text-tertiary">JPG, PNG o WebP. Máx. 5 MB.</p>
                            </div>
                        </div>

                        <Input label="Nombre" value={nombre} onChange={setNombre} autoComplete="off" />
                        <Input label="Teléfono" type="tel" value={telefono} onChange={setTelefono} autoComplete="off" placeholder="Tu número de teléfono" />
                        <Input label="Correo" value={correo ?? ""} isDisabled autoComplete="off" />

                        <div className="flex justify-end">
                            <Button color="primary" isLoading={guardando} onClick={guardar}>Guardar cambios</Button>
                        </div>
                    </CardBody>
                </Card>

                <Card>
                    <CardHeader titulo="Cambiar contraseña" descripcion="Define una nueva contraseña de acceso" />
                    <CardBody className="flex flex-col gap-4">
                        <Input label="Nueva contraseña" type="password" value={password} onChange={setPassword} placeholder="Mínimo 8 caracteres" autoComplete="new-password" />
                        <div className="flex justify-end">
                            <Button color="secondary" isLoading={cambiando} onClick={cambiarPassword} isDisabled={!password}>
                                Actualizar contraseña
                            </Button>
                        </div>
                    </CardBody>
                </Card>
            </div>
        </div>
    );
}
