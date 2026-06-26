import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Solicita el correo de recuperación de contraseña. */
export async function POST(request: Request) {
    const supabase = await createClient();
    const { correo } = await request.json().catch(() => ({ correo: null }));
    if (!correo) return NextResponse.json({ error: "Falta el correo" }, { status: 400 });

    const origin = request.headers.get("origin") ?? "";
    const { error } = await supabase.auth.resetPasswordForEmail(correo, {
        redirectTo: `${origin}/reset-password`,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({ ok: true });
}
