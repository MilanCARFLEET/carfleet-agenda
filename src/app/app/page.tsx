import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/Logo";
import { BottomNav } from "@/components/BottomNav";
import { clp, fechaLarga, hora } from "@/lib/format";

export const dynamic = "force-dynamic";

type ReservaHome = {
  id: string;
  fecha: string;
  hora: string;
  estado: string;
  precio_cobrado: number;
  plan_codigo: string;
  categorias: { nombre: string; puntos: number } | null;
};

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: cliente } = await supabase
    .from("clientes")
    .select("nombre")
    .eq("id", user!.id)
    .single();

  const { data: puntos } = await supabase.rpc("puntos_cliente", {
    p_cliente: user!.id,
  });

  const hoy = new Date().toISOString().slice(0, 10);

  const { data: proximaRaw } = await supabase
    .from("reservas")
    .select("id, fecha, hora, estado, precio_cobrado, plan_codigo, categorias(nombre, puntos)")
    .eq("estado", "agendada")
    .gte("fecha", hoy)
    .order("fecha")
    .order("hora")
    .limit(1)
    .maybeSingle();
  const proxima = proximaRaw as unknown as ReservaHome | null;

  const { data: histRaw } = await supabase
    .from("reservas")
    .select("id, fecha, hora, estado, precio_cobrado, plan_codigo, categorias(nombre, puntos)")
    .order("fecha", { ascending: false })
    .limit(3);
  const historial = (histRaw ?? []) as unknown as ReservaHome[];

  const nombre = String(cliente?.nombre ?? "").split(" ")[0];

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-3.5 px-6 pb-0 pt-4">
      <div className="flex items-center justify-between">
        <Logo size={22} />
        <Link
          href="/app/cuenta"
          aria-label="Mi cuenta"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-sm font-semibold text-carbon"
        >
          {String(cliente?.nombre ?? "")
            .split(" ")
            .map((p: string) => p[0])
            .slice(0, 2)
            .join("")
            .toUpperCase()}
        </Link>
      </div>

      <h1 className="text-2xl font-semibold">Hola, {nombre}</h1>

      {proxima ? (
        <div className="flex flex-col gap-2.5 rounded-2xl bg-white p-4 text-carbon">
          <div className="text-xs font-semibold uppercase tracking-wide text-ink2">
            Tu próximo servicio
          </div>
          <div className="text-xl font-bold leading-tight">
            {fechaLarga(new Date(proxima.fecha + "T00:00:00"))}, {hora(proxima.hora)}
          </div>
          <div className="text-[13px] text-ink2">
            {proxima.categorias?.nombre} · {clp(proxima.precio_cobrado)}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-edge bg-surface p-4 text-sm text-muted">
          No tienes un servicio agendado. ¡Agenda el próximo!
        </div>
      )}

      <div className="flex items-center justify-between rounded-2xl bg-surface p-4">
        <div className="flex flex-col gap-0.5">
          <div className="text-[26px] font-bold leading-none">{puntos ?? 0} puntos</div>
          <div className="text-[13px] text-muted">Canjéalos por premios</div>
        </div>
        <Link href="/app/premios" className="flex min-h-11 items-center text-sm font-semibold">
          Ver premios
        </Link>
      </div>

      {historial.length > 0 && (
        <div className="flex flex-col">
          <div className="mb-0.5 text-[13px] font-semibold text-muted">
            Últimos servicios
          </div>
          {historial.map((r) => (
            <div
              key={r.id}
              className="flex items-center justify-between gap-3 border-b border-line py-3 text-sm last:border-0"
            >
              <span>
                {fechaLarga(new Date(r.fecha + "T00:00:00"))}
                <span className="block text-xs text-muted">
                  {r.categorias?.nombre}
                  {r.estado === "cancelada" && " · cancelado"}
                </span>
              </span>
              <span className="text-right">
                {clp(r.precio_cobrado)}
                <span className="block text-xs text-muted">
                  +{r.categorias?.puntos} puntos
                </span>
              </span>
            </div>
          ))}
        </div>
      )}

      <Link
        href="/app/agendar"
        className="mt-2 flex h-[54px] w-full items-center justify-center rounded-xl bg-brand text-base font-semibold text-white"
      >
        Agendar otro servicio
      </Link>

      <BottomNav activo="/app" />
    </main>
  );
}
