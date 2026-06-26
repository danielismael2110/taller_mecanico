# GaraGato — Sistema de Gestión de Taller Mecánico

Aplicación web (Next.js 16 + TypeScript + Tailwind v4 + **Untitled UI** + Supabase) para la gestión y control del taller mecánico **GaraGato**. Cubre los 91 RF y los RNF de la especificación. Notificaciones **solo in-app** (campanita).

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Untitled UI** (componentes base/aplicación) + **Tailwind CSS v4**
- **Supabase** (Auth + PostgreSQL + Storage + RLS + Realtime)
- **recharts** (gráficos), **react-big-calendar** (agenda)
- **react-hook-form + zod** (formularios y validación)
- **jsPDF / xlsx** (exportación PDF / Excel), **sonner** (toasts), **next-themes** (dark mode)

## Puesta en marcha

```bash
npm install
# 1) Configura las variables de entorno (ver .env.local)
# 2) Aplica el esquema en Supabase (ver docs/deploy-guide.md)
npm run dev
```

Abre http://localhost:3000.

### Variables de entorno (`.env.local`)

```
NEXT_PUBLIC_SUPABASE_URL=https://rpctkmqwalhiaqmzlxkl.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

> La *publishable key* está diseñada para el navegador; la seguridad real la imponen las políticas **RLS** de Supabase (RNF-006).

### Base de datos

Ejecuta `supabase/migrations/001_initial_schema.sql` en **Supabase → SQL Editor** (o `supabase db push`). Crea tablas, ENUM, funciones, triggers, vistas, buckets de Storage y políticas RLS.

El primer usuario se registra como `cliente`. Para crear un **admin**, cambia su `rol` en la tabla `perfiles` desde el panel de Supabase:

```sql
update perfiles set rol = 'admin' where correo = 'tu-correo@ejemplo.com';
```

## Arquitectura por capas (RNF-028)

```
src/
├── app/                  # Rutas (App Router): (portal) público, (auth), (dashboard)
│   └── api/              # Route handlers
├── components/
│   ├── ui/               # Wrappers de Untitled UI (Card, DataTable, FormFields, ...)
│   ├── layout/           # Sidebar, Header, NotificationBell, DashboardShell
│   └── business/         # Stepper, Timeline, ConfirmacionModal, formularios de negocio
├── contexts/             # AuthContext, NotificationContext, TallerContext
├── hooks/                # useAuth, useNotifications, useInactivity, useDebounce, useOptimisticLock
├── lib/                  # supabase/, types/, constants, navigation, utils (formatters, validators, pdf, excel)
├── services/             # 13 servicios CRUD sobre Supabase
└── middleware.ts         # Protección de rutas
```

## Módulos / Roles

- **Portal público**: landing, catálogo de servicios, contacto.
- **Autenticación**: login, registro, recuperación, verificación de correo.
- **Admin / Recepción**: dashboard con métricas y gráficos, clientes, vehículos, órdenes de trabajo, presupuestos, inventario (repuestos, proveedores, compras), citas, pagos, reportes, usuarios, configuración, logs.
- **Mecánico**: órdenes asignadas, diagnóstico/trabajo, citas, consulta de stock.
- **Cliente**: dashboard, mis órdenes (stepper), presupuestos (aprobar/rechazar), pagos (subir comprobante + QR), citas (solicitar), perfil.

## Características destacadas

- Dashboard responsive tipo "app" con sidebar colapsable y header (buscador, campanita, avatar).
- Stepper de estados y timeline de cambios de la OT.
- Cálculo automático de totales (servicios + repuestos − descuento + IVA configurable).
- Descuento/devolución automática de stock; alertas de stock crítico.
- Citas con disponibilidad en tiempo real (solo horarios libres).
- Notificaciones in-app en tiempo real (Supabase Realtime).
- Dark mode, skeleton loading, toasts, confirmación antes de acciones críticas.
- Cierre de sesión por inactividad (5 min) y bloqueo optimista en OT.

## Scripts

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Compilación de producción |
| `npm run start` | Servidor de producción |

Ver **docs/deploy-guide.md** para el despliegue completo.
