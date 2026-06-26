import {
    BarChartSquare02,
    Calendar,
    Car01,
    ClipboardCheck,
    CreditCard01,
    File02,
    Home01,
    Package,
    Settings01,
    Tag01,
    Tool01,
    Truck01,
    User01,
    Users01,
} from "@untitledui/icons";
import type { FC, HTMLAttributes } from "react";
import type { RolUsuario } from "@/lib/types/database";

export type ItemNav = {
    label: string;
    href: string;
    icon: FC<HTMLAttributes<HTMLOrSVGElement>>;
};

/** Navegación del panel interno (admin / recepcionista / mecánico). */
const NAV_ADMIN: ItemNav[] = [
    { label: "Panel", href: "/admin", icon: Home01 },
    { label: "Clientes", href: "/clientes", icon: Users01 },
    { label: "Reportes", href: "/admin/reportes", icon: BarChartSquare02 },
    { label: "Usuarios", href: "/admin/usuarios", icon: User01 },
    { label: "Configuración", href: "/admin/configuracion", icon: Settings01 },
];

const NAV_RECEPCION: ItemNav[] = [
    { label: "Panel", href: "/admin", icon: Home01 },
    { label: "Clientes", href: "/clientes", icon: Users01 },
    { label: "Órdenes de trabajo", href: "/ordenes", icon: ClipboardCheck },
    { label: "Presupuestos", href: "/presupuestos", icon: File02 },
    { label: "Inventario", href: "/inventario", icon: Package },
    { label: "Servicios", href: "/admin/servicios", icon: Tag01 },
    { label: "Citas", href: "/citas", icon: Calendar },
    { label: "Pagos", href: "/pagos", icon: CreditCard01 },
];

const NAV_MECANICO: ItemNav[] = [
    { label: "Órdenes de trabajo", href: "/ordenes", icon: Tool01 },
    { label: "Citas", href: "/citas", icon: Calendar },
    { label: "Inventario", href: "/inventario", icon: Package },
];

/** Navegación del portal del cliente. */
const NAV_CLIENTE: ItemNav[] = [
    { label: "Inicio", href: "/cliente/dashboard", icon: Home01 },
    { label: "Mis órdenes", href: "/cliente/ordenes", icon: Car01 },
    { label: "Mis presupuestos", href: "/cliente/presupuestos", icon: File02 },
    { label: "Mis pagos", href: "/cliente/pagos", icon: CreditCard01 },
    { label: "Mis citas", href: "/cliente/citas", icon: Calendar },
    { label: "Mi perfil", href: "/cliente/perfil", icon: User01 },
];

export function navPorRol(rol: RolUsuario | null): ItemNav[] {
    switch (rol) {
        case "admin":
            return NAV_ADMIN;
        case "recepcionista":
            return NAV_RECEPCION;
        case "mecanico":
            return NAV_MECANICO;
        case "cliente":
            return NAV_CLIENTE;
        default:
            return [];
    }
}

export { Truck01 };
