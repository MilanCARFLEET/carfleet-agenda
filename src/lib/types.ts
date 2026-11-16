export type Condominio = {
  id: string;
  nombre: string;
  comuna: string | null;
  activo: boolean;
};

export type Categoria = {
  id: string;
  codigo: string;
  nombre: string;
  precio_normal: number;
  puntos: number;
  orden: number;
  activo: boolean;
};

export type PlanRecurrencia = {
  codigo: string;
  nombre: string;
  descuento_pct: number;
  orden: number;
  activo: boolean;
};

export type Premio = {
  id: string;
  nombre: string;
  costo_puntos: number;
  orden: number;
  activo: boolean;
};

export type Cliente = {
  id: string;
  nombre: string;
  telefono: string | null;
  correo: string | null;
  condominio_id: string | null;
  acepta_promos: boolean;
  rol: "cliente" | "admin";
};

export type Reserva = {
  id: string;
  cliente_id: string;
  vehiculo_id: string;
  equipo_id: string;
  categoria_id: string;
  fecha: string;
  hora: string;
  estado: "agendada" | "completada" | "cancelada";
  precio_normal: number;
  descuento_pct: number;
  precio_cobrado: number;
  plan_codigo: string;
  premio_id: string | null;
};

export function precioConDescuento(precioNormal: number, descuentoPct: number): number {
  return Math.round((precioNormal * (100 - descuentoPct)) / 100);
}
