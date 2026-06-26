import { formatMoneda, formatFecha } from "./formatters";

/**
 * jsPDF y jsPDF-AutoTable se cargan dinámicamente (solo en el navegador) para
 * evitar que el bundler los resuelva en el entorno de servidor (SSR).
 * Las funciones se invocan desde manejadores de eventos en el cliente.
 */
async function cargarJsPDF() {
    const { default: jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;
    return { jsPDF, autoTable };
}

interface CabeceraPDF {
    titulo: string;
    subtitulo?: string;
    taller?: string;
}

/** Orden de trabajo completa en PDF (RF-032): datos, problema, diagnóstico, ítems y totales. */
export async function generarOrdenPDF(params: {
    numero: string;
    cliente: string;
    vehiculo: string;
    estado: string;
    prioridad: string;
    fecha: string;
    problema?: string | null;
    diagnostico?: string | null;
    trabajo?: string | null;
    horas?: number | null;
    lineas: { tipo: string; descripcion: string; cantidad: number; precio: number; subtotal: number }[];
    subtotalServicios: number;
    subtotalRepuestos: number;
    descuento: number;
    iva: number;
    ivaPorcentaje: number;
    total: number;
    moneda?: string;
}) {
    const { moneda = "Bs" } = params;
    const { jsPDF, autoTable } = await cargarJsPDF();
    const doc = new jsPDF();
    cabecera(doc, { titulo: `Orden de trabajo ${params.numero}`, subtitulo: `${params.estado} · Prioridad ${params.prioridad}` });

    // Datos generales
    doc.setFontSize(10);
    doc.setTextColor(40, 40, 40);
    doc.text(`Cliente: ${params.cliente}`, 14, 44);
    doc.text(`Vehículo: ${params.vehiculo}`, 14, 50);
    doc.text(`Fecha: ${formatFecha(params.fecha)}`, 140, 44);
    if (params.horas) doc.text(`Horas de trabajo: ${params.horas} h`, 140, 50);

    let y = 60;
    const bloqueTexto = (titulo: string, texto?: string | null) => {
        doc.setFontSize(11);
        doc.setTextColor(92, 11, 139);
        doc.text(titulo, 14, y);
        y += 6;
        doc.setFontSize(10);
        doc.setTextColor(60, 60, 60);
        const lineas = doc.splitTextToSize(texto && texto.trim() ? texto : "—", 182);
        doc.text(lineas, 14, y);
        y += lineas.length * 5 + 4;
    };
    bloqueTexto("Problema reportado", params.problema);
    bloqueTexto("Diagnóstico", params.diagnostico);
    bloqueTexto("Trabajo realizado", params.trabajo);

    // Tabla de ítems
    autoTable(doc, {
        startY: y,
        head: [["Tipo", "Descripción", "Cant.", "Precio", "Subtotal"]],
        body: params.lineas.map((l) => [
            l.tipo,
            l.descripcion,
            l.cantidad,
            formatMoneda(l.precio, moneda),
            formatMoneda(l.subtotal, moneda),
        ]),
        styles: { fontSize: 9 },
        headStyles: { fillColor: [92, 11, 139] },
    });

    const yTot = ((doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y) + 8;
    const x = 140;
    doc.setFontSize(10);
    doc.setTextColor(40, 40, 40);
    doc.text("Servicios:", x, yTot);
    doc.text(formatMoneda(params.subtotalServicios, moneda), 196, yTot, { align: "right" });
    doc.text("Repuestos:", x, yTot + 6);
    doc.text(formatMoneda(params.subtotalRepuestos, moneda), 196, yTot + 6, { align: "right" });
    doc.text("Descuento:", x, yTot + 12);
    doc.text(`- ${formatMoneda(params.descuento, moneda)}`, 196, yTot + 12, { align: "right" });
    doc.text(`IVA (${params.ivaPorcentaje}%):`, x, yTot + 18);
    doc.text(formatMoneda(params.iva, moneda), 196, yTot + 18, { align: "right" });
    doc.setFontSize(12);
    doc.setTextColor(92, 11, 139);
    doc.text("TOTAL:", x, yTot + 26);
    doc.text(formatMoneda(params.total, moneda), 196, yTot + 26, { align: "right" });

    doc.save(`orden-${params.numero}.pdf`);
}

function cabecera(doc: import("jspdf").jsPDF, { titulo, subtitulo, taller = "Taller Mecánico GaraGato" }: CabeceraPDF) {
    doc.setFontSize(18);
    doc.setTextColor(92, 11, 139);
    doc.text(taller, 14, 18);
    doc.setFontSize(13);
    doc.setTextColor(40, 40, 40);
    doc.text(titulo, 14, 27);
    if (subtitulo) {
        doc.setFontSize(10);
        doc.setTextColor(120, 120, 120);
        doc.text(subtitulo, 14, 33);
    }
    doc.setDrawColor(230, 230, 230);
    doc.line(14, 36, 196, 36);
}

/** PDF genérico a partir de columnas + filas. */
export async function exportarTablaPDF(
    titulo: string,
    columnas: string[],
    filas: (string | number)[][],
    nombreArchivo: string,
    subtitulo?: string,
) {
    const { jsPDF, autoTable } = await cargarJsPDF();
    const doc = new jsPDF();
    cabecera(doc, { titulo, subtitulo });
    autoTable(doc, {
        startY: 42,
        head: [columnas],
        body: filas,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [92, 11, 139] },
    });
    doc.save(`${nombreArchivo}.pdf`);
}

/** Boleta/comprobante interno con desglose de IVA. */
export async function generarBoletaPDF(params: {
    numero: string;
    cliente: string;
    fecha: string;
    lineas: { descripcion: string; cantidad: number; precio: number }[];
    subtotal: number;
    descuento: number;
    iva: number;
    total: number;
    moneda?: string;
}) {
    const { numero, cliente, fecha, lineas, subtotal, descuento, iva, total, moneda = "Bs" } = params;
    const { jsPDF, autoTable } = await cargarJsPDF();
    const doc = new jsPDF();
    cabecera(doc, { titulo: `Comprobante ${numero}`, subtitulo: "Documento interno · No es factura fiscal" });

    doc.setFontSize(10);
    doc.setTextColor(40, 40, 40);
    doc.text(`Cliente: ${cliente}`, 14, 44);
    doc.text(`Fecha: ${formatFecha(fecha)}`, 14, 50);

    autoTable(doc, {
        startY: 56,
        head: [["Descripción", "Cant.", "Precio", "Subtotal"]],
        body: lineas.map((l) => [l.descripcion, l.cantidad, formatMoneda(l.precio, moneda), formatMoneda(l.precio * l.cantidad, moneda)]),
        styles: { fontSize: 9 },
        headStyles: { fillColor: [92, 11, 139] },
    });

    const y = ((doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 80) + 8;
    const x = 140;
    doc.setFontSize(10);
    doc.text("Subtotal:", x, y);
    doc.text(formatMoneda(subtotal, moneda), 196, y, { align: "right" });
    doc.text("Descuento:", x, y + 6);
    doc.text(`- ${formatMoneda(descuento, moneda)}`, 196, y + 6, { align: "right" });
    doc.text("IVA:", x, y + 12);
    doc.text(formatMoneda(iva, moneda), 196, y + 12, { align: "right" });
    doc.setFontSize(12);
    doc.setTextColor(92, 11, 139);
    doc.text("TOTAL:", x, y + 20);
    doc.text(formatMoneda(total, moneda), 196, y + 20, { align: "right" });

    doc.save(`comprobante-${numero}.pdf`);
}
