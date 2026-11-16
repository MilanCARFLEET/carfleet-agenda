-- ============================================================
-- CarFleet — App de agendamiento · Esquema de base de datos
-- Supabase (PostgreSQL). Ejecutar en el SQL Editor de Supabase.
-- Orden: 1) este archivo (schema.sql)  2) seed.sql
-- ============================================================

-- ---------- Tablas de referencia (las edita el administrador) ----------

create table if not exists condominios (
  id           uuid primary key default gen_random_uuid(),
  nombre       text not null,
  comuna       text,
  activo       boolean not null default true,
  created_at   timestamptz not null default now()
);

create table if not exists equipos (
  id            uuid primary key default gen_random_uuid(),
  condominio_id uuid not null references condominios(id) on delete cascade,
  nombre        text not null,
  -- disponibilidad del equipo
  dias          int[] not null default '{0,1,2,3,4,5,6}',  -- 0=domingo … 6=sábado
  hora_inicio   time not null default '08:00',
  hora_fin      time not null default '16:30',             -- última hora de inicio
  duracion_min  int  not null default 90,                  -- cuánto dura un servicio
  intervalo_min int  not null default 30,                  -- cada cuánto arranca un cupo
  activo        boolean not null default true,
  created_at    timestamptz not null default now()
);

-- Categorías de vehículo con su precio y puntos (sin marca ni modelo)
create table if not exists categorias (
  id            uuid primary key default gen_random_uuid(),
  codigo        text unique not null,     -- 'city_car', 'suv_m', …
  nombre        text not null,            -- 'SUV M'
  precio_normal int not null,             -- CLP
  puntos        int not null,             -- puntos que otorga un servicio
  orden         int not null default 0,
  activo        boolean not null default true
);

-- Planes de recurrencia con su descuento (los edita el administrador)
create table if not exists planes_recurrencia (
  codigo       text primary key,          -- 'unica','mensual','quincenal','semanal'
  nombre       text not null,
  descuento_pct int not null default 0,   -- 0,5,10,15
  orden        int not null default 0,
  activo       boolean not null default true
);

create table if not exists premios (
  id           uuid primary key default gen_random_uuid(),
  nombre       text not null,
  costo_puntos int not null,
  orden        int not null default 0,
  activo       boolean not null default true
);

-- Bloqueos puntuales de agenda (feriados, lluvia, ausencias)
create table if not exists bloqueos (
  id           uuid primary key default gen_random_uuid(),
  equipo_id    uuid not null references equipos(id) on delete cascade,
  fecha        date not null,
  hora_inicio  time not null default '00:00',
  hora_fin     time not null default '23:59',
  motivo       text,
  created_at   timestamptz not null default now()
);

-- ---------- Clientes y sus datos ----------

-- Cada cliente está ligado a un usuario de Supabase Auth (auth.users)
create table if not exists clientes (
  id             uuid primary key references auth.users(id) on delete cascade,
  nombre         text not null,
  telefono       text,
  correo         text,
  condominio_id  uuid references condominios(id),
  acepta_promos  boolean not null default false,
  rol            text not null default 'cliente' check (rol in ('cliente','admin')),
  created_at     timestamptz not null default now()
);

create table if not exists vehiculos (
  id           uuid primary key default gen_random_uuid(),
  cliente_id   uuid not null references clientes(id) on delete cascade,
  categoria_id uuid not null references categorias(id),
  created_at   timestamptz not null default now()
);

-- Plan recurrente activo del cliente para un vehículo
create table if not exists suscripciones (
  id           uuid primary key default gen_random_uuid(),
  cliente_id   uuid not null references clientes(id) on delete cascade,
  vehiculo_id  uuid not null references vehiculos(id) on delete cascade,
  plan_codigo  text not null references planes_recurrencia(codigo),
  dia_semana   int not null,              -- 0..6
  hora         time not null,
  activo       boolean not null default true,
  created_at   timestamptz not null default now()
);

create table if not exists reservas (
  id             uuid primary key default gen_random_uuid(),
  cliente_id     uuid not null references clientes(id) on delete cascade,
  vehiculo_id    uuid not null references vehiculos(id),
  equipo_id      uuid not null references equipos(id),
  categoria_id   uuid not null references categorias(id),
  fecha          date not null,
  hora           time not null,
  estado         text not null default 'agendada' check (estado in ('agendada','completada','cancelada')),
  precio_normal  int not null,
  descuento_pct  int not null default 0,
  precio_cobrado int not null,
  plan_codigo    text not null references planes_recurrencia(codigo),
  premio_id      uuid references premios(id),
  suscripcion_id uuid references suscripciones(id),
  created_at     timestamptz not null default now()
);

create index if not exists idx_reservas_equipo_fecha on reservas(equipo_id, fecha) where estado <> 'cancelada';
create index if not exists idx_reservas_cliente on reservas(cliente_id);

-- Historial de puntos (ganados y canjeados)
create table if not exists movimientos_puntos (
  id           uuid primary key default gen_random_uuid(),
  cliente_id   uuid not null references clientes(id) on delete cascade,
  reserva_id   uuid references reservas(id) on delete set null,
  puntos       int not null,              -- positivo = ganados, negativo = canjeados
  motivo       text,
  created_at   timestamptz not null default now()
);

create index if not exists idx_movpuntos_cliente on movimientos_puntos(cliente_id);

-- ============================================================
-- Funciones auxiliares
-- ============================================================

-- ¿El usuario actual es administrador? (security definer evita recursión en RLS)
create or replace function es_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from clientes where id = auth.uid() and rol = 'admin');
$$;

-- Saldo de puntos de un cliente
create or replace function puntos_cliente(p_cliente uuid)
returns int
language sql stable security definer set search_path = public
as $$
  select coalesce(sum(puntos), 0)::int from movimientos_puntos where cliente_id = p_cliente;
$$;

-- Al crearse un usuario en Auth, se crea su ficha de cliente con los datos del registro
create or replace function handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into clientes (id, nombre, telefono, correo, condominio_id, acepta_promos)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nombre', ''),
    new.raw_user_meta_data->>'telefono',
    new.email,
    nullif(new.raw_user_meta_data->>'condominio_id','')::uuid,
    coalesce((new.raw_user_meta_data->>'acepta_promos')::boolean, false)
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Horas disponibles de un equipo en una fecha (devuelve solo los cupos libres)
create or replace function horas_disponibles(p_equipo uuid, p_fecha date)
returns setof time
language plpgsql stable security definer set search_path = public
as $$
declare
  v_equipo equipos%rowtype;
  v_slot   time;
  v_dow    int;
begin
  select * into v_equipo from equipos where id = p_equipo and activo;
  if not found then return; end if;

  v_dow := extract(dow from p_fecha);                 -- 0=domingo … 6=sábado
  if not (v_dow = any(v_equipo.dias)) then return; end if;

  v_slot := v_equipo.hora_inicio;
  while v_slot <= v_equipo.hora_fin loop
    -- no mostrar cupos ya pasados si la fecha es hoy
    if not (p_fecha = current_date and v_slot <= current_time) then
      -- ¿cupo ya tomado por otra reserva vigente?
      if not exists (
        select 1 from reservas r
        where r.equipo_id = p_equipo and r.fecha = p_fecha
          and r.hora = v_slot and r.estado <> 'cancelada'
      )
      -- ¿cupo bloqueado?
      and not exists (
        select 1 from bloqueos b
        where b.equipo_id = p_equipo and b.fecha = p_fecha
          and v_slot >= b.hora_inicio and v_slot < b.hora_fin
      )
      then
        return next v_slot;
      end if;
    end if;
    v_slot := v_slot + (v_equipo.intervalo_min || ' minutes')::interval;
  end loop;
end;
$$;

-- Crea una reserva validando todo del lado del servidor (precio, puntos, cupo)
create or replace function crear_reserva(
  p_vehiculo uuid,
  p_equipo   uuid,
  p_fecha    date,
  p_hora     time,
  p_plan     text default 'unica',
  p_premio   uuid default null
)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_cliente   uuid := auth.uid();
  v_cat       categorias%rowtype;
  v_desc      int;
  v_cobrado   int;
  v_reserva   uuid;
  v_susc      uuid := null;
  v_costo     int;
begin
  if v_cliente is null then raise exception 'No autenticado'; end if;

  -- el vehículo debe ser del cliente
  select c.* into v_cat
  from vehiculos ve join categorias c on c.id = ve.categoria_id
  where ve.id = p_vehiculo and ve.cliente_id = v_cliente;
  if not found then raise exception 'Vehículo no válido'; end if;

  -- el cupo debe estar disponible
  if not exists (select 1 from horas_disponibles(p_equipo, p_fecha) h where h = p_hora) then
    raise exception 'Ese horario ya no está disponible';
  end if;

  -- descuento del plan
  select descuento_pct into v_desc from planes_recurrencia where codigo = p_plan and activo;
  if not found then raise exception 'Plan no válido'; end if;
  v_cobrado := round(v_cat.precio_normal * (100 - v_desc) / 100.0);

  -- si hay premio, validar saldo de puntos
  if p_premio is not null then
    select costo_puntos into v_costo from premios where id = p_premio and activo;
    if not found then raise exception 'Premio no válido'; end if;
    if puntos_cliente(v_cliente) < v_costo then raise exception 'Puntos insuficientes'; end if;
  end if;

  -- si es recurrente, registrar/activar la suscripción
  if p_plan <> 'unica' then
    insert into suscripciones (cliente_id, vehiculo_id, plan_codigo, dia_semana, hora)
    values (v_cliente, p_vehiculo, p_plan, extract(dow from p_fecha), p_hora)
    returning id into v_susc;
  end if;

  insert into reservas (cliente_id, vehiculo_id, equipo_id, categoria_id, fecha, hora,
                        precio_normal, descuento_pct, precio_cobrado, plan_codigo, premio_id, suscripcion_id)
  values (v_cliente, p_vehiculo, p_equipo, v_cat.id, p_fecha, p_hora,
          v_cat.precio_normal, v_desc, v_cobrado, p_plan, p_premio, v_susc)
  returning id into v_reserva;

  -- puntos ganados por el servicio
  insert into movimientos_puntos (cliente_id, reserva_id, puntos, motivo)
  values (v_cliente, v_reserva, v_cat.puntos, 'Servicio ' || v_cat.nombre);

  -- puntos canjeados por el premio
  if p_premio is not null then
    insert into movimientos_puntos (cliente_id, reserva_id, puntos, motivo)
    values (v_cliente, v_reserva, -v_costo, 'Premio canjeado');
  end if;

  return v_reserva;
end;
$$;

-- Cancelar una reserva propia (devuelve los puntos de ese servicio/premio)
create or replace function cancelar_reserva(p_reserva uuid)
returns void
language plpgsql security definer set search_path = public
as $$
declare v_cliente uuid := auth.uid();
begin
  update reservas set estado = 'cancelada'
  where id = p_reserva and cliente_id = v_cliente and estado = 'agendada';
  if not found then raise exception 'Reserva no encontrada'; end if;
  delete from movimientos_puntos where reserva_id = p_reserva;
end;
$$;

-- ============================================================
-- Seguridad a nivel de fila (RLS)
-- ============================================================

alter table condominios          enable row level security;
alter table equipos              enable row level security;
alter table categorias           enable row level security;
alter table planes_recurrencia   enable row level security;
alter table premios              enable row level security;
alter table bloqueos             enable row level security;
alter table clientes             enable row level security;
alter table vehiculos            enable row level security;
alter table suscripciones        enable row level security;
alter table reservas             enable row level security;
alter table movimientos_puntos   enable row level security;

-- Tablas de referencia: cualquiera puede leerlas (para elegir condominio y ver precios
-- antes de crear la cuenta); solo el administrador las modifica.
do $$
declare t text;
begin
  foreach t in array array['condominios','equipos','categorias','planes_recurrencia','premios'] loop
    execute format('drop policy if exists "leer %1$s" on %1$s;', t);
    execute format('create policy "leer %1$s" on %1$s for select using (true);', t);
    execute format('drop policy if exists "admin %1$s" on %1$s;', t);
    execute format('create policy "admin %1$s" on %1$s for all using (es_admin()) with check (es_admin());', t);
  end loop;
end $$;

-- Bloqueos: solo administrador (la disponibilidad se calcula por función)
drop policy if exists "admin bloqueos" on bloqueos;
create policy "admin bloqueos" on bloqueos for all using (es_admin()) with check (es_admin());

-- Clientes: cada quien ve y edita su ficha; el administrador ve todas
drop policy if exists "cliente propio select" on clientes;
create policy "cliente propio select" on clientes for select using (id = auth.uid() or es_admin());
drop policy if exists "cliente propio update" on clientes;
create policy "cliente propio update" on clientes for update using (id = auth.uid());

-- Vehículos, suscripciones, reservas, puntos: dueño o administrador
do $$
declare t text;
begin
  foreach t in array array['vehiculos','suscripciones','reservas','movimientos_puntos'] loop
    execute format('drop policy if exists "propio select %1$s" on %1$s;', t);
    execute format('create policy "propio select %1$s" on %1$s for select using (cliente_id = auth.uid() or es_admin());', t);
  end loop;
end $$;

-- El cliente puede crear sus propios vehículos
drop policy if exists "propio insert vehiculos" on vehiculos;
create policy "propio insert vehiculos" on vehiculos for insert with check (cliente_id = auth.uid());
