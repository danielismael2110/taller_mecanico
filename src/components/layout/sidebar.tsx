"use client";

import { LogOut01, X as CloseIcon } from "@untitledui/icons";
import { usePathname } from "next/navigation";
import { NavItemBase } from "@/components/application/app-navigation/sidebar-navigation-base";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { LogoMark } from "@/components/foundations/logo/logo-mark";
import { useAuth } from "@/hooks/use-auth";
import type { ItemNav } from "@/lib/navigation";
import { cx } from "@/utils/cx";

interface SidebarProps {
    items: ItemNav[];
    abiertoMovil: boolean;
    onCerrar: () => void;
}

/** Sidebar colapsable: fijo en escritorio, deslizable en móvil. */
export function Sidebar({ items, abiertoMovil, onCerrar }: SidebarProps) {
    const pathname = usePathname();
    const { logout } = useAuth();

    const contenido = (
        <div className="flex h-full w-72 flex-col bg-primary">
            <div className="flex items-center justify-between px-5 py-5">
                <div className="flex items-center gap-2">
                    <LogoMark />
                    <span className="text-lg font-bold text-primary">GaraGato</span>
                </div>
                <span className="lg:hidden">
                    <ButtonUtility size="sm" color="tertiary" icon={CloseIcon} onClick={onCerrar} aria-label="Cerrar menú" />
                </span>
            </div>

            <nav className="flex-1 overflow-y-auto px-4 py-2">
                <ul className="flex flex-col gap-0.5">
                    {items.map((item) => {
                        const activo = pathname === item.href || pathname.startsWith(`${item.href}/`);
                        return (
                            <li key={item.href} className="group/item py-px" onClick={onCerrar}>
                                <NavItemBase type="link" href={item.href} icon={item.icon} current={activo}>
                                    {item.label}
                                </NavItemBase>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            <div className="border-t border-secondary px-4 py-4">
                <Button color="secondary" size="md" iconLeading={LogOut01} className="w-full" onClick={() => logout()}>
                    Cerrar sesión
                </Button>
                <p className="mt-3 px-1 text-xs text-quaternary">GaraGato · v1.0</p>
            </div>
        </div>
    );

    return (
        <>
            {/* Escritorio */}
            <aside className="hidden border-r border-secondary lg:flex">{contenido}</aside>

            {/* Móvil: overlay + panel deslizable */}
            <div className={cx("fixed inset-0 z-50 lg:hidden", abiertoMovil ? "pointer-events-auto" : "pointer-events-none")}>
                <div
                    onClick={onCerrar}
                    className={cx(
                        "absolute inset-0 bg-overlay/70 backdrop-blur-[2px] transition-opacity duration-200",
                        abiertoMovil ? "opacity-100" : "opacity-0",
                    )}
                />
                <div
                    className={cx(
                        "absolute inset-y-0 left-0 shadow-xl transition-transform duration-300 ease-out",
                        abiertoMovil ? "translate-x-0" : "-translate-x-full",
                    )}
                >
                    {contenido}
                </div>
            </div>
        </>
    );
}
