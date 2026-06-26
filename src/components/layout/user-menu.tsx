"use client";

import { ChevronDown, LogOut01, Settings01, User01 } from "@untitledui/icons";
import { useRouter } from "next/navigation";
import { Button as AriaButton } from "react-aria-components";
import { Avatar } from "@/components/base/avatar/avatar";
import { Dropdown } from "@/components/base/dropdown/dropdown";
import { useAuth } from "@/hooks/use-auth";
import { ROLES } from "@/lib/constants";
import { getIniciales } from "@/lib/utils/formatters";

/** Menú de usuario con avatar, rol y acciones (perfil, logout). */
export function UserMenu() {
    const router = useRouter();
    const { perfil, correo, rol, logout } = useAuth();

    const rutaPerfil = rol === "cliente" ? "/cliente/perfil" : "/perfil";

    return (
        <Dropdown.Root>
            <AriaButton
                aria-label="Menú de usuario"
                className="flex cursor-pointer items-center gap-2 rounded-lg p-1 outline-focus-ring hover:bg-primary_hover focus-visible:outline-2"
            >
                <Avatar size="sm" src={perfil?.avatar_url} initials={getIniciales(perfil?.nombre)} alt={perfil?.nombre ?? "Usuario"} />
                <span className="hidden flex-col items-start md:flex">
                    <span className="text-sm font-semibold text-primary">{perfil?.nombre ?? "Usuario"}</span>
                    <span className="text-xs text-tertiary">{rol ? ROLES[rol].label : ""}</span>
                </span>
                <ChevronDown className="size-4 text-fg-quaternary" />
            </AriaButton>

            <Dropdown.Popover className="w-64">
                <div className="border-b border-secondary px-3 py-3">
                    <p className="text-sm font-semibold text-primary">{perfil?.nombre}</p>
                    <p className="truncate text-xs text-tertiary">{correo}</p>
                </div>
                <Dropdown.Menu>
                    <Dropdown.Item icon={User01} onAction={() => router.push(rutaPerfil)}>
                        <span className="pr-4">Mi perfil</span>
                    </Dropdown.Item>
                    {(rol === "admin" || rol === "recepcionista") && (
                        <Dropdown.Item icon={Settings01} onAction={() => router.push("/admin/configuracion")}>
                            <span className="pr-4">Configuración</span>
                        </Dropdown.Item>
                    )}
                    <Dropdown.Item icon={LogOut01} onAction={() => logout()}>
                        <span className="pr-4">Cerrar sesión</span>
                    </Dropdown.Item>
                </Dropdown.Menu>
            </Dropdown.Popover>
        </Dropdown.Root>
    );
}
