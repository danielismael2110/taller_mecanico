import { redirect } from "next/navigation";

/**
 * Compatibilidad: algunos triggers de la base de datos generan enlaces de
 * notificación con el prefijo `/ot/<id>`. La ruta real de la orden es
 * `/ordenes/<id>`, así que redirigimos para evitar un 404.
 */
export default async function OtRedirect({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    redirect(`/ordenes/${id}`);
}
