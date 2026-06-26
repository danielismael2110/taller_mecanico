# Guía de despliegue — GaraGato (RNF-035)

## 1. Requisitos

- Node.js 20+ (probado con 22).
- Cuenta de Supabase con el proyecto `taller_garagato`.
- Cuenta en Vercel (recomendado) u otro host de Next.js.

## 2. Configuración de Supabase

1. Entra a tu proyecto en https://supabase.com.
2. Ve a **SQL Editor** y ejecuta el contenido completo de `supabase/migrations/001_initial_schema.sql`.
   - Crea: tablas, ENUM, funciones (`ajustar_stock`, `recibir_item_compra`, `recalcular_totales_orden`, ...), triggers, vistas de reportes, buckets de Storage y políticas RLS.
3. En **Authentication → URL Configuration**, agrega tu dominio (y `http://localhost:3000` para desarrollo) en *Site URL* y *Redirect URLs* (incluye `/reset-password` y `/verify-email`).
4. (Opcional) En **Authentication → Providers → Email**, activa "Confirm email" para la verificación de cuenta (RF-078).

### Crear el primer administrador

Regístrate desde `/register` (quedarás como `cliente`) y luego ejecuta en SQL Editor:

```sql
update perfiles set rol = 'admin' where correo = 'TU_CORREO';
```

## 3. Variables de entorno

Crea `.env.local` (no se versiona — RNF-029):

```
NEXT_PUBLIC_SUPABASE_URL=https://rpctkmqwalhiaqmzlxkl.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx
NEXT_PUBLIC_APP_NAME=GaraGato
```

## 4. Desarrollo local

```bash
npm install
npm run dev
```

## 5. Build de producción

```bash
npm run build
npm run start
```

## 6. Despliegue en Vercel

1. Sube el repositorio a GitHub (RNF-030).
2. Importa el proyecto en Vercel.
3. Configura las variables de entorno (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`).
4. Deploy. HTTPS queda activo por defecto (RNF-008).

## 7. Respaldos (RNF-025/026/027)

- Supabase realiza respaldos automáticos diarios (plan según proyecto).
- Exportación manual adicional: **Database → Backups** o `supabase db dump`.
- Conserva al menos 7 respaldos.

## 8. Datos de prueba sugeridos

Tras crear el admin, carga desde el panel: algunos **servicios** (catálogo público), **repuestos** (inventario) y **clientes** con sus **vehículos** para probar el flujo completo de órdenes de trabajo.
