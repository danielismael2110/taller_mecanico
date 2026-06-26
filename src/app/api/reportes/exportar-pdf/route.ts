import { NextResponse } from "next/server";

/**
 * La exportación a PDF se realiza en el cliente con jsPDF
 * (ver src/lib/utils/pdf-generator.ts) para no recargar el servidor.
 * Este endpoint queda disponible para una futura generación server-side.
 */
export async function GET() {
    return NextResponse.json(
        { mensaje: "La exportación PDF se genera en el cliente (lib/utils/pdf-generator)." },
        { status: 200 },
    );
}
