-- ============================================================================
-- Seed: Listado de repuestos del inventario (tabla public.repuestos)
-- Taller GaraGato · precios en Bs (bolivianos)
--
-- Idempotente: solo inserta los repuestos cuyo "codigo" aún no existe,
-- por lo que puedes ejecutarlo varias veces sin duplicar registros.
-- Ejecutar en: Supabase Studio → SQL Editor.
-- ============================================================================

insert into public.repuestos
    (codigo, nombre, categoria, descripcion, precio_compra, precio_venta, stock, stock_minimo, ubicacion, activo)
select
    v.codigo, v.nombre, v.categoria, v.descripcion,
    v.precio_compra, v.precio_venta, v.stock, v.stock_minimo, v.ubicacion, v.activo
from (values
    -- Filtros ----------------------------------------------------------------
    ('FIL-001', 'Filtro de aceite',            'Filtros',      'Filtro de aceite compatible Toyota/Nissan',        22.00,  40.00,  45,  10, 'Estante A1', true),
    ('FIL-002', 'Filtro de aire del motor',    'Filtros',      'Elemento filtrante de aire de admisión',           30.00,  55.00,  30,   8, 'Estante A1', true),
    ('FIL-003', 'Filtro de combustible',       'Filtros',      'Filtro de línea de combustible a gasolina',        28.00,  50.00,  25,   8, 'Estante A2', true),
    ('FIL-004', 'Filtro de cabina',            'Filtros',      'Filtro antipolen del habitáculo',                  35.00,  65.00,  18,   6, 'Estante A2', true),

    -- Lubricantes y fluidos --------------------------------------------------
    ('LUB-001', 'Aceite de motor 15W-40 (1L)', 'Lubricantes',  'Aceite mineral multigrado, envase 1 litro',        35.00,  60.00,  60,  15, 'Estante B1', true),
    ('LUB-002', 'Aceite sintético 5W-30 (1L)', 'Lubricantes',  'Aceite 100% sintético, envase 1 litro',            55.00,  95.00,  40,  12, 'Estante B1', true),
    ('LUB-003', 'Líquido de frenos DOT 4',     'Lubricantes',  'Líquido de frenos DOT 4, 500 ml',                  25.00,  45.00,  22,   8, 'Estante B2', true),
    ('LUB-004', 'Refrigerante (galón)',        'Lubricantes',  'Anticongelante/refrigerante concentrado, 1 gal',   45.00,  80.00,  15,   6, 'Estante B2', true),
    ('LUB-005', 'Grasa multipropósito (1kg)',  'Lubricantes',  'Grasa de litio para rodamientos',                  20.00,  38.00,  12,   5, 'Estante B3', true),

    -- Frenos -----------------------------------------------------------------
    ('FRE-001', 'Pastillas de freno del.',     'Frenos',       'Juego de pastillas de freno delanteras',           90.00, 160.00,  25,   8, 'Estante C1', true),
    ('FRE-002', 'Pastillas de freno tras.',    'Frenos',       'Juego de pastillas de freno traseras',             80.00, 140.00,  20,   8, 'Estante C1', true),
    ('FRE-003', 'Disco de freno ventilado',    'Frenos',       'Disco de freno delantero ventilado',              180.00, 300.00,   3,   4, 'Estante C2', true),
    ('FRE-004', 'Zapatas de freno',            'Frenos',       'Juego de zapatas de freno traseras',               70.00, 120.00,  14,   6, 'Estante C2', true),

    -- Suspensión y dirección -------------------------------------------------
    ('SUS-001', 'Amortiguador delantero',      'Suspensión',   'Amortiguador delantero a gas',                    220.00, 380.00,   8,   4, 'Estante D1', true),
    ('SUS-002', 'Rótula de suspensión',        'Suspensión',   'Rótula inferior de suspensión',                    60.00, 110.00,  16,   6, 'Estante D1', true),
    ('SUS-003', 'Terminal de dirección',       'Suspensión',   'Terminal de dirección exterior',                   55.00, 100.00,  12,   6, 'Estante D2', true),

    -- Motor y encendido ------------------------------------------------------
    ('MOT-001', 'Bujía de encendido',          'Motor',        'Bujía de encendido estándar',                      18.00,  35.00,  80,  20, 'Estante E1', true),
    ('MOT-002', 'Correa de distribución',      'Motor',        'Correa de distribución dentada',                  120.00, 210.00,   9,   4, 'Estante E1', true),
    ('MOT-003', 'Bomba de agua',               'Motor',        'Bomba de agua del sistema de refrigeración',      160.00, 280.00,   6,   3, 'Estante E2', true),
    ('MOT-004', 'Correa de alternador',        'Motor',        'Banda/correa del alternador',                      40.00,  75.00,  18,   6, 'Estante E2', true),

    -- Sistema eléctrico ------------------------------------------------------
    ('ELE-001', 'Batería 12V 60Ah',           'Eléctrico',    'Batería de arranque 12V 60Ah',                    380.00, 600.00,   2,   3, 'Estante F1', true),
    ('ELE-002', 'Foco halógeno H4',            'Eléctrico',    'Foco halógeno H4 12V 60/55W',                      20.00,  40.00,  30,  10, 'Estante F1', true),
    ('ELE-003', 'Caja de fusibles surtidos',   'Eléctrico',    'Surtido de fusibles de cuchilla',                  15.00,  30.00,  25,   8, 'Estante F2', true),
    ('ELE-004', 'Escobillas limpiaparabrisas', 'Eléctrico',    'Par de plumillas limpiaparabrisas',                30.00,  55.00,  20,   6, 'Estante F2', true),

    -- Neumáticos -------------------------------------------------------------
    ('NEU-001', 'Neumático 185/65 R15',        'Neumáticos',   'Neumático radial 185/65 R15',                     320.00, 520.00,  16,   4, 'Estante G1', true)
) as v(codigo, nombre, categoria, descripcion, precio_compra, precio_venta, stock, stock_minimo, ubicacion, activo)
where not exists (
    select 1 from public.repuestos r where r.codigo = v.codigo
);

-- Verificación rápida del resultado:
-- select codigo, nombre, categoria, stock, stock_minimo, precio_venta
-- from public.repuestos order by categoria, nombre;
