import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Marca un presupuesto como "enviado". El trigger de la base de datos
 * genera la notificación in-app para el cliente. El envío por Gmail puede
 * integrarse aquí con un proveedor de correo (Resend, Nodemailer, etc.).
 */
export async function POST(request: Request) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const { id } = await request.json().catch(() => ({ id: null }));
    if (!id) return NextResponse.json({ error: "Falta el id del presupuesto" }, { status: 400 });

    const { data, error } = await supabase
        .from("presupuestos")
        .update({ estado: "enviado", enviado_en: new Date().toISOString() })
        .eq("id", id)
        .select("token_publico")
        .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({ ok: true, token: data.token_publico });
}
