"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/Logo";
import { BotonPrimario, Campo } from "@/components/ui";

function FormularioRegistro() {
  const router = useRouter();
  const condominioId = useSearchParams().get("c");

  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [correo, setCorreo] = useState("");
  const [clave, setClave] = useState("");
  const [promos, setPromos] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function registrar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCargando(true);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email: correo,
      password: clave,
      options: {
        data: {
          nombre,
          telefono,
          condominio_id: condominioId,
          acepta_promos: promos,
        },
      },
    });
    setCargando(false);
    if (error) {
      setError(error.message);
      return;
    }
    if (data.session) {
      router.push("/app");
    } else {
      setAviso("Te enviamos un correo para confirmar tu cuenta. Revísalo y luego inicia sesión.");
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-3.5 px-6 pb-6 pt-4">
      <div className="flex items-center justify-between">
        <Link href="/" aria-label="Volver" className="-ml-3 flex h-11 w-11 items-center justify-center">
          <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
        </Link>
        <Logo />
        <span className="w-16 text-right text-[13px] text-muted">Paso 1 de 5</span>
      </div>

      <h1 className="text-2xl font-semibold">Crea tu cuenta</h1>

      <form onSubmit={registrar} className="flex flex-col gap-3">
        <Campo label="Nombre y apellido" id="nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
        <Campo label="Teléfono (WhatsApp)" id="telefono" type="tel" value={telefono} onChange={(e) => setTelefono(e.target.value)} required />
        <Campo label="Correo" id="correo" type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} required />
        <Campo label="Clave" id="clave" type="password" value={clave} onChange={(e) => setClave(e.target.value)} minLength={6} required />

        <label htmlFor="promos" className="flex min-h-11 cursor-pointer items-center gap-3 text-[13px] text-white">
          <input id="promos" type="checkbox" checked={promos} onChange={(e) => setPromos(e.target.checked)} className="h-[22px] w-[22px] shrink-0 accent-brand" />
          <span>Quiero recibir promociones de CarFleet en mi correo</span>
        </label>

        {error && <p className="text-sm text-brand-bright">{error}</p>}
        {aviso && <p className="text-sm text-muted">{aviso}</p>}

        <div className="mt-2 flex flex-col gap-2">
          <BotonPrimario type="submit" disabled={cargando}>
            {cargando ? "Creando…" : "Crear cuenta"}
          </BotonPrimario>
          <p className="text-center text-xs text-muted">
            Entras después con tu correo y tu clave.
          </p>
        </div>
      </form>
    </main>
  );
}

export default function RegistroPage() {
  return (
    <Suspense>
      <FormularioRegistro />
    </Suspense>
  );
}
