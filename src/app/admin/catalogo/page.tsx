"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { clp } from "@/lib/format";
import type { Categoria, PlanRecurrencia, Premio } from "@/lib/types";

export default function CatalogoPage() {
  const supabase = useMemo(() => createClient(), []);
  const [cats, setCats] = useState<Categoria[]>([]);
  const [planes, setPlanes] = useState<PlanRecurrencia[]>([]);
  const [premios, setPremios] = useState<Premio[]>([]);
  const [msg, setMsg] = useState("");

  async function cargar() {
    const [{ data: c }, { data: p }, { data: pr }] = await Promise.all([
      supabase.from("categorias").select("*").order("orden"),
      supabase.from("planes_recurrencia").select("*").order("orden"),
      supabase.from("premios").select("*").order("orden"),
    ]);
    setCats((c ?? []) as Categoria[]);
    setPlanes((p ?? []) as PlanRecurrencia[]);
    setPremios((pr ?? []) as Premio[]);
  }
  useEffect(() => { cargar(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function aviso(t: string) { setMsg(t); setTimeout(() => setMsg(""), 2500); }

  async function guardarPrecios() {
    for (const c of cats) {
      await supabase.from("categorias").update({ precio_normal: c.precio_normal, puntos: c.puntos }).eq("id", c.id);
    }
    aviso("Precios guardados");
  }
  async function guardarPlanes() {
    for (const p of planes) {
      await supabase.from("planes_recurrencia").update({ descuento_pct: p.descuento_pct }).eq("codigo", p.codigo);
    }
    aviso("Descuentos guardados");
  }
  async function guardarPremios() {
    for (const pr of premios) {
      await supabase.from("premios").update({ nombre: pr.nombre, costo_puntos: pr.costo_puntos, activo: pr.activo }).eq("id", pr.id);
    }
    aviso("Premios guardados");
  }
  async function agregarPremio() {
    const orden = Math.max(0, ...premios.map((p) => p.orden)) + 1;
    const { data } = await supabase.from("premios").insert({ nombre: "Nuevo premio", costo_puntos: 100, orden }).select("*").single();
    if (data) setPremios([...premios, data as Premio]);
  }
  async function borrarPremio(id: string) {
    await supabase.from("premios").delete().eq("id", id);
    setPremios(premios.filter((p) => p.id !== id));
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Precios y premios</h1>
        {msg && <span className="rounded-lg bg-carbon px-3 py-1.5 text-sm text-white">{msg}</span>}
      </div>

      <Card title="Precio por categoría" action={<Btn onClick={guardarPrecios}>Guardar precios</Btn>}>
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-[1fr_130px_90px] gap-3 text-xs font-semibold text-ink2">
            <span>Categoría</span><span>Precio (CLP)</span><span>Puntos</span>
          </div>
          {cats.map((c, i) => (
            <div key={c.id} className="grid grid-cols-[1fr_130px_90px] items-center gap-3">
              <span className="text-sm">{c.nombre}</span>
              <Num value={c.precio_normal} onChange={(v) => setCats(cats.map((x, j) => j === i ? { ...x, precio_normal: v } : x))} />
              <Num value={c.puntos} onChange={(v) => setCats(cats.map((x, j) => j === i ? { ...x, puntos: v } : x))} />
            </div>
          ))}
        </div>
      </Card>

      <Card title="Descuento por recurrencia" action={<Btn onClick={guardarPlanes}>Guardar descuentos</Btn>}>
        <div className="flex flex-col gap-2">
          {planes.map((p, i) => (
            <div key={p.codigo} className="grid grid-cols-[1fr_90px] items-center gap-3">
              <span className="text-sm">{p.nombre}</span>
              <div className="flex items-center gap-1">
                <Num value={p.descuento_pct} onChange={(v) => setPlanes(planes.map((x, j) => j === i ? { ...x, descuento_pct: v } : x))} />
                <span className="text-sm text-ink2">%</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Premios" action={<div className="flex gap-2"><Btn onClick={agregarPremio} light>+ Agregar</Btn><Btn onClick={guardarPremios}>Guardar premios</Btn></div>}>
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-[1fr_110px_70px_40px] gap-3 text-xs font-semibold text-ink2">
            <span>Premio</span><span>Puntos</span><span>Activo</span><span></span>
          </div>
          {premios.map((pr, i) => (
            <div key={pr.id} className="grid grid-cols-[1fr_110px_70px_40px] items-center gap-3">
              <input value={pr.nombre} onChange={(e) => setPremios(premios.map((x, j) => j === i ? { ...x, nombre: e.target.value } : x))}
                className="h-10 rounded-lg border border-[#c9c9c9] bg-white px-3 text-sm outline-none focus:border-carbon" />
              <Num value={pr.costo_puntos} onChange={(v) => setPremios(premios.map((x, j) => j === i ? { ...x, costo_puntos: v } : x))} />
              <input type="checkbox" checked={pr.activo} onChange={(e) => setPremios(premios.map((x, j) => j === i ? { ...x, activo: e.target.checked } : x))}
                className="h-5 w-5 accent-brand" />
              <button onClick={() => borrarPremio(pr.id)} aria-label="Borrar" className="flex h-10 w-10 items-center justify-center text-ink2 hover:text-brand">
                <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" /></svg>
              </button>
            </div>
          ))}
        </div>
      </Card>

      <p className="text-xs text-ink2">Los cambios se aplican de inmediato en la app de los clientes. Ejemplo de precio con descuento: una SUV M a {clp(40000)} con −10% queda en {clp(36000)}.</p>
    </div>
  );
}

function Num({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <input type="number" value={value} onChange={(e) => onChange(parseInt(e.target.value || "0", 10))}
      className="h-10 w-full rounded-lg border border-[#c9c9c9] bg-white px-3 text-sm tabular-nums outline-none focus:border-carbon" />
  );
}
function Btn({ children, onClick, light = false }: { children: React.ReactNode; onClick: () => void; light?: boolean }) {
  return (
    <button onClick={onClick} className={`flex h-10 items-center rounded-lg px-4 text-sm font-semibold ${light ? "border border-carbon text-carbon" : "bg-carbon text-white"}`}>{children}</button>
  );
}
function Card({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-[#d9d9d9] bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-semibold">{title}</h2>
        {action}
      </div>
      {children}
    </div>
  );
}
