"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/Logo";
import { clp, diaCorto, fechaISO, fechaLarga, hora } from "@/lib/format";
import { precioConDescuento, type Categoria, type PlanRecurrencia, type Premio } from "@/lib/types";

type Paso = "cargando" | "categoria" | "plan" | "fecha" | "confirmar" | "listo" | "sin_equipo";

export default function AgendarPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [paso, setPaso] = useState<Paso>("cargando");
  const [equipoId, setEquipoId] = useState<string | null>(null);
  const [condominioNombre, setCondominioNombre] = useState("");
  const [dias, setDias] = useState<number[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [planes, setPlanes] = useState<PlanRecurrencia[]>([]);
  const [premios, setPremios] = useState<Premio[]>([]);
  const [puntos, setPuntos] = useState(0);

  const [cat, setCat] = useState<Categoria | null>(null);
  const [plan, setPlan] = useState<PlanRecurrencia | null>(null);
  const [premio, setPremio] = useState<Premio | null>(null);
  const [fecha, setFecha] = useState<string | null>(null);
  const [horasLibres, setHorasLibres] = useState<string[] | null>(null);
  const [horaSel, setHoraSel] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar datos base
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/ingresar"); return; }

      const { data: cliente } = await supabase
        .from("clientes").select("condominio_id").eq("id", user.id).single();

      const [{ data: cats }, { data: pls }, { data: prs }, { data: pts }] = await Promise.all([
        supabase.from("categorias").select("*").eq("activo", true).order("orden"),
        supabase.from("planes_recurrencia").select("*").eq("activo", true).order("orden"),
        supabase.from("premios").select("*").eq("activo", true).order("orden"),
        supabase.rpc("puntos_cliente", { p_cliente: user.id }),
      ]);

      setCategorias((cats ?? []) as Categoria[]);
      setPlanes((pls ?? []) as PlanRecurrencia[]);
      setPremios((prs ?? []) as Premio[]);
      setPuntos((pts as number) ?? 0);

      if (!cliente?.condominio_id) { setPaso("sin_equipo"); return; }

      const { data: equipo } = await supabase
        .from("equipos")
        .select("id, dias, condominios(nombre)")
        .eq("condominio_id", cliente.condominio_id)
        .eq("activo", true)
        .order("created_at")
        .limit(1)
        .maybeSingle();

      if (!equipo) { setPaso("sin_equipo"); return; }
      setEquipoId(equipo.id as string);
      setDias((equipo.dias as number[]) ?? [0, 1, 2, 3, 4, 5, 6]);
      const cond = equipo.condominios as unknown as { nombre: string } | null;
      setCondominioNombre(cond?.nombre ?? "");
      setPaso("categoria");
    })();
  }, [supabase, router]);

  // Próximos 21 días filtrados por los días que atiende el equipo
  const fechasDisponibles = useMemo(() => {
    const out: Date[] = [];
    const hoy = new Date();
    for (let i = 0; i < 21 && out.length < 14; i++) {
      const d = new Date(hoy);
      d.setDate(hoy.getDate() + i);
      if (dias.includes(d.getDay())) out.push(d);
    }
    return out;
  }, [dias]);

  async function elegirFecha(iso: string) {
    setFecha(iso);
    setHoraSel(null);
    setHorasLibres(null);
    const { data } = await supabase.rpc("horas_disponibles", { p_equipo: equipoId, p_fecha: iso });
    setHorasLibres((data as string[]) ?? []);
  }

  async function confirmar() {
    if (!cat || !plan || !fecha || !horaSel || !equipoId) return;
    setGuardando(true);
    setError(null);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/ingresar"); return; }

    // Reusar un vehículo del cliente con esa categoría, o crearlo
    let vehiculoId: string | null = null;
    const { data: veh } = await supabase
      .from("vehiculos").select("id").eq("cliente_id", user.id).eq("categoria_id", cat.id).limit(1).maybeSingle();
    if (veh?.id) vehiculoId = veh.id as string;
    else {
      const { data: nuevo, error: e1 } = await supabase
        .from("vehiculos").insert({ cliente_id: user.id, categoria_id: cat.id }).select("id").single();
      if (e1) { setError("No se pudo registrar el vehículo."); setGuardando(false); return; }
      vehiculoId = nuevo.id as string;
    }

    const { error: e2 } = await supabase.rpc("crear_reserva", {
      p_vehiculo: vehiculoId,
      p_equipo: equipoId,
      p_fecha: fecha,
      p_hora: horaSel,
      p_plan: plan.codigo,
      p_premio: premio?.id ?? null,
    });
    setGuardando(false);
    if (e2) { setError(e2.message); return; }
    setPaso("listo");
  }

  const precio = cat && plan ? precioConDescuento(cat.precio_normal, plan.descuento_pct) : 0;

  // ---------- Encabezado ----------
  const Header = ({ volver, titulo }: { volver: () => void; titulo?: string }) => (
    <div className="flex items-center justify-between">
      <button onClick={volver} aria-label="Volver" className="-ml-3 flex h-11 w-11 items-center justify-center text-white">
        <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
      </button>
      <Logo />
      <span className="w-11 text-right text-[13px] text-muted">{titulo}</span>
    </div>
  );

  if (paso === "cargando") {
    return <main className="mx-auto flex min-h-dvh max-w-md items-center justify-center px-6 text-muted">Cargando…</main>;
  }

  if (paso === "sin_equipo") {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-4 px-6 py-6">
        <Logo />
        <h1 className="mt-4 text-2xl font-semibold">Aún no hay agenda para tu condominio</h1>
        <p className="text-muted">Escríbenos por WhatsApp y lo activamos para ti.</p>
        <Link href="/app" className="mt-2 text-sm text-white underline">Volver al inicio</Link>
      </main>
    );
  }

  if (paso === "listo") {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand">
          <svg aria-hidden="true" width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
        </div>
        <h1 className="text-2xl font-semibold">¡Reserva confirmada!</h1>
        <p className="text-muted">
          {cat?.nombre} · {fecha && fechaLarga(new Date(fecha + "T00:00:00"))}, {horaSel && hora(horaSel)}
        </p>
        <Link href="/app" className="mt-2 flex h-[54px] w-full items-center justify-center rounded-xl bg-brand font-semibold text-white">
          Ir a mi inicio
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-4 px-6 pb-6 pt-4">
      {/* ---------- Paso 1: categoría ---------- */}
      {paso === "categoria" && (
        <>
          <Header volver={() => router.push("/app")} titulo="1 de 4" />
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold">¿Qué tamaño tiene tu vehículo?</h1>
            <p className="text-sm text-muted">Solo el tamaño; así te damos el precio exacto.</p>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {categorias.map((c) => (
              <button
                key={c.id}
                onClick={() => { setCat(c); setPremio(null); setPaso("plan"); }}
                className="flex h-11 items-center justify-between rounded-[10px] border border-edge bg-surface px-3 text-[13px] text-white"
              >
                <span>{c.nombre}</span>
                <span className="font-semibold">{clp(c.precio_normal)}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {/* ---------- Paso 2: recurrencia + premio ---------- */}
      {paso === "plan" && cat && (
        <>
          <Header volver={() => setPaso("categoria")} titulo="2 de 4" />
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold">¿Cada cuánto lo quieres?</h1>
            <p className="text-sm text-muted">{cat.nombre} · Lavado detailing completo</p>
          </div>
          <div className="flex flex-col gap-2">
            {planes.map((p) => {
              const prc = precioConDescuento(cat.precio_normal, p.descuento_pct);
              const sel = plan?.codigo === p.codigo;
              return (
                <button
                  key={p.codigo}
                  aria-pressed={sel}
                  onClick={() => setPlan(p)}
                  className={`flex min-h-16 items-center justify-between gap-3 rounded-2xl px-4 text-left ${sel ? "border-2 border-brand bg-white text-carbon" : "border border-edge bg-surface text-white"}`}
                >
                  <span className="flex flex-col gap-0.5">
                    <span className="text-[15px] font-semibold">
                      {p.nombre}{p.descuento_pct > 0 && <span className="ml-2 rounded-full bg-brand px-2 py-0.5 text-xs font-semibold text-white">−{p.descuento_pct}%</span>}
                    </span>
                    {p.descuento_pct > 0 && <span className={`text-xs ${sel ? "text-ink2" : "text-muted"}`}>Ahorras {clp(cat.precio_normal - prc)} por servicio</span>}
                  </span>
                  <span className="whitespace-nowrap font-bold">{clp(prc)}</span>
                </button>
              );
            })}
          </div>

          {premios.length > 0 && (
            <div className="flex flex-col gap-2">
              <h2 className="text-[13px] font-semibold text-muted">¿Canjear un premio con tus puntos? (opcional)</h2>
              <div className="flex flex-col gap-1.5">
                <button
                  onClick={() => setPremio(null)}
                  className={`flex min-h-11 items-center rounded-xl px-4 text-sm ${!premio ? "border-2 border-brand bg-white text-carbon" : "border border-edge bg-surface text-white"}`}
                >Sin premio</button>
                {premios.map((pr) => {
                  const alcanza = puntos >= pr.costo_puntos;
                  const sel = premio?.id === pr.id;
                  return (
                    <button
                      key={pr.id}
                      disabled={!alcanza}
                      onClick={() => setPremio(pr)}
                      className={`flex min-h-11 items-center justify-between gap-2 rounded-xl px-4 text-sm disabled:opacity-40 ${sel ? "border-2 border-brand bg-white text-carbon" : "border border-edge bg-surface text-white"}`}
                    >
                      <span>{pr.nombre}</span>
                      <span className={`text-xs ${sel ? "text-ink2" : "text-muted"}`}>{alcanza ? `${pr.costo_puntos} pts` : `faltan ${pr.costo_puntos - puntos}`}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <button
            disabled={!plan}
            onClick={() => setPaso("fecha")}
            className="mt-auto flex h-[54px] items-center justify-center rounded-xl bg-brand font-semibold text-white disabled:opacity-50"
          >Elegir día y hora</button>
        </>
      )}

      {/* ---------- Paso 3: día y hora ---------- */}
      {paso === "fecha" && (
        <>
          <Header volver={() => setPaso("plan")} titulo="3 de 4" />
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold">Elige día y hora</h1>
            <p className="text-sm text-muted">{condominioNombre}</p>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            {fechasDisponibles.map((d) => {
              const iso = fechaISO(d);
              const sel = fecha === iso;
              return (
                <button
                  key={iso}
                  onClick={() => elegirFecha(iso)}
                  className={`flex h-16 w-14 shrink-0 flex-col items-center justify-center gap-0.5 rounded-xl ${sel ? "border border-white bg-white text-carbon" : "border border-edge bg-surface text-white"}`}
                >
                  <span className={`text-xs ${sel ? "text-ink2" : "text-muted"}`}>{diaCorto(d)}</span>
                  <span className="text-[17px] font-semibold">{d.getDate()}</span>
                </button>
              );
            })}
          </div>

          {fecha && horasLibres === null && <p className="text-sm text-muted">Buscando horas…</p>}
          {horasLibres !== null && horasLibres.length === 0 && <p className="text-sm text-muted">No quedan horas ese día. Prueba otro.</p>}
          {horasLibres !== null && horasLibres.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {horasLibres.map((h) => {
                const sel = horaSel === h;
                return (
                  <button
                    key={h}
                    onClick={() => setHoraSel(h)}
                    className={`h-11 rounded-[10px] text-[15px] font-medium ${sel ? "bg-brand text-white" : "border border-edge bg-surface text-white"}`}
                  >{hora(h)}</button>
                );
              })}
            </div>
          )}

          <button
            disabled={!horaSel}
            onClick={() => setPaso("confirmar")}
            className="mt-auto flex h-[54px] items-center justify-center rounded-xl bg-brand font-semibold text-white disabled:opacity-50"
          >Continuar</button>
        </>
      )}

      {/* ---------- Paso 4: confirmar ---------- */}
      {paso === "confirmar" && cat && plan && fecha && horaSel && (
        <>
          <Header volver={() => setPaso("fecha")} titulo="4 de 4" />
          <h1 className="text-2xl font-semibold">Confirma tu reserva</h1>

          <div className="flex flex-col gap-2.5 rounded-2xl bg-surface p-4 text-sm">
            <Row k="Cuándo" v={`${fechaLarga(new Date(fecha + "T00:00:00"))}, ${hora(horaSel)}`} />
            <Row k="Se repite" v={plan.descuento_pct > 0 ? plan.nombre : "Solo esta vez"} />
            <Row k="Dónde" v={condominioNombre} />
            <Row k="Vehículo" v={cat.nombre} />
            <Row k="Servicio" v="Lavado detailing completo" />
            <Row k="Premio" v={premio ? premio.nombre : "Sin premio"} />
          </div>

          <div className="flex flex-col gap-2 rounded-2xl bg-white p-4 text-carbon">
            <div className="flex justify-between text-sm"><span>Precio {cat.nombre}</span><span>{clp(cat.precio_normal)}</span></div>
            {plan.descuento_pct > 0 && <div className="flex justify-between text-sm"><span>{plan.nombre} (−{plan.descuento_pct}%)</span><span>−{clp(cat.precio_normal - precio)}</span></div>}
            <div className="flex justify-between border-t border-[#d0d0d0] pt-2.5 text-lg font-bold"><span>Total por servicio</span><span>{clp(precio)}</span></div>
            <div className="flex justify-between text-[13px] text-ink2"><span>Puntos que ganas</span><span className="font-semibold text-brand">+{cat.puntos}</span></div>
            {premio && <div className="flex justify-between text-[13px] text-ink2"><span>Premio canjeado</span><span className="font-semibold">−{premio.costo_puntos} pts</span></div>}
          </div>

          {error && <p className="text-sm text-brand-bright">{error}</p>}

          <button
            disabled={guardando}
            onClick={confirmar}
            className="mt-auto flex h-[54px] items-center justify-center rounded-xl bg-brand font-semibold text-white disabled:opacity-60"
          >{guardando ? "Confirmando…" : "Confirmar reserva"}</button>
        </>
      )}
    </main>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="grid grid-cols-[90px_1fr] gap-3">
      <span className="text-muted">{k}</span>
      <span className="font-medium text-white">{v}</span>
    </div>
  );
}
