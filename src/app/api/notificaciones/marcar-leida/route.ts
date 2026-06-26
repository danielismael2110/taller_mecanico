import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Marca una notificación como leída para el usuario autenticado. */
export async function POST(request: Request) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const { id } = await request.json().catch(() => ({ id: null }));
    if (!id) return NextResponse.json({ error: "Falta el id" }, { status: 400 });

    const { error } = await supabase.from("notificaciones").update({ leida: true }).eq("id", id).eq("usuario_id", user.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({ ok: true });
}
