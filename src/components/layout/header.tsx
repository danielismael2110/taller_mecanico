"use client";

import { Menu02, SearchLg } from "@untitledui/icons";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Input } from "@/components/base/input/input";
import { NotificationBell } from "./notification-bell";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";

interface HeaderProps {
    onAbrirMenu: () => void;
    titulo?: string;
}

/** Cabecera del panel: menú móvil, buscador, tema, campanita y avatar. */
export function Header({ onAbrirMenu, titulo }: HeaderProps) {
    return (
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-secondary bg-primary/80 px-4 backdrop-blur-md lg:px-6">
            <span className="lg:hidden">
                <ButtonUtility size="sm" color="tertiary" icon={Menu02} onClick={onAbrirMenu} aria-label="Abrir menú" />
            </span>

            {titulo && <h1 className="text-lg font-semibold text-primary lg:hidden">{titulo}</h1>}

            <div className="hidden max-w-md flex-1 md:block">
                <Input size="sm" aria-label="Buscar" placeholder="Buscar..." icon={SearchLg} />
            </div>

            <div className="ml-auto flex items-center gap-1">
                <ThemeToggle />
                <NotificationBell />
                <div className="mx-1 h-6 w-px bg-border-secondary" />
                <UserMenu />
            </div>
        </header>
    );
}
