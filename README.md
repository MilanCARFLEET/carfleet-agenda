# CarFleet — App de agendamiento

App web para que los clientes de cada condominio agenden su lavado detailing:
eligen condominio, categoría de vehículo, día y hora, plan de recurrencia con
descuento y suman puntos canjeables por premios. Milan entra como administrador.

Hecha con **Next.js** (interfaz y lógica), **Supabase** (base de datos y cuentas)
y pensada para publicarse en **Vercel**. Todo con planes gratuitos.

---

## Puesta en marcha (una sola vez)

### 1. Crear el proyecto en Supabase
1. Entra a https://supabase.com y crea una cuenta.
2. Crea un proyecto nuevo (elige la región más cercana, por ejemplo São Paulo).
   Guarda la contraseña de la base de datos.
3. En el menú **SQL Editor**, abre una consulta nueva, pega el contenido de
   `supabase/schema.sql` y ejecútalo (Run).
4. Repite con `supabase/seed.sql` (los datos iniciales: precios, premios y el
   condominio Las Palmas del Oliveto).

### 2. Conectar la app con Supabase
1. En Supabase: **Project Settings → API**. Copia la **Project URL** y la
   **anon public key**.
2. En la carpeta del proyecto, copia `.env.local.example` como `.env.local` y
   pega esos dos valores.

### 3. Correr la app en tu computador
```bash
npm install
npm run dev
```
Abre http://localhost:3000

### 4. Convertirte en administrador
1. Regístrate desde la app con tu correo (pantalla de crear cuenta).
2. En Supabase → SQL Editor, ejecuta (con tu correo):
   ```sql
   update clientes set rol = 'admin' where correo = 'tu-correo@ejemplo.cl';
   ```
3. Entra a http://localhost:3000/admin

### 5. Publicar en internet (Vercel)
1. Sube el proyecto a un repositorio en GitHub.
2. En https://vercel.com, importa ese repositorio.
3. En la configuración del proyecto en Vercel, agrega las mismas dos variables
   de entorno (`NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
4. Vercel te da una dirección (ej. `carfleet-agenda.vercel.app`). **Ese es el
   link que envías por WhatsApp.** Más adelante se le puede poner un dominio
   propio (ej. `agenda.carfleet.cl`).

---

## Decisión importante: confirmación por correo

Por defecto Supabase pide que el cliente confirme su correo antes de poder entrar
(**Authentication → Sign In / Providers → Confirm email**).

- **Dejarla activada:** más seguro, pero el cliente debe abrir un correo antes de
  usar la app (más fricción).
- **Desactivarla:** el cliente entra al instante después de registrarse (más
  simple para onboarding por WhatsApp).

Para el inicio, lo más cómodo es desactivarla. Se puede volver a activar cuando
quieras.

> Nota sobre el inicio de sesión: hoy la cuenta funciona con **correo + clave**
> (es gratis e incluye recuperación de clave). El teléfono se guarda como dato de
> contacto. Si más adelante quieres que el ingreso sea con teléfono, se puede
> cambiar (requiere activar SMS, que tiene costo por mensaje).

---

## Qué está construido

**App del cliente:** elegir condominio · crear cuenta · iniciar sesión · inicio
(próximo servicio, puntos, historial) · **flujo de reserva completo** (categoría →
recurrencia + premio opcional → día y hora con disponibilidad real → confirmar) ·
puntos y premios · cerrar sesión.

**Panel de administrador** (`/admin`): resumen con métricas (ingresos, servicios,
clientes activos, % recurrentes, ticket, ingresos por plan, clientes por
recurrencia, servicios por categoría, puntos y premios), tabla de clientes, y
edición en vivo de precios, puntos, descuentos por recurrencia, premios,
condominios y equipos.

**Base de datos:** seguridad por cliente (cada quien ve solo lo suyo; el
administrador ve todo). Precios, puntos y cupos se calculan en el servidor.

## Pendientes de negocio por definir
- Cómo ubica el equipo el auto el día del servicio (sin domicilio guardado).
- Confirmar la tabla de precios y el caso "pick up XL".
- ¿Los $30.000 del City car son un piso que ningún descuento puede bajar?
- Forma de pago (en la app o al terminar el servicio) y plazo de cancelación.
