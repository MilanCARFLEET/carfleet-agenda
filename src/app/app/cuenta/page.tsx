"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/Logo";
import { BottomNav } from "@/components/BottomNav";

export default function CuentaPage() {
  const router = useRouter();

  async function salir() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-4 px-6 pb-0 pt-4">
      <div className="flex items-center justify-between">
        <Link href="/app" aria-label="Volver" className="-ml-3 flex h-11 w-11 items-center justify-center">
          <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
        </Link>
        <Logo />
        <span className="w-11" />
      </div>

      <h1 className="mt-4 text-2xl font-semibold">Mi cuenta</h1>

      <button
        onClick={salir}
        className="flex h-12 w-full items-center justify-center rounded-xl border border-edge text-sm font-semibold text-white"
      >
        Cerrar sesión
      </button>

      <BottomNav activo="/app/cuenta" />
    </main>
  );
}
