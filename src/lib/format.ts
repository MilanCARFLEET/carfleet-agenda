// Formato de moneda chilena: 40000 -> "$40.000"
export function clp(valor: number): string {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(valor);
}

// "08:00:00" -> "8:00"
export function hora(t: string): string {
  const [h, m] = t.split(":");
  return `${parseInt(h, 10)}:${m}`;
}

const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const DIAS_CORTOS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

export function diaCorto(fecha: Date): string {
  return DIAS_CORTOS[fecha.getDay()];
}

// Date -> "miércoles 18 de noviembre"
export function fechaLarga(fecha: Date): string {
  return `${DIAS[fecha.getDay()]} ${fecha.getDate()} de ${MESES[fecha.getMonth()]}`;
}

// Date -> "2026-11-18" (fecha local, sin desfase de zona horaria)
export function fechaISO(fecha: Date): string {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, "0");
  const d = String(fecha.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
