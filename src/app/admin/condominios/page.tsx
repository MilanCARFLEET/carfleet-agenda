"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Condominio = { id: string; nombre: string; comuna: string | null; activo: boolean };
type Equipo = {
  id: string; condominio_id: string; nombre: string; dias: number[];
  hora_inicio: string; hora_fin: string; duracion_min: number; intervalo_min: number; activo: boolean;
};

const DIAS = [["Dom", 0], ["Lun", 1], ["Mar", 2], ["Mié", 3], ["Jue", 4], ["Vie", 5], ["Sáb", 6]] as const;

export default function CondominiosPage() {
  const supabase = useMemo(() => createClient(), []);
  const [condominios, setCondominios] = useState<Condominio[]>([]);
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevaComuna, setNuevaComuna] = useState("");
  const [msg, setMsg] = useState("");

  async function cargar() {
    const [{ data: c }, { data: e }] = await Promise.all([
      supabase.from("condominios").select("*").order("nombre"),
      supabase.from("equipos").select("*").order("created_at"),
    ]);
    setCondominios((c ?? []) as Condominio[]);
    setEquipos((e ?? []) as Equipo[]);
  }
  useEffect(() => { cargar(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  function aviso(t: string) { setMsg(t); setTimeout(() => setMsg(""), 2500); }

  async function agregarCondominio() {
    if (!nuevoNombre.trim()) return;
    await supabase.from("condominios").insert({ nombre: nuevoNombre.trim(), comuna: nuevaComuna.trim() || null });
    setNuevoNombre(""); setNuevaComuna("");
    aviso("Condominio agregado");
    cargar();
  }
  async function toggleCondominio(c: Condominio) {
    await supabase.from("condominios").update({ activo: !c.activo }).eq("id", c.id);
    cargar();
  }
  async function agregarEquipo(condominioId: string) {
    await supabase.from("equipos").insert({ condominio_id: condominioId, nombre: "Equipo " + (equipos.filter((e) => e.condominio_id === condominioId).length + 1) });
    aviso("Equipo agregado");
    cargar();
  }
  async function guardarEquipo(e: Equipo) {
    await supabase.from("equipos").update({
      nombre: e.nombre, dias: e.dias, hora_inicio: e.hora_inicio, hora_fin: e.hora_fin,
      duracion_min: e.duracion_min, intervalo_min: e.intervalo_min, activo: e.activo,
    }).eq("id", e.id);
    aviso("Equipo guardado");
  }
  function setEq(id: string, patch: Partial<Equipo>) {
    setEquipos(equipos.map((e) => e.id === id ? { ...e, ...patch } : e));
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Condominios y equipos</h1>
        {msg && <span className="rounded-lg bg-carbon px-3 py-1.5 text-sm text-white">{msg}</span>}
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-[#d9d9d9] bg-white p-5">
        <h2 className="text-base font-semibold">Agregar condominio</h2>
        <div className="flex flex-wrap gap-2">
          <input placeholder="Nombre" value={nuevoNombre} onChange={(e) => setNuevoNombre(e.target.value)}
            className="h-10 flex-1 rounded-lg border border-[#c9c9c9] px-3 text-sm outline-none focus:border-carbon" />
          <input placeholder="Comuna" value={nuevaComuna} onChange={(e) => setNuevaComuna(e.target.value)}
            className="h-10 flex-1 rounded-lg border border-[#c9c9c9] px-3 text-sm outline-none focus:border-carbon" />
          <button onClick={agregarCondominio} className="h-10 rounded-lg bg-carbon px-4 text-sm font-semibold text-white">Agregar</button>
        </div>
      </div>

      {condominios.map((c) => (
        <div key={c.id} className="flex flex-col gap-4 rounded-xl border border-[#d9d9d9] bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold">{c.nombre}</h2>
              <span className="text-xs text-ink2">{c.comuna}</span>
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={c.activo} onChange={() => toggleCondominio(c)} className="h-5 w-5 accent-brand" /> Activo</label>
              <button onClick={() => agregarEquipo(c.id)} className="h-10 rounded-lg border border-carbon px-3 text-sm font-semibold">+ Equipo</button>
            </div>
          </div>

          {equipos.filter((e) => e.condominio_id === c.id).map((e) => (
            <div key={e.id} className="flex flex-col gap-3 rounded-lg border border-[#e3e3e3] bg-[#fafafa] p-4">
              <div className="flex flex-wrap items-center gap-2">
                <input value={e.nombre} onChange={(ev) => setEq(e.id, { nombre: ev.target.value })}
                  className="h-9 rounded-lg border border-[#c9c9c9] bg-white px-3 text-sm font-semibold outline-none focus:border-carbon" />
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={e.activo} onChange={(ev) => setEq(e.id, { activo: ev.target.checked })} className="h-4 w-4 accent-brand" /> Activo</label>
              </div>
              <div className="flex flex-wrap gap-1">
                {DIAS.map(([lbl, n]) => {
                  const on = e.dias?.includes(n);
                  return (
                    <button key={n} onClick={() => setEq(e.id, { dias: on ? e.dias.filter((d) => d !== n) : [...e.dias, n].sort() })}
                      className={`h-9 w-11 rounded-lg text-xs font-semibold ${on ? "bg-carbon text-white" : "border border-[#c9c9c9] bg-white text-ink2"}`}>{lbl}</button>
                  );
                })}
              </div>
              <div className="flex flex-wrap items-end gap-3 text-xs text-ink2">
                <Field label="Primer inicio"><TimeIn value={e.hora_inicio} onChange={(v) => setEq(e.id, { hora_inicio: v })} /></Field>
                <Field label="Último inicio"><TimeIn value={e.hora_fin} onChange={(v) => setEq(e.id, { hora_fin: v })} /></Field>
                <Field label="Duración (min)"><NumIn value={e.duracion_min} onChange={(v) => setEq(e.id, { duracion_min: v })} /></Field>
                <Field label="Cada (min)"><NumIn value={e.intervalo_min} onChange={(v) => setEq(e.id, { intervalo_min: v })} /></Field>
                <button onClick={() => guardarEquipo(e)} className="h-9 rounded-lg bg-carbon px-4 text-sm font-semibold text-white">Guardar</button>
              </div>
            </div>
          ))}
          {equipos.filter((e) => e.condominio_id === c.id).length === 0 && <p className="text-sm text-ink2">Sin equipos. Agrega uno para habilitar la agenda.</p>}
        </div>
      ))}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="flex flex-col gap-1"><span>{label}</span>{children}</div>;
}
function TimeIn({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return <input type="time" value={value?.slice(0, 5)} onChange={(e) => onChange(e.target.value)} className="h-9 rounded-lg border border-[#c9c9c9] bg-white px-2 text-sm outline-none focus:border-carbon" />;
}
function NumIn({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return <input type="number" value={value} onChange={(e) => onChange(parseInt(e.target.value || "0", 10))} className="h-9 w-20 rounded-lg border border-[#c9c9c9] bg-white px-2 text-sm tabular-nums outline-none focus:border-carbon" />;
}
