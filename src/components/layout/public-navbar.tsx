"use client";

import { LayoutAlt01, LogOut01, Menu02, Tool01, X as CloseIcon } from "@untitledui/icons";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/base/buttons/button";
import { useAuth } from "@/hooks/use-auth";
import { DASHBOARD_POR_ROL } from "@/lib/constants";
import { ThemeToggle } from "./theme-toggle";

const LINKS = [
    { label: "Inicio", href: "/" },
    { label: "Servicios", href: "/servicios" },
    { label: "Contacto", href: "/contacto" },
];

/** Barra de navegación del portal público. */
export function PublicNavbar() {
    const [abierto, setAbierto] = useState(false);
    const { userId, rol, cargando, logout } = useAuth();

    const panelHref = DASHBOARD_POR_ROL[rol ?? "cliente"];
    const autenticado = !cargando && !!userId;

    const acciones = autenticado ? (
        <>
            <Button size="md" color="secondary" href={panelHref} iconLeading={LayoutAlt01}>
                Ir a mi panel
            </Button>
            <Button size="md" color="primary" iconLeading={LogOut01} onClick={() => logout()}>
                Cerrar sesión
            </Button>
        </>
    ) : (
        <>
            <Button size="md" color="secondary" href="/login">
                Iniciar sesión
            </Button>
            <Button size="md" color="primary" href="/register">
                Registrarse
            </Button>
        </>
    );

    return (
        <header className="sticky top-0 z-40 border-b border-secondary bg-primary/80 backdrop-blur-md">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:px-8">
                <Link href="/" className="flex items-center gap-2">
                    <span className="flex size-9 items-center justify-center rounded-lg bg-brand-solid text-white">
                        <Tool01 className="size-5" />
                    </span>
                    <span className="text-lg font-bold text-primary">GaraGato</span>
                </Link>

                <nav className="hidden items-center gap-8 md:flex">
                    {LINKS.map((l) => (
                        <Link key={l.href} href={l.href} className="text-sm font-semibold text-secondary hover:text-primary">
                            {l.label}
                        </Link>
                    ))}
                </nav>

                <div className="hidden items-center gap-2 md:flex">
                    <ThemeToggle />
                    {acciones}
                </div>

                <button type="button" className="md:hidden" onClick={() => setAbierto(!abierto)} aria-label="Menú">
                    {abierto ? <CloseIcon className="size-6 text-primary" /> : <Menu02 className="size-6 text-primary" />}
                </button>
            </div>

            {abierto && (
                <div className="border-t border-secondary px-4 py-4 md:hidden">
                    <nav className="flex flex-col gap-3">
                        {LINKS.map((l) => (
                            <Link
                                key={l.href}
                                href={l.href}
                                onClick={() => setAbierto(false)}
                                className="text-sm font-semibold text-secondary"
                            >
                                {l.label}
                            </Link>
                        ))}
                        <div className="mt-2 flex gap-2">{acciones}</div>
                    </nav>
                </div>
            )}
        </header>
    );
}
