"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/Logo";
import { BotonPrimario, Campo } from "@/components/ui";

export default function IngresarPage() {
  const router = useRouter();
  const [correo, setCorreo] = useState("");
  const [clave, setClave] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function ingresar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCargando(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: correo,
      password: clave,
    });
    setCargando(false);
    if (error) {
      setError("Correo o clave incorrectos.");
      return;
    }
    router.push("/app");
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-4 px-6 pb-6 pt-4">
      <div className="flex items-center justify-between">
        <Link href="/" aria-label="Volver" className="-ml-3 flex h-11 w-11 items-center justify-center">
          <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
        </Link>
        <Logo />
        <span className="w-16" />
      </div>

      <h1 className="mt-4 text-2xl font-semibold">Inicia sesión</h1>

      <form onSubmit={ingresar} className="flex flex-col gap-3">
        <Campo label="Correo" id="correo" type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} required />
        <Campo label="Clave" id="clave" type="password" value={clave} onChange={(e) => setClave(e.target.value)} required />
        {error && <p className="text-sm text-brand-bright">{error}</p>}
        <BotonPrimario type="submit" disabled={cargando} className="mt-2">
          {cargando ? "Entrando…" : "Entrar"}
        </BotonPrimario>
      </form>

      <Link href="/" className="mt-auto flex h-12 items-center justify-center text-sm text-white">
        No tengo cuenta · Registrarme
      </Link>
    </main>
  );
}
