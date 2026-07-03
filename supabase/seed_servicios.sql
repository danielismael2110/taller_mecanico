-- ============================================================================
-- Seed: Catálogo de servicios (tabla public.servicios)
-- Taller GaraGato · precios en Bs · tiempo en minutos
--
-- imagen_url queda en NULL: sube la imagen de cada servicio desde el módulo
-- "Catálogo de servicios" (botón Editar → Subir imagen).
--
-- Idempotente: solo inserta los servicios cuyo "nombre" aún no existe,
-- así puedes ejecutarlo varias veces sin duplicar.
-- Ejecutar en: Supabase Studio → SQL Editor.
-- ============================================================================

insert into public.servicios
    (nombre, descripcion, precio, tiempo_estimado_min, categoria, imagen_url, visible_portal, destacado, activo, orden)
select
    v.nombre, v.descripcion, v.precio, v.tiempo_estimado_min, v.categoria,
    v.imagen_url, v.visible_portal, v.destacado, v.activo, v.orden
from (values
    ('Cambio de aceite y filtro',            'Reemplazo de aceite de motor y filtro de aceite, con revisión de niveles.', 180.00,  45, 'Mantenimiento', null::text, true,  true,  true,  1),
    ('Alineación y balanceo',                'Alineación computarizada de dirección y balanceo de las 4 ruedas.',          150.00,  60, 'Neumáticos',    null::text, true,  false, true,  2),
    ('Cambio de pastillas de freno',         'Sustitución de pastillas de freno y revisión de discos.',                    220.00,  90, 'Frenos',        null::text, true,  true,  true,  3),
    ('Diagnóstico computarizado (scanner)',  'Lectura de códigos de falla con escáner OBD-II y reporte.',                  100.00,  45, 'Diagnóstico',   null::text, true,  true,  true,  4),
    ('Revisión general del vehículo',        'Inspección de motor, frenos, suspensión, luces y fluidos.',                  120.00,  60, 'Diagnóstico',   null::text, true,  false, true,  5),
    ('Cambio de batería',                    'Reemplazo de batería y prueba del sistema de carga.',                         90.00,  30, 'Eléctrico',     null::text, true,  false, true,  6),
    ('Cambio de bujías',                     'Sustitución de bujías de encendido y revisión de cables.',                   160.00,  60, 'Motor',         null::text, true,  false, true,  7),
    ('Cambio de correa de distribución',     'Reemplazo de correa de distribución y tensores.',                            650.00, 240, 'Motor',         null::text, true,  false, true,  8),
    ('Rotación de neumáticos',               'Rotación de neumáticos y ajuste de presión.',                                 80.00,  30, 'Neumáticos',    null::text, true,  false, true,  9),
    ('Cambio de amortiguadores',             'Sustitución de amortiguadores delanteros o traseros.',                       480.00, 150, 'Suspensión',    null::text, true,  false, true, 10),
    ('Recarga de aire acondicionado',        'Recarga de gas refrigerante y revisión de fugas del A/C.',                   250.00,  60, 'Climatización', null::text, true,  false, true, 11),
    ('Lavado y engrase',                     'Lavado general, engrase de puntos y limpieza de chasis.',                     70.00,  40, 'Mantenimiento', null::text, true,  false, true, 12)
) as v(nombre, descripcion, precio, tiempo_estimado_min, categoria, imagen_url, visible_portal, destacado, activo, orden)
where not exists (
    select 1 from public.servicios s where s.nombre = v.nombre
);

-- Verificación rápida:
-- select nombre, categoria, precio, tiempo_estimado_min, visible_portal, destacado
-- from public.servicios order by orden;
