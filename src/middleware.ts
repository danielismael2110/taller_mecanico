import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/** Rutas privadas que requieren sesión. */
const RUTAS_PRIVADAS = [
    "/admin",
    "/clientes",
    "/ordenes",
    "/presupuestos",
    "/inventario",
    "/citas",
    "/pagos",
    "/cliente",
    "/perfil",
];

/** Rutas de autenticación (si ya hay sesión, no deberían verse). */
const RUTAS_AUTH = ["/login", "/register", "/forgot-password"];

export async function middleware(request: NextRequest) {
    const { supabaseResponse, user } = await updateSession(request);
    const { pathname } = request.nextUrl;

    const esPrivada = RUTAS_PRIVADAS.some((r) => pathname === r || pathname.startsWith(`${r}/`));
    const esAuth = RUTAS_AUTH.some((r) => pathname.startsWith(r));

    // Sin sesión intentando entrar a una ruta privada -> login
    if (!user && esPrivada) {
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        url.searchParams.set("redirect", pathname);
        return NextResponse.redirect(url);
    }

    // Con sesión en una ruta de auth -> al inicio (el cliente decide el dashboard por rol)
    if (user && esAuth) {
        const url = request.nextUrl.clone();
        url.pathname = "/";
        return NextResponse.redirect(url);
    }

    return supabaseResponse;
}

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico|logo.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
