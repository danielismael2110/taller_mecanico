import { NextResponse } from "next/server";

/**
 * La exportación a Excel se realiza en el cliente con SheetJS/xlsx
 * (ver src/lib/utils/excel-export.ts). Este endpoint queda disponible para
 * una futura generación server-side.
 */
export async function GET() {
    return NextResponse.json(
        { mensaje: "La exportación Excel se genera en el cliente (lib/utils/excel-export)." },
        { status: 200 },
    );
}
