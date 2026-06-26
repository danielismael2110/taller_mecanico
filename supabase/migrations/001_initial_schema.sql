-- =====================================================================
--  PROYECTO : Sistema Web para la Gestión y el Control de un Taller
--  TALLER   : GaraGato  ·  MOTOR: Supabase (PostgreSQL)
--
--  Esquema principal en español. Notificaciones solo in-app.
--  Ejecutar en Supabase > SQL Editor.
-- =====================================================================

-- 0. EXTENSIONES
create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm";
create extension if not exists "unaccent";
set search_path = public;

-- 1. ENUMS
create type rol_usuario as enum ('admin', 'recepcionista', 'mecanico', 'cliente');
create type estado_orden as enum (
  'pendiente_asignacion','recepcion','diagnostico','presupuesto_enviado','presupuesto_aprobado','presupuesto_rechazado',
  'en_reparacion','esperando_repuestos','control_calidad','listo_entrega','entregado','pagado','cancelado');
create type prioridad_orden as enum ('baja','media','alta','urgente');
-- Estado de la asignación de cada mecánico a una orden de trabajo.
create type estado_asignacion as enum ('pendiente','aceptada','rechazada');
create type estado_presupuesto as enum ('borrador','enviado','aprobado','rechazado','vencido');
create type estado_cita as enum ('solicitada','confirmada','reprogramada','cancelada','completada','no_asistio');
create type metodo_pago as enum ('efectivo','transferencia','qr','mixto');
create type estado_pago as enum ('pendiente','en_revision','pagado','anulado');
create type tipo_movimiento as enum ('entrada','salida','ajuste','devolucion');
create type estado_compra as enum ('borrador','enviada','recibida_parcial','recibida','cancelada');
create type tipo_notificacion as enum (
  'presupuesto_aprobado','presupuesto_rechazado','comprobante_subido','stock_critico','cita_solicitada',
  'ot_asignada','cita_asignada','presupuesto_recibido','pago_validado','pago_rechazado','estado_orden',
  'cita_confirmada','cita_reprogramada','cita_cancelada','general');

-- 2. CONFIGURACIÓN DEL TALLER
create table configuracion_taller (
  id smallint primary key default 1 check (id = 1),
  nombre text not null default 'Taller Mecánico GaraGato',
  direccion text, telefono text, correo text,
  horario text default 'Lun-Vie 8:00-18:00, Sáb 8:00-13:00',
  maps_embed_url text,
  iva_porcentaje numeric(5,2) not null default 13.00 check (iva_porcentaje between 0 and 100),
  descuento_max numeric(5,2) not null default 100.00 check (descuento_max between 0 and 100),
  moneda text not null default 'Bs',
  qr_imagen_url text,
  qr_instrucciones text default 'Escanee el QR, realice la transferencia y suba su comprobante.',
  qr_titular text, qr_banco text,
  max_intentos_login smallint not null default 5,
  minutos_inactividad smallint not null default 5,
  color_admin text default '#5c0b8b', color_recepcionista text default '#0e7490',
  color_mecanico text default '#43377c', color_cliente text default '#15803d',
  actualizado_en timestamptz not null default now(), actualizado_por uuid);
insert into configuracion_taller (id) values (1) on conflict do nothing;

-- 3. PERFILES Y SEGURIDAD
create table perfiles (
  id uuid primary key references auth.users(id) on delete cascade,
  rol rol_usuario not null default 'cliente',
  nombre text not null, telefono text, correo text, avatar_url text, ci_nit text,
  activo boolean not null default true,
  intentos_fallidos smallint not null default 0, bloqueado_hasta timestamptz,
  creado_en timestamptz not null default now(), actualizado_en timestamptz not null default now(),
  creado_por uuid references auth.users(id));

-- 4. CLIENTES
create table clientes (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid unique references auth.users(id) on delete set null,
  nombre text not null, telefono text, correo text, ci_nit text, direccion text, notas text,
  creado_en timestamptz not null default now(), actualizado_en timestamptz not null default now(),
  creado_por uuid references auth.users(id));
create index idx_clientes_nombre_trgm on clientes using gin (nombre gin_trgm_ops);
create index idx_clientes_ci on clientes (ci_nit);
create index idx_clientes_telefono on clientes (telefono);

-- 5. VEHÍCULOS
create table vehiculos (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references clientes(id) on delete restrict,
  marca text not null, modelo text not null, anio smallint check (anio between 1900 and 2100),
  placa text not null, color text, chasis text, motor text, foto_url text, notas text,
  activo boolean not null default true,
  creado_en timestamptz not null default now(), actualizado_en timestamptz not null default now(),
  creado_por uuid references auth.users(id));
create index idx_vehiculos_placa on vehiculos (upper(placa));
create index idx_vehiculos_cliente on vehiculos (cliente_id);

-- 6. SERVICIOS
create table servicios (
  id uuid primary key default gen_random_uuid(),
  nombre text not null, descripcion text, precio numeric(12,2) not null default 0 check (precio >= 0),
  tiempo_estimado_min integer, categoria text, imagen_url text,
  visible_portal boolean not null default true, destacado boolean not null default false,
  activo boolean not null default true, orden integer default 0,
  creado_en timestamptz not null default now(), actualizado_en timestamptz not null default now());

-- 7. PROVEEDORES Y COMPRAS
create table proveedores (
  id uuid primary key default gen_random_uuid(),
  nombre text not null, nit text, telefono text, correo text, direccion text,
  activo boolean not null default true, creado_en timestamptz not null default now());

create table ordenes_compra (
  id uuid primary key default gen_random_uuid(), numero text unique,
  proveedor_id uuid not null references proveedores(id) on delete restrict,
  estado estado_compra not null default 'borrador', total numeric(12,2) not null default 0, notas text,
  creado_en timestamptz not null default now(), recibida_en timestamptz, creado_por uuid references auth.users(id));

create table detalle_compra (
  id uuid primary key default gen_random_uuid(),
  orden_compra_id uuid not null references ordenes_compra(id) on delete cascade,
  repuesto_id uuid not null, cantidad numeric(12,2) not null check (cantidad > 0),
  precio_unitario numeric(12,2) not null default 0, cantidad_recibida numeric(12,2) not null default 0,
  subtotal numeric(12,2) generated always as (cantidad * precio_unitario) stored);

-- 8. INVENTARIO
create table repuestos (
  id uuid primary key default gen_random_uuid(),
  codigo text unique not null, nombre text not null, categoria text, descripcion text,
  precio_compra numeric(12,2) not null default 0 check (precio_compra >= 0),
  precio_venta numeric(12,2) not null default 0 check (precio_venta >= 0),
  stock numeric(12,2) not null default 0 check (stock >= 0),
  stock_minimo numeric(12,2) not null default 0 check (stock_minimo >= 0),
  ubicacion text, activo boolean not null default true,
  creado_en timestamptz not null default now(), actualizado_en timestamptz not null default now());
create index idx_repuestos_codigo on repuestos (codigo);
create index idx_repuestos_nombre_trgm on repuestos using gin (nombre gin_trgm_ops);
alter table detalle_compra add constraint fk_detalle_compra_repuesto
  foreign key (repuesto_id) references repuestos(id) on delete restrict;

create table movimientos_inventario (
  id bigint generated always as identity primary key,
  repuesto_id uuid not null references repuestos(id) on delete restrict,
  tipo tipo_movimiento not null, cantidad numeric(12,2) not null,
  stock_anterior numeric(12,2) not null, stock_nuevo numeric(12,2) not null, motivo text,
  orden_id uuid, orden_compra_id uuid references ordenes_compra(id) on delete set null,
  creado_en timestamptz not null default now(), creado_por uuid references auth.users(id));
create index idx_movimientos_repuesto on movimientos_inventario (repuesto_id, creado_en desc);

-- 9. ÓRDENES DE TRABAJO
create table ordenes_trabajo (
  id uuid primary key default gen_random_uuid(), numero text unique,
  cliente_id uuid not null references clientes(id) on delete restrict,
  vehiculo_id uuid not null references vehiculos(id) on delete restrict,
  estado estado_orden not null default 'recepcion', prioridad prioridad_orden not null default 'media',
  problema_reportado text, diagnostico text, trabajo_realizado text, horas_trabajo numeric(8,2) default 0,
  subtotal_servicios numeric(12,2) not null default 0, subtotal_repuestos numeric(12,2) not null default 0,
  descuento_porcentaje numeric(5,2) not null default 0 check (descuento_porcentaje between 0 and 100),
  descuento_monto numeric(12,2) not null default 0,
  iva_porcentaje numeric(5,2) not null default 13, iva_monto numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0, total_pagado numeric(12,2) not null default 0,
  cantidad_mecanicos_requeridos smallint not null default 1 check (cantidad_mecanicos_requeridos > 0),
  version integer not null default 1,
  creado_en timestamptz not null default now(), actualizado_en timestamptz not null default now(),
  cerrado_en timestamptz, creado_por uuid references auth.users(id));
create index idx_ot_cliente on ordenes_trabajo (cliente_id);
create index idx_ot_vehiculo on ordenes_trabajo (vehiculo_id);
create index idx_ot_estado on ordenes_trabajo (estado);
alter table movimientos_inventario add constraint fk_movimientos_ot
  foreign key (orden_id) references ordenes_trabajo(id) on delete set null;

create table orden_mecanicos (
  orden_id uuid not null references ordenes_trabajo(id) on delete cascade,
  mecanico_id uuid not null references perfiles(id) on delete restrict,
  estado estado_asignacion not null default 'aceptada',
  respondido_en timestamptz not null default now(),
  asignado_en timestamptz not null default now(), primary key (orden_id, mecanico_id));

create table orden_servicios (
  id uuid primary key default gen_random_uuid(),
  orden_id uuid not null references ordenes_trabajo(id) on delete cascade,
  servicio_id uuid references servicios(id) on delete set null,
  descripcion text not null, precio numeric(12,2) not null default 0,
  cantidad numeric(12,2) not null default 1 check (cantidad > 0),
  subtotal numeric(12,2) generated always as (precio * cantidad) stored);
create index idx_orden_servicios_ot on orden_servicios (orden_id);

create table orden_repuestos (
  id uuid primary key default gen_random_uuid(),
  orden_id uuid not null references ordenes_trabajo(id) on delete cascade,
  repuesto_id uuid not null references repuestos(id) on delete restrict,
  descripcion text not null, precio numeric(12,2) not null default 0,
  cantidad numeric(12,2) not null check (cantidad > 0),
  subtotal numeric(12,2) generated always as (precio * cantidad) stored,
  stock_descontado boolean not null default false);
create index idx_orden_repuestos_ot on orden_repuestos (orden_id);

create table historial_estados_orden (
  id bigint generated always as identity primary key,
  orden_id uuid not null references ordenes_trabajo(id) on delete cascade,
  estado_anterior estado_orden, estado_nuevo estado_orden not null, motivo text,
  cambiado_por uuid references auth.users(id), creado_en timestamptz not null default now());
create index idx_historial_ot on historial_estados_orden (orden_id, creado_en);

create table adjuntos_orden (
  id uuid primary key default gen_random_uuid(),
  orden_id uuid not null references ordenes_trabajo(id) on delete cascade,
  url text not null, tipo text, nombre_archivo text,
  subido_por uuid references auth.users(id), creado_en timestamptz not null default now());

-- 10. PRESUPUESTOS
create table presupuestos (
  id uuid primary key default gen_random_uuid(),
  orden_id uuid not null references ordenes_trabajo(id) on delete cascade,
  version integer not null default 1, estado estado_presupuesto not null default 'borrador',
  token_publico uuid not null default gen_random_uuid() unique,
  subtotal_servicios numeric(12,2) not null default 0, subtotal_repuestos numeric(12,2) not null default 0,
  descuento_monto numeric(12,2) not null default 0, iva_monto numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0, enviado_en timestamptz, respondido_en timestamptz,
  motivo_rechazo text, vigencia_hasta date,
  creado_en timestamptz not null default now(), creado_por uuid references auth.users(id),
  unique (orden_id, version));
create index idx_presupuestos_ot on presupuestos (orden_id);

create table detalle_presupuesto (
  id uuid primary key default gen_random_uuid(),
  presupuesto_id uuid not null references presupuestos(id) on delete cascade,
  tipo text not null check (tipo in ('servicio','repuesto')),
  descripcion text not null, precio numeric(12,2) not null default 0,
  cantidad numeric(12,2) not null default 1,
  subtotal numeric(12,2) generated always as (precio * cantidad) stored);

-- 11. CITAS
create table citas (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid references clientes(id) on delete set null,
  vehiculo_id uuid references vehiculos(id) on delete set null,
  mecanico_id uuid references perfiles(id) on delete set null,
  inicio timestamptz not null, fin timestamptz not null,
  estado estado_cita not null default 'solicitada', descripcion text,
  creado_en timestamptz not null default now(), creado_por uuid references auth.users(id),
  check (fin > inicio));
create index idx_citas_mecanico_tiempo on citas (mecanico_id, inicio);
create index idx_citas_inicio on citas (inicio);

create table bloqueos_agenda (
  id uuid primary key default gen_random_uuid(),
  mecanico_id uuid references perfiles(id) on delete cascade,
  inicio timestamptz not null, fin timestamptz not null, motivo text,
  creado_en timestamptz not null default now(), creado_por uuid references auth.users(id),
  check (fin > inicio));

-- 12. PAGOS Y BOLETAS
create table pagos (
  id uuid primary key default gen_random_uuid(),
  orden_id uuid not null references ordenes_trabajo(id) on delete restrict,
  metodo metodo_pago not null, estado estado_pago not null default 'pendiente',
  monto numeric(12,2) not null check (monto > 0),
  monto_efectivo numeric(12,2) not null default 0, monto_transferencia numeric(12,2) not null default 0,
  monto_recibido numeric(12,2), cambio numeric(12,2),
  comprobante_url text, referencia text,
  validado_por uuid references auth.users(id), validado_en timestamptz, motivo_anulacion text,
  creado_en timestamptz not null default now(), creado_por uuid references auth.users(id));
create index idx_pagos_ot on pagos (orden_id);

create table boletas (
  id uuid primary key default gen_random_uuid(),
  orden_id uuid not null references ordenes_trabajo(id) on delete cascade,
  numero text unique, pdf_url text, total numeric(12,2) not null, iva_monto numeric(12,2) not null default 0,
  creado_en timestamptz not null default now(), creado_por uuid references auth.users(id));

-- 13. NOTIFICACIONES Y CONTACTO
create table notificaciones (
  id bigint generated always as identity primary key,
  usuario_id uuid references auth.users(id) on delete cascade,
  tipo tipo_notificacion not null, titulo text not null, mensaje text,
  leida boolean not null default false, url text, creado_en timestamptz not null default now());
create index idx_notif_usuario on notificaciones (usuario_id, leida, creado_en desc);

create table mensajes_contacto (
  id bigint generated always as identity primary key,
  nombre text not null, correo text, telefono text, mensaje text not null,
  atendido boolean not null default false, creado_en timestamptz not null default now());

-- 14. FUNCIONES Y TRIGGERS
create or replace function set_actualizado_en() returns trigger language plpgsql as $$
begin new.actualizado_en = now(); return new; end $$;
create trigger trg_clientes_actualizado before update on clientes for each row execute function set_actualizado_en();
create trigger trg_vehiculos_actualizado before update on vehiculos for each row execute function set_actualizado_en();
create trigger trg_repuestos_actualizado before update on repuestos for each row execute function set_actualizado_en();
create trigger trg_servicios_actualizado before update on servicios for each row execute function set_actualizado_en();
create trigger trg_perfiles_actualizado before update on perfiles for each row execute function set_actualizado_en();

create or replace function rol_actual() returns rol_usuario language sql stable security definer set search_path = public as $$
  select rol from perfiles where id = auth.uid(); $$;
create or replace function es_admin() returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from perfiles where id = auth.uid() and rol = 'admin' and activo); $$;
create or replace function es_interno() returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from perfiles where id = auth.uid() and rol in ('admin','recepcionista','mecanico') and activo); $$;
create or replace function es_admin_o_recepcion() returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from perfiles where id = auth.uid() and rol in ('admin','recepcionista') and activo); $$;
create or replace function es_dueno_orden(p_orden uuid) returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from ordenes_trabajo o join clientes c on c.id = o.cliente_id where o.id = p_orden and c.usuario_id = auth.uid()); $$;

create sequence if not exists seq_orden_trabajo;
create sequence if not exists seq_orden_compra;
create sequence if not exists seq_boleta;
create or replace function gen_numero_orden() returns trigger language plpgsql as $$
begin if new.numero is null then new.numero := 'OT-' || lpad(nextval('seq_orden_trabajo')::text,5,'0'); end if; return new; end $$;
create trigger trg_ot_numero before insert on ordenes_trabajo for each row execute function gen_numero_orden();
create or replace function gen_numero_compra() returns trigger language plpgsql as $$
begin if new.numero is null then new.numero := 'OC-' || lpad(nextval('seq_orden_compra')::text,5,'0'); end if; return new; end $$;
create trigger trg_oc_numero before insert on ordenes_compra for each row execute function gen_numero_compra();
create or replace function gen_numero_boleta() returns trigger language plpgsql as $$
begin if new.numero is null then new.numero := 'BOL-' || lpad(nextval('seq_boleta')::text,5,'0'); end if; return new; end $$;
create trigger trg_boleta_numero before insert on boletas for each row execute function gen_numero_boleta();

create or replace function recalcular_totales_orden(p_orden uuid) returns void language plpgsql security definer set search_path = public as $$
declare v_serv numeric(12,2); v_rep numeric(12,2); v_desc_pct numeric(5,2); v_iva_pct numeric(5,2);
  v_base numeric(12,2); v_desc numeric(12,2); v_iva numeric(12,2); v_total numeric(12,2);
begin
  select coalesce(sum(subtotal),0) into v_serv from orden_servicios where orden_id = p_orden;
  select coalesce(sum(subtotal),0) into v_rep from orden_repuestos where orden_id = p_orden;
  select descuento_porcentaje, iva_porcentaje into v_desc_pct, v_iva_pct from ordenes_trabajo where id = p_orden;
  v_base := v_serv + v_rep;
  v_desc := round(v_base * coalesce(v_desc_pct,0)/100.0, 2);
  v_iva := round((v_base - v_desc) * coalesce(v_iva_pct,0)/100.0, 2);
  v_total := v_base - v_desc + v_iva;
  update ordenes_trabajo set subtotal_servicios=v_serv, subtotal_repuestos=v_rep, descuento_monto=v_desc,
    iva_monto=v_iva, total=v_total, actualizado_en=now() where id = p_orden;
end $$;
create or replace function trg_recalcular_totales() returns trigger language plpgsql as $$
begin perform recalcular_totales_orden(coalesce(new.orden_id, old.orden_id)); return null; end $$;
create trigger trg_orden_servicios_recalc after insert or update or delete on orden_servicios for each row execute function trg_recalcular_totales();
create trigger trg_orden_repuestos_recalc after insert or update or delete on orden_repuestos for each row execute function trg_recalcular_totales();

create or replace function descontar_stock_repuesto() returns trigger language plpgsql security definer set search_path = public as $$
declare v_stock numeric(12,2);
begin
  select stock into v_stock from repuestos where id = new.repuesto_id for update;
  if v_stock < new.cantidad then raise exception 'Stock insuficiente para el repuesto % (disponible: %, requerido: %)', new.repuesto_id, v_stock, new.cantidad; end if;
  update repuestos set stock = stock - new.cantidad where id = new.repuesto_id;
  insert into movimientos_inventario (repuesto_id, tipo, cantidad, stock_anterior, stock_nuevo, motivo, orden_id, creado_por)
  values (new.repuesto_id, 'salida', -new.cantidad, v_stock, v_stock - new.cantidad, 'Uso en OT', new.orden_id, auth.uid());
  new.stock_descontado := true; return new;
end $$;
create trigger trg_orden_repuestos_descontar before insert on orden_repuestos for each row execute function descontar_stock_repuesto();

create or replace function devolver_stock_eliminar_repuesto() returns trigger language plpgsql security definer set search_path = public as $$
declare v_stock numeric(12,2);
begin
  if old.stock_descontado then
    select stock into v_stock from repuestos where id = old.repuesto_id for update;
    update repuestos set stock = stock + old.cantidad where id = old.repuesto_id;
    insert into movimientos_inventario (repuesto_id, tipo, cantidad, stock_anterior, stock_nuevo, motivo, orden_id, creado_por)
    values (old.repuesto_id, 'devolucion', old.cantidad, v_stock, v_stock + old.cantidad, 'Devolución por eliminación/cancelación de OT', old.orden_id, auth.uid());
  end if; return old;
end $$;
create trigger trg_orden_repuestos_devolver before delete on orden_repuestos for each row execute function devolver_stock_eliminar_repuesto();

create or replace function devolver_stock_cancelar_orden() returns trigger language plpgsql security definer set search_path = public as $$
declare r record; v_stock numeric(12,2);
begin
  if new.estado = 'cancelado' and old.estado <> 'cancelado' then
    for r in select * from orden_repuestos where orden_id = new.id and stock_descontado loop
      select stock into v_stock from repuestos where id = r.repuesto_id for update;
      update repuestos set stock = stock + r.cantidad where id = r.repuesto_id;
      update orden_repuestos set stock_descontado = false where id = r.id;
      insert into movimientos_inventario (repuesto_id, tipo, cantidad, stock_anterior, stock_nuevo, motivo, orden_id, creado_por)
      values (r.repuesto_id, 'devolucion', r.cantidad, v_stock, v_stock + r.cantidad, 'Devolución por cancelación de OT', new.id, auth.uid());
    end loop;
  end if; return new;
end $$;
create trigger trg_ot_cancelar_devolver after update on ordenes_trabajo for each row execute function devolver_stock_cancelar_orden();

create or replace function registrar_cambio_estado_orden() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    insert into historial_estados_orden (orden_id, estado_anterior, estado_nuevo, cambiado_por) values (new.id, null, new.estado, auth.uid());
  elsif new.estado is distinct from old.estado then
    insert into historial_estados_orden (orden_id, estado_anterior, estado_nuevo, cambiado_por) values (new.id, old.estado, new.estado, auth.uid());
  end if; return new;
end $$;
create trigger trg_ot_estado_insert after insert on ordenes_trabajo for each row execute function registrar_cambio_estado_orden();
create trigger trg_ot_estado_update after update of estado on ordenes_trabajo for each row execute function registrar_cambio_estado_orden();

create or replace function incrementar_version_orden() returns trigger language plpgsql as $$
begin
  if tg_op = 'UPDATE' then
    if new.version is not null and old.version is not null and new.version <> old.version then
      raise exception 'Conflicto de edición: la orden fue modificada por otro usuario.'; end if;
    new.version := old.version + 1;
  end if; return new;
end $$;
create trigger trg_ot_version before update on ordenes_trabajo for each row execute function incrementar_version_orden();

create or replace function ajustar_stock(p_repuesto uuid, p_nuevo_stock numeric, p_motivo text) returns void language plpgsql security definer set search_path = public as $$
declare v_stock numeric(12,2);
begin
  if p_motivo is null or length(trim(p_motivo)) = 0 then raise exception 'El motivo es obligatorio para ajustes manuales de stock.'; end if;
  select stock into v_stock from repuestos where id = p_repuesto for update;
  update repuestos set stock = p_nuevo_stock where id = p_repuesto;
  insert into movimientos_inventario (repuesto_id, tipo, cantidad, stock_anterior, stock_nuevo, motivo, creado_por)
  values (p_repuesto, 'ajuste', p_nuevo_stock - v_stock, v_stock, p_nuevo_stock, p_motivo, auth.uid());
end $$;

create or replace function recibir_item_compra(p_item uuid, p_cantidad numeric) returns void language plpgsql security definer set search_path = public as $$
declare v_repuesto uuid; v_stock numeric(12,2); v_oc uuid;
begin
  select repuesto_id, orden_compra_id into v_repuesto, v_oc from detalle_compra where id = p_item;
  select stock into v_stock from repuestos where id = v_repuesto for update;
  update repuestos set stock = stock + p_cantidad where id = v_repuesto;
  update detalle_compra set cantidad_recibida = cantidad_recibida + p_cantidad where id = p_item;
  insert into movimientos_inventario (repuesto_id, tipo, cantidad, stock_anterior, stock_nuevo, motivo, orden_compra_id, creado_por)
  values (v_repuesto, 'entrada', p_cantidad, v_stock, v_stock + p_cantidad, 'Recepción de compra', v_oc, auth.uid());
end $$;

create or replace function validar_solape_cita() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.mecanico_id is not null and new.estado not in ('cancelada','no_asistio') then
    if exists (select 1 from citas a where a.mecanico_id = new.mecanico_id and a.id <> new.id and a.estado not in ('cancelada','no_asistio')
      and tstzrange(a.inicio, a.fin) && tstzrange(new.inicio, new.fin)) then
      raise exception 'El mecánico ya tiene una cita en ese horario.'; end if;
    if exists (select 1 from bloqueos_agenda b where (b.mecanico_id = new.mecanico_id or b.mecanico_id is null)
      and tstzrange(b.inicio, b.fin) && tstzrange(new.inicio, new.fin)) then
      raise exception 'El horario está bloqueado (feriado o bloqueo de agenda).'; end if;
  end if; return new;
end $$;
create trigger trg_cita_solape before insert or update on citas for each row execute function validar_solape_cita();

create or replace function actualizar_estado_pago_orden() returns trigger language plpgsql security definer set search_path = public as $$
declare v_orden uuid; v_pagado numeric(12,2); v_total numeric(12,2);
begin
  v_orden := coalesce(new.orden_id, old.orden_id);
  select coalesce(sum(monto),0) into v_pagado from pagos where orden_id = v_orden and estado = 'pagado';
  select total into v_total from ordenes_trabajo where id = v_orden;
  update ordenes_trabajo set total_pagado = v_pagado where id = v_orden;
  if v_total is not null and v_pagado >= v_total and v_total > 0 then
    update ordenes_trabajo set estado = 'pagado' where id = v_orden and estado not in ('pagado','cancelado'); end if;
  return null;
end $$;
create trigger trg_pago_estado after insert or update or delete on pagos for each row execute function actualizar_estado_pago_orden();

create or replace function notificar_comprobante() returns trigger language plpgsql security definer set search_path = public as $$
declare r record;
begin
  if new.comprobante_url is not null and (old.comprobante_url is null or tg_op = 'INSERT') then
    for r in select id from perfiles where rol in ('admin','recepcionista') and activo loop
      insert into notificaciones (usuario_id, tipo, titulo, mensaje, url)
      values (r.id, 'comprobante_subido', 'Nuevo comprobante de pago', 'Se subió un comprobante para revisión.', '/pagos/' || new.id);
    end loop;
  end if; return new;
end $$;
create trigger trg_notif_comprobante after insert or update of comprobante_url on pagos for each row execute function notificar_comprobante();

create or replace function notificar_respuesta_presupuesto() returns trigger language plpgsql security definer set search_path = public as $$
declare r record; v_tipo tipo_notificacion; v_titulo text;
begin
  if new.estado is distinct from old.estado and new.estado in ('aprobado','rechazado') then
    if new.estado = 'aprobado' then v_tipo := 'presupuesto_aprobado'; v_titulo := 'Presupuesto aprobado';
      update ordenes_trabajo set estado = 'presupuesto_aprobado' where id = new.orden_id;
    else v_tipo := 'presupuesto_rechazado'; v_titulo := 'Presupuesto rechazado';
      update ordenes_trabajo set estado = 'presupuesto_rechazado' where id = new.orden_id; end if;
    for r in select id from perfiles where rol in ('admin','recepcionista') and activo loop
      insert into notificaciones (usuario_id, tipo, titulo, mensaje, url) values (r.id, v_tipo, v_titulo, coalesce(new.motivo_rechazo,''), '/ordenes/' || new.orden_id);
    end loop;
  end if; return new;
end $$;
create trigger trg_notif_presupuesto after update of estado on presupuestos for each row execute function notificar_respuesta_presupuesto();

create or replace function notificar_stock_critico() returns trigger language plpgsql security definer set search_path = public as $$
declare r record;
begin
  if new.stock <= new.stock_minimo and (tg_op='INSERT' or old.stock > old.stock_minimo) then
    for r in select id from perfiles where rol in ('admin','recepcionista') and activo loop
      insert into notificaciones (usuario_id, tipo, titulo, mensaje, url)
      values (r.id, 'stock_critico', 'Stock crítico: ' || new.nombre, 'Stock actual ' || new.stock || ' (mínimo ' || new.stock_minimo || ')', '/inventario/' || new.id);
    end loop;
  end if; return new;
end $$;
create trigger trg_stock_critico after insert or update of stock on repuestos for each row execute function notificar_stock_critico();

create or replace function manejar_nuevo_usuario() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into perfiles (id, rol, nombre, correo, telefono) values (
    new.id, coalesce((new.raw_user_meta_data->>'rol')::rol_usuario, 'cliente'),
    coalesce(new.raw_user_meta_data->>'nombre', split_part(new.email,'@',1)), new.email,
    new.raw_user_meta_data->>'telefono');
  if coalesce(new.raw_user_meta_data->>'rol','cliente') = 'cliente' then
    insert into clientes (usuario_id, nombre, correo, telefono) values (new.id,
      coalesce(new.raw_user_meta_data->>'nombre', split_part(new.email,'@',1)), new.email, new.raw_user_meta_data->>'telefono');
  end if; return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function manejar_nuevo_usuario();

-- 15. VISTAS
create or replace view v_stock_critico as
  select id, codigo, nombre, categoria, stock, stock_minimo, ubicacion from repuestos where activo and stock <= stock_minimo order by stock;
create or replace view v_vehiculos_con_deuda as
  select v.id as vehiculo_id, v.placa, c.nombre as cliente, sum(o.total - o.total_pagado) as saldo_pendiente
  from ordenes_trabajo o join vehiculos v on v.id = o.vehiculo_id join clientes c on c.id = o.cliente_id
  where o.estado not in ('cancelado') and o.total > o.total_pagado group by v.id, v.placa, c.nombre;
create or replace view v_ingresos as
  select date_trunc('day', validado_en) as dia, sum(monto) as ingresos from pagos
  where estado = 'pagado' and validado_en is not null group by 1 order by 1;
create or replace view v_top_servicios as
  select s.id, s.nombre, count(*) as veces, sum(os.subtotal) as total from orden_servicios os
  join servicios s on s.id = os.servicio_id group by s.id, s.nombre order by veces desc limit 10;
create or replace view v_carga_mecanicos as
  select p.id, p.nombre, count(distinct om.orden_id) as ots_asignadas, coalesce(sum(o.horas_trabajo),0) as horas_totales
  from perfiles p left join orden_mecanicos om on om.mecanico_id = p.id left join ordenes_trabajo o on o.id = om.orden_id
  where p.rol = 'mecanico' group by p.id, p.nombre;

-- Las vistas respetan la RLS de las tablas base (Postgres 15+).
alter view v_stock_critico       set (security_invoker = on);
alter view v_vehiculos_con_deuda set (security_invoker = on);
alter view v_ingresos            set (security_invoker = on);
alter view v_top_servicios       set (security_invoker = on);
alter view v_carga_mecanicos     set (security_invoker = on);
revoke all on v_stock_critico, v_vehiculos_con_deuda, v_ingresos, v_top_servicios, v_carga_mecanicos from anon;

-- 16. BUCKETS DE STORAGE
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('avatares','avatares',true,5242880,array['image/jpeg','image/png','image/webp']),
  ('vehiculos','vehiculos',true,15728640,array['image/jpeg','image/png','image/webp']),
  ('servicios','servicios',true,5242880,array['image/jpeg','image/png','image/webp']),
  ('comprobantes','comprobantes',true,15728640,array['image/jpeg','image/png','image/webp','application/pdf']),
  ('adjuntos-ot','adjuntos-ot',true,15728640,array['image/jpeg','image/png','image/webp','application/pdf']),
  ('documentos','documentos',false,15728640,array['application/pdf'])
on conflict (id) do nothing;

-- 17. RLS
alter table perfiles enable row level security;
alter table configuracion_taller enable row level security;
alter table clientes enable row level security;
alter table vehiculos enable row level security;
alter table servicios enable row level security;
alter table proveedores enable row level security;
alter table ordenes_compra enable row level security;
alter table detalle_compra enable row level security;
alter table repuestos enable row level security;
alter table movimientos_inventario enable row level security;
alter table ordenes_trabajo enable row level security;
alter table orden_mecanicos enable row level security;
alter table orden_servicios enable row level security;
alter table orden_repuestos enable row level security;
alter table historial_estados_orden enable row level security;
alter table adjuntos_orden enable row level security;
alter table presupuestos enable row level security;
alter table detalle_presupuesto enable row level security;
alter table citas enable row level security;
alter table bloqueos_agenda enable row level security;
alter table pagos enable row level security;
alter table boletas enable row level security;
alter table notificaciones enable row level security;
alter table mensajes_contacto enable row level security;

create policy perfiles_self_select on perfiles for select using (id = auth.uid() or es_interno());
create policy perfiles_admin_all on perfiles for all using (es_admin()) with check (es_admin());
create policy perfiles_self_update on perfiles for update using (id = auth.uid()) with check (id = auth.uid());
create policy config_lectura on configuracion_taller for select using (true);
create policy config_escritura on configuracion_taller for update using (es_admin_o_recepcion()) with check (es_admin_o_recepcion());
create policy clientes_interno on clientes for select using (es_interno());
create policy clientes_interno_write on clientes for all using (es_admin_o_recepcion()) with check (es_admin_o_recepcion());
create policy clientes_self on clientes for select using (usuario_id = auth.uid());
create policy vehiculos_interno on vehiculos for select using (es_interno());
create policy vehiculos_interno_write on vehiculos for all using (es_admin_o_recepcion()) with check (es_admin_o_recepcion());
create policy vehiculos_dueno on vehiculos for select using (exists (select 1 from clientes c where c.id = vehiculos.cliente_id and c.usuario_id = auth.uid()));
create policy servicios_publico_lectura on servicios for select using (visible_portal and activo or es_interno());
create policy servicios_arc_write on servicios for all using (es_admin_o_recepcion()) with check (es_admin_o_recepcion());
create policy proveedores_rw on proveedores for all using (es_admin_o_recepcion()) with check (es_admin_o_recepcion());
create policy oc_rw on ordenes_compra for all using (es_admin_o_recepcion()) with check (es_admin_o_recepcion());
create policy detalle_oc_rw on detalle_compra for all using (es_admin_o_recepcion()) with check (es_admin_o_recepcion());
create policy repuestos_interno_lectura on repuestos for select using (es_interno());
create policy repuestos_arc_write on repuestos for all using (es_admin_o_recepcion()) with check (es_admin_o_recepcion());
create policy movimientos_interno on movimientos_inventario for select using (es_interno());
create policy movimientos_arc_write on movimientos_inventario for all using (es_admin_o_recepcion()) with check (es_admin_o_recepcion());
create policy ot_interno_lectura on ordenes_trabajo for select using (es_interno());
create policy ot_arc_write on ordenes_trabajo for all using (es_admin_o_recepcion()) with check (es_admin_o_recepcion());
create policy ot_mecanico_update on ordenes_trabajo for update using (rol_actual() = 'mecanico' and exists (select 1 from orden_mecanicos m where m.orden_id = ordenes_trabajo.id and m.mecanico_id = auth.uid()));
create policy ot_cliente_lectura on ordenes_trabajo for select using (exists (select 1 from clientes c where c.id = ordenes_trabajo.cliente_id and c.usuario_id = auth.uid()));
create policy orden_serv_interno on orden_servicios for select using (es_interno());
create policy orden_serv_write on orden_servicios for all using (es_admin_o_recepcion()) with check (es_admin_o_recepcion());
create policy orden_serv_cliente on orden_servicios for select using (es_dueno_orden(orden_id));
create policy orden_rep_interno on orden_repuestos for select using (es_interno());
create policy orden_rep_write on orden_repuestos for all using (es_interno()) with check (es_interno());
create policy orden_rep_cliente on orden_repuestos for select using (es_dueno_orden(orden_id));
create policy orden_mec_interno on orden_mecanicos for select using (es_interno());
create policy orden_mec_write on orden_mecanicos for all using (es_admin_o_recepcion()) with check (es_admin_o_recepcion());
-- El mecánico puede aceptar o rechazar su propia asignación.
create policy orden_mec_mecanico_insert on orden_mecanicos for insert with check (mecanico_id = auth.uid() and rol_actual() = 'mecanico');
create policy orden_mec_mecanico_update on orden_mecanicos for update using (mecanico_id = auth.uid()) with check (mecanico_id = auth.uid());
create policy hist_interno on historial_estados_orden for select using (es_interno());
create policy hist_cliente on historial_estados_orden for select using (es_dueno_orden(orden_id));
create policy adj_interno on adjuntos_orden for select using (es_interno());
create policy adj_write on adjuntos_orden for all using (es_interno()) with check (es_interno());
create policy adj_cliente on adjuntos_orden for select using (es_dueno_orden(orden_id));
create policy presup_interno on presupuestos for select using (es_interno());
create policy presup_write on presupuestos for all using (es_admin_o_recepcion()) with check (es_admin_o_recepcion());
create policy presup_cliente on presupuestos for select using (es_dueno_orden(orden_id));
create policy presup_cliente_update on presupuestos for update using (es_dueno_orden(orden_id)) with check (es_dueno_orden(orden_id));
create policy detpresup_interno on detalle_presupuesto for select using (es_interno());
create policy detpresup_write on detalle_presupuesto for all using (es_admin_o_recepcion()) with check (es_admin_o_recepcion());
create policy detpresup_cliente on detalle_presupuesto for select using (exists (select 1 from presupuestos b where b.id = detalle_presupuesto.presupuesto_id and es_dueno_orden(b.orden_id)));
create policy citas_interno on citas for select using (es_interno());
create policy citas_write on citas for all using (es_admin_o_recepcion()) with check (es_admin_o_recepcion());
create policy citas_cliente_lectura on citas for select using (exists (select 1 from clientes c where c.id = citas.cliente_id and c.usuario_id = auth.uid()));
create policy citas_cliente_insert on citas for insert with check (exists (select 1 from clientes c where c.id = citas.cliente_id and c.usuario_id = auth.uid()));
create policy citas_cliente_update on citas for update using (exists (select 1 from clientes c where c.id = citas.cliente_id and c.usuario_id = auth.uid()));
create policy bloqueos_lectura on bloqueos_agenda for select using (true);
-- Solo el recepcionista puede gestionar los bloqueos de agenda.
create policy bloqueos_recepcion on bloqueos_agenda for all using (rol_actual() = 'recepcionista') with check (rol_actual() = 'recepcionista');
create policy pagos_interno_lectura on pagos for select using (es_interno());
create policy pagos_arc_write on pagos for all using (es_admin_o_recepcion()) with check (es_admin_o_recepcion());
create policy pagos_cliente_lectura on pagos for select using (es_dueno_orden(orden_id));
create policy pagos_cliente_insert on pagos for insert with check (es_dueno_orden(orden_id));
create policy pagos_cliente_update on pagos for update using (es_dueno_orden(orden_id)) with check (es_dueno_orden(orden_id));
create policy boletas_interno on boletas for select using (es_interno());
create policy boletas_write on boletas for all using (es_admin_o_recepcion()) with check (es_admin_o_recepcion());
create policy boletas_cliente on boletas for select using (es_dueno_orden(orden_id));
create policy notif_propias on notificaciones for select using (usuario_id = auth.uid());
create policy notif_propias_update on notificaciones for update using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());
create policy contacto_insert on mensajes_contacto for insert with check (true);
create policy contacto_lectura on mensajes_contacto for select using (es_interno());

-- 18. POLÍTICAS DE STORAGE
create policy storage_avatares_lectura on storage.objects for select using (bucket_id = 'avatares');
create policy storage_avatares_write on storage.objects for insert to authenticated with check (bucket_id = 'avatares');
create policy storage_avatares_update on storage.objects for update to authenticated using (bucket_id = 'avatares');
create policy storage_vehiculos_lectura on storage.objects for select using (bucket_id = 'vehiculos');
create policy storage_vehiculos_write on storage.objects for insert to authenticated with check (bucket_id = 'vehiculos');
create policy storage_servicios_lectura on storage.objects for select using (bucket_id = 'servicios');
create policy storage_servicios_write on storage.objects for insert to authenticated with check (bucket_id = 'servicios');
create policy storage_servicios_update on storage.objects for update to authenticated using (bucket_id = 'servicios');
create policy storage_priv_lectura on storage.objects for select to authenticated using (bucket_id in ('comprobantes','adjuntos-ot','documentos'));
create policy storage_priv_write on storage.objects for insert to authenticated with check (bucket_id in ('comprobantes','adjuntos-ot','documentos'));

-- 19 / 20. NOTIFICACIONES IN-APP
create or replace function cliente_usuario_de_orden(p_orden uuid) returns uuid language sql stable security definer set search_path = public as $$
  select c.usuario_id from ordenes_trabajo o join clientes c on c.id = o.cliente_id where o.id = p_orden; $$;

create or replace function notificar_presupuesto_cliente() returns trigger language plpgsql security definer set search_path = public as $$
declare v_usuario uuid;
begin
  if new.estado = 'enviado' and (tg_op='INSERT' or old.estado is distinct from 'enviado') then
    v_usuario := cliente_usuario_de_orden(new.orden_id);
    if v_usuario is not null then
      insert into notificaciones (usuario_id, tipo, titulo, mensaje, url)
      values (v_usuario, 'presupuesto_recibido', 'Tienes un presupuesto por revisar', 'Revisa el presupuesto y apruébalo o recházalo desde tu portal.', '/cliente/presupuestos/' || new.id);
    end if;
  end if; return new;
end $$;
create trigger trg_notif_presupuesto_cliente after insert or update of estado on presupuestos for each row execute function notificar_presupuesto_cliente();

create or replace function notificar_estado_orden_cliente() returns trigger language plpgsql security definer set search_path = public as $$
declare v_usuario uuid; v_texto text;
begin
  if new.estado is distinct from old.estado then
    v_usuario := cliente_usuario_de_orden(new.id);
    if v_usuario is not null then
      v_texto := case new.estado
        when 'recepcion' then 'Tu vehículo fue recibido en el taller'
        when 'diagnostico' then 'Tu vehículo está en diagnóstico'
        when 'presupuesto_enviado' then 'Tienes un presupuesto por revisar'
        when 'presupuesto_aprobado' then 'Tu presupuesto fue aprobado'
        when 'presupuesto_rechazado' then 'Tu presupuesto fue rechazado'
        when 'en_reparacion' then 'Tu vehículo está en reparación'
        when 'esperando_repuestos' then 'Tu orden está esperando repuestos'
        when 'control_calidad' then 'Tu vehículo está en control de calidad'
        when 'listo_entrega' then 'Tu vehículo está listo para entrega'
        when 'entregado' then 'Tu vehículo fue entregado'
        when 'pagado' then 'Tu orden quedó totalmente pagada'
        when 'cancelado' then 'Tu orden fue cancelada'
        else 'El estado de tu orden cambió' end;
      insert into notificaciones (usuario_id, tipo, titulo, mensaje, url)
      values (v_usuario, 'estado_orden', v_texto, 'Orden ' || coalesce(new.numero,''), '/cliente/ordenes');
    end if;
  end if; return new;
end $$;
create trigger trg_notif_estado_orden_cliente after update of estado on ordenes_trabajo for each row execute function notificar_estado_orden_cliente();

create or replace function notificar_pago_cliente() returns trigger language plpgsql security definer set search_path = public as $$
declare v_usuario uuid;
begin
  if new.estado is distinct from old.estado and new.estado in ('pagado','anulado') then
    v_usuario := cliente_usuario_de_orden(new.orden_id);
    if v_usuario is not null then
      if new.estado = 'pagado' then
        insert into notificaciones (usuario_id, tipo, titulo, mensaje, url) values (v_usuario, 'pago_validado', 'Pago confirmado', 'Tu comprobante fue validado por el taller.', '/cliente/pagos');
      else
        insert into notificaciones (usuario_id, tipo, titulo, mensaje, url) values (v_usuario, 'pago_rechazado', 'Comprobante rechazado', coalesce(new.motivo_anulacion, 'Tu comprobante fue anulado. Súbelo nuevamente.'), '/cliente/pagos');
      end if;
    end if;
  end if; return new;
end $$;
create trigger trg_notif_pago_cliente after update of estado on pagos for each row execute function notificar_pago_cliente();

create or replace function notificar_cita_cliente() returns trigger language plpgsql security definer set search_path = public as $$
declare v_usuario uuid; v_tipo tipo_notificacion; v_titulo text;
begin
  if new.estado is distinct from old.estado and new.estado in ('confirmada','reprogramada','cancelada') then
    select c.usuario_id into v_usuario from clientes c where c.id = new.cliente_id;
    if v_usuario is not null then
      if new.estado = 'confirmada' then v_tipo := 'cita_confirmada'; v_titulo := 'Cita confirmada';
      elsif new.estado = 'reprogramada' then v_tipo := 'cita_reprogramada'; v_titulo := 'Cita reprogramada';
      else v_tipo := 'cita_cancelada'; v_titulo := 'Cita cancelada'; end if;
      insert into notificaciones (usuario_id, tipo, titulo, mensaje, url)
      values (v_usuario, v_tipo, v_titulo, 'Tu cita del ' || to_char(new.inicio,'DD/MM/YYYY HH24:MI') || ' fue ' || new.estado || '.', '/cliente/citas');
    end if;
  end if; return new;
end $$;
create trigger trg_notif_cita_cliente after update of estado on citas for each row execute function notificar_cita_cliente();

create or replace function notificar_asignacion_mecanico() returns trigger language plpgsql security definer set search_path = public as $$
declare v_numero text;
begin
  -- Solo se notifica al mecánico cuando acepta la orden.
  if new.estado <> 'aceptada' then return new; end if;
  select numero into v_numero from ordenes_trabajo where id = new.orden_id;
  insert into notificaciones (usuario_id, tipo, titulo, mensaje, url)
  values (new.mecanico_id, 'ot_asignada', 'Orden asignada', 'Quedaste asignado a la orden ' || coalesce(v_numero,''), '/ordenes/' || new.orden_id);
  return new;
end $$;
create trigger trg_notif_asignacion_mecanico after insert on orden_mecanicos for each row execute function notificar_asignacion_mecanico();

-- Notifica a todos los mecánicos activos cuando una orden queda pendiente de asignación.
create or replace function notificar_ot_pendiente() returns trigger language plpgsql security definer set search_path = public as $$
declare r record;
begin
  if new.estado = 'pendiente_asignacion' then
    for r in select id from perfiles where rol = 'mecanico' and activo loop
      insert into notificaciones (usuario_id, tipo, titulo, mensaje, url)
      values (r.id, 'ot_asignada', 'Nueva orden por asignar',
              'Hay una orden ' || coalesce(new.numero,'') || ' que requiere mecánicos. Acéptala o recházala.',
              '/ordenes/' || new.id);
    end loop;
  end if;
  return new;
end $$;
create trigger trg_notif_ot_pendiente after insert on ordenes_trabajo
  for each row execute function notificar_ot_pendiente();

-- Avanza la orden a diagnóstico cuando los mecánicos aceptados alcanzan el número requerido.
create or replace function avanzar_ot_si_completa() returns trigger language plpgsql security definer set search_path = public as $$
declare v_aceptados int; v_requeridos smallint; v_estado estado_orden; v_orden uuid;
begin
  v_orden := coalesce(new.orden_id, old.orden_id);
  select cantidad_mecanicos_requeridos, estado into v_requeridos, v_estado from ordenes_trabajo where id = v_orden;
  select count(*) into v_aceptados from orden_mecanicos where orden_id = v_orden and estado = 'aceptada';
  if v_estado = 'pendiente_asignacion' and v_aceptados >= v_requeridos then
    update ordenes_trabajo set estado = 'diagnostico' where id = v_orden;
  end if;
  return null;
end $$;
create trigger trg_avanzar_ot_asignacion after insert or update or delete on orden_mecanicos
  for each row execute function avanzar_ot_si_completa();

create or replace function notificar_cita_solicitada() returns trigger language plpgsql security definer set search_path = public as $$
declare r record; v_cliente text;
begin
  if new.estado = 'solicitada' then
    select nombre into v_cliente from clientes where id = new.cliente_id;
    for r in select id from perfiles where rol in ('admin','recepcionista') and activo loop
      insert into notificaciones (usuario_id, tipo, titulo, mensaje, url)
      values (r.id, 'cita_solicitada', 'Nueva cita solicitada', coalesce(v_cliente,'Un cliente') || ' solicitó una cita para el ' || to_char(new.inicio,'DD/MM/YYYY HH24:MI') || '.', '/citas/' || new.id);
    end loop;
  end if; return new;
end $$;
create trigger trg_notif_cita_solicitada after insert on citas for each row execute function notificar_cita_solicitada();

create or replace function notificar_cita_mecanico() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.mecanico_id is not null and (tg_op='INSERT' or new.mecanico_id is distinct from old.mecanico_id) then
    insert into notificaciones (usuario_id, tipo, titulo, mensaje, url)
    values (new.mecanico_id, 'cita_asignada', 'Cita asignada', 'Tienes una cita el ' || to_char(new.inicio,'DD/MM/YYYY HH24:MI') || '.', '/citas/' || new.id);
  end if; return new;
end $$;
create trigger trg_notif_cita_mecanico after insert or update of mecanico_id on citas for each row execute function notificar_cita_mecanico();

-- =====================================================================
-- FIN DEL ESQUEMA — GaraGato
-- =====================================================================
