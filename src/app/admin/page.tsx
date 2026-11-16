import { createClient } from "@/lib/supabase/server";
import { clp } from "@/lib/format";

type ReservaRow = {
  id: string; cliente_id: string; categoria_id: string; fecha: string;
  estado: string; precio_cobrado: number; plan_codigo: string; premio_id: string | null;
  categorias: { nombre: string } | null;
};

function Bar({ label, value, max, money = false, red = false }: { label: string; value: number; max: number; money?: boolean; red?: boolean }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="grid grid-cols-[130px_1fr_auto] items-center gap-3 text-[13px]">
      <span className="truncate">{label}</span>
      <span className="h-3.5 overflow-hidden rounded bg-[#e6e6e6]">
        <span className={`block h-full rounded ${red ? "bg-brand" : "bg-carbon"}`} style={{ width: `${pct}%` }} />
      </span>
      <span className="text-right font-semibold tabular-nums">{money ? clp(value) : value}</span>
    </div>
  );
}

export default async function AdminResumen() {
  const supabase = await createClient();

  const [{ data: clientesRaw }, { data: reservasRaw }, { data: suscRaw }, { data: movRaw }, { data: planesRaw }] = await Promise.all([
    supabase.from("clientes").select("id, nombre").eq("rol", "cliente"),
    supabase.from("reservas").select("id, cliente_id, categoria_id, fecha, estado, precio_cobrado, plan_codigo, premio_id, categorias(nombre)"),
    supabase.from("suscripciones").select("cliente_id, plan_codigo").eq("activo", true),
    supabase.from("movimientos_puntos").select("cliente_id, puntos, created_at"),
    supabase.from("planes_recurrencia").select("codigo, nombre").order("orden"),
  ]);

  const clientes = (clientesRaw ?? []) as { id: string; nombre: string }[];
  const reservas = ((reservasRaw ?? []) as unknown as ReservaRow[]).filter((r) => r.estado !== "cancelada");
  const suscripciones = (suscRaw ?? []) as { cliente_id: string; plan_codigo: string }[];
  const movimientos = (movRaw ?? []) as { cliente_id: string; puntos: number; created_at: string }[];
  const planes = (planesRaw ?? []) as { codigo: string; nombre: string }[];

  const mesIni = new Date();
  mesIni.setDate(1);
  const mesIniISO = `${mesIni.getFullYear()}-${String(mesIni.getMonth() + 1).padStart(2, "0")}-01`;
  const reservasMes = reservas.filter((r) => r.fecha >= mesIniISO);

  const ingresosMes = reservasMes.reduce((s, r) => s + r.precio_cobrado, 0);
  const serviciosMes = reservasMes.length;
  const planPorCliente = new Map(suscripciones.map((s) => [s.cliente_id, s.plan_codigo]));
  const clientesConPlan = new Set(suscripciones.map((s) => s.cliente_id)).size;
  const ticket = serviciosMes ? Math.round(ingresosMes / serviciosMes) : 0;

  const ingresosPorPlan = planes.map((p) => ({
    nombre: p.nombre,
    total: reservasMes.filter((r) => r.plan_codigo === p.codigo).reduce((s, r) => s + r.precio_cobrado, 0),
  }));

  const porCategoria = new Map<string, number>();
  for (const r of reservas) {
    const n = r.categorias?.nombre ?? "—";
    porCategoria.set(n, (porCategoria.get(n) ?? 0) + 1);
  }
  const serviciosPorCategoria = [...porCategoria.entries()].map(([nombre, n]) => ({ nombre, n })).sort((a, b) => b.n - a.n);

  const recuento: Record<string, number> = { semanal: 0, quincenal: 0, mensual: 0, sin: 0 };
  for (const c of clientes) {
    const pl = planPorCliente.get(c.id);
    if (pl === "semanal") recuento.semanal++;
    else if (pl === "quincenal") recuento.quincenal++;
    else if (pl === "mensual") recuento.mensual++;
    else recuento.sin++;
  }

  const puntosMes = movimientos.filter((m) => m.puntos > 0 && m.created_at >= mesIni.toISOString()).reduce((s, m) => s + m.puntos, 0);
  const premiosCanjeados = reservasMes.filter((r) => r.premio_id).length;

  // Tabla de clientes
  const puntosPorCliente = new Map<string, number>();
  for (const m of movimientos) puntosPorCliente.set(m.cliente_id, (puntosPorCliente.get(m.cliente_id) ?? 0) + m.puntos);
  const tabla = clientes.map((c) => {
    const suyas = reservas.filter((r) => r.cliente_id === c.id);
    const cats = new Map<string, number>();
    for (const r of suyas) { const n = r.categorias?.nombre ?? "—"; cats.set(n, (cats.get(n) ?? 0) + 1); }
    const catTop = [...cats.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
    const ultimo = suyas.map((r) => r.fecha).sort().at(-1) ?? "—";
    const plan = planPorCliente.get(c.id);
    return {
      nombre: c.nombre || "—",
      categoria: catTop,
      plan: planes.find((p) => p.codigo === plan)?.nombre ?? "Sin plan",
      servicios: suyas.length,
      ultimo,
      puntos: puntosPorCliente.get(c.id) ?? 0,
      gasto: suyas.reduce((s, r) => s + r.precio_cobrado, 0),
    };
  }).sort((a, b) => b.servicios - a.servicios);

  const maxIngPlan = Math.max(1, ...ingresosPorPlan.map((p) => p.total));
  const maxCat = Math.max(1, ...serviciosPorCategoria.map((p) => p.n));
  const recuentoTotal = Math.max(1, recuento.semanal + recuento.quincenal + recuento.mensual + recuento.sin);

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-semibold">Resumen del negocio</h1>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <Kpi label="Ingresos del mes" value={clp(ingresosMes)} sub={`${serviciosMes} servicios`} />
        <Kpi label="Servicios del mes" value={String(serviciosMes)} sub={`en ${clientes.length} clientes`} />
        <Kpi label="Clientes" value={String(clientes.length)} sub="registrados" />
        <Kpi label="Con plan recurrente" value={`${clientes.length ? Math.round((clientesConPlan / clientes.length) * 100) : 0}%`} sub={`${clientesConPlan} de ${clientes.length}`} />
        <Kpi label="Ticket promedio" value={clp(ticket)} sub="por servicio" />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <Panel title="Ingresos por tipo de plan">
          {ingresosPorPlan.map((p) => <Bar key={p.nombre} label={p.nombre} value={p.total} max={maxIngPlan} money red={p.nombre.includes("semana") && !p.nombre.includes("2")} />)}
        </Panel>
        <Panel title="Clientes por recurrencia">
          <Bar label="Semanal" value={recuento.semanal} max={recuentoTotal} red />
          <Bar label="Cada 2 semanas" value={recuento.quincenal} max={recuentoTotal} />
          <Bar label="Mensual" value={recuento.mensual} max={recuentoTotal} />
          <Bar label="Sin plan" value={recuento.sin} max={recuentoTotal} />
        </Panel>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <Panel title="Servicios por categoría">
          {serviciosPorCategoria.length === 0 && <p className="text-sm text-ink2">Aún no hay servicios registrados.</p>}
          {serviciosPorCategoria.map((c, i) => <Bar key={c.nombre} label={c.nombre} value={c.n} max={maxCat} red={i === 0} />)}
        </Panel>
        <Panel title="Puntos y premios">
          <div className="grid grid-cols-2 gap-3">
            <Kpi label="Puntos entregados" value={String(puntosMes)} sub="en el mes" />
            <Kpi label="Premios canjeados" value={String(premiosCanjeados)} sub="en el mes" />
          </div>
        </Panel>
      </div>

      <Panel title={`Clientes (${tabla.length})`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-[13px]">
            <thead>
              <tr className="border-b-2 border-carbon text-left text-ink2">
                <th className="p-2.5">Cliente</th><th className="p-2.5">Categoría</th><th className="p-2.5">Plan</th>
                <th className="p-2.5 text-right">Servicios</th><th className="p-2.5">Último</th>
                <th className="p-2.5 text-right">Puntos</th><th className="p-2.5 text-right">Gasto acumulado</th>
              </tr>
            </thead>
            <tbody>
              {tabla.length === 0 && <tr><td colSpan={7} className="p-4 text-center text-ink2">Aún no hay clientes registrados.</td></tr>}
              {tabla.map((r, i) => (
                <tr key={i} className="border-b border-[#e3e3e3]">
                  <td className="p-2.5">{r.nombre}</td>
                  <td className="p-2.5">{r.categoria}</td>
                  <td className="p-2.5">{r.plan}</td>
                  <td className="p-2.5 text-right tabular-nums">{r.servicios}</td>
                  <td className="p-2.5">{r.ultimo}</td>
                  <td className="p-2.5 text-right tabular-nums">{r.puntos}</td>
                  <td className="p-2.5 text-right tabular-nums">{clp(r.gasto)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

function Kpi({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-[#d9d9d9] bg-white p-4">
      <span className="text-[13px] text-ink2">{label}</span>
      <span className="text-2xl font-bold tracking-tight">{value}</span>
      <span className="text-xs text-ink2">{sub}</span>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3.5 rounded-xl border border-[#d9d9d9] bg-white p-5">
      <h2 className="text-base font-semibold">{title}</h2>
      {children}
    </div>
  );
}
