-- ============================================================
-- CarFleet — Datos iniciales. Ejecutar DESPUÉS de schema.sql.
-- Todos los valores son editables después desde el panel admin.
-- ============================================================

-- Planes de recurrencia y su descuento
insert into planes_recurrencia (codigo, nombre, descuento_pct, orden) values
  ('unica',     'Solo esta vez',   0, 1),
  ('mensual',   'Una vez al mes',  5, 2),
  ('quincenal', 'Cada 2 semanas', 10, 3),
  ('semanal',   'Todas las semanas', 15, 4)
on conflict (codigo) do nothing;

-- Categorías de vehículo: precio normal (CLP) y puntos (1 punto por cada $1.000)
insert into categorias (codigo, nombre, precio_normal, puntos, orden) values
  ('city_car',  'City car',                       30000, 30, 1),
  ('coupe',     'Coupé',                           32000, 32, 2),
  ('sedan',     'Sedán',                           35000, 35, 3),
  ('suv_s',     'SUV S',                           37000, 37, 4),
  ('suv_m',     'SUV M',                           40000, 40, 5),
  ('suv_l',     'SUV L',                           45000, 45, 6),
  ('suv_xl',    'SUV XL (3 corridas)',             50000, 50, 7),
  ('pickup_s',  'Pick up S',                       40000, 40, 8),
  ('pickup_m',  'Pick up M',                       45000, 45, 9),
  ('pickup_l',  'Pick up L',                       50000, 50, 10)
on conflict (codigo) do nothing;

-- Premios y su costo en puntos
insert into premios (nombre, costo_puntos, orden) values
  ('Ambientador CarFleet',                       80,  1),
  ('Repelente de lluvia en parabrisas',          120, 2),
  ('Desinfección y sanitización del interior',   160, 3),
  ('Lavado de motor',                            200, 4),
  ('Hidratación profunda de cueros',             240, 5),
  ('Sellador sintético premium',                 280, 6),
  ('Pulido de focos',                            320, 7)
on conflict do nothing;

-- Primer condominio y su equipo (lunes a domingo, 8:00 a 16:30)
insert into condominios (nombre, comuna)
select 'Las Palmas del Oliveto', 'Talagante'
where not exists (select 1 from condominios where nombre = 'Las Palmas del Oliveto');

insert into equipos (condominio_id, nombre, dias, hora_inicio, hora_fin, duracion_min, intervalo_min)
select c.id, 'Equipo 1', '{0,1,2,3,4,5,6}', '08:00', '16:30', 90, 30
from condominios c
where c.nombre = 'Las Palmas del Oliveto'
  and not exists (select 1 from equipos e where e.condominio_id = c.id);

-- Para convertir una cuenta en administrador (después de registrarte desde la app):
--   update clientes set rol = 'admin' where correo = 'TU_CORREO_AQUI';
