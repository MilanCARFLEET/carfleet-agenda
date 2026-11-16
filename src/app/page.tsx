import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/Logo";
import { ElegirCondominio } from "@/components/ElegirCondominio";
import type { Condominio } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function Inicio() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("condominios")
    .select("id, nombre, comuna, activo")
    .eq("activo", true)
    .order("nombre");

  const condominios = (data ?? []) as Condominio[];

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-7 px-6 pb-6 pt-14">
      <div className="flex flex-col gap-3.5">
        <Logo size={44} />
        <div className="h-1 w-14 bg-brand" />
        <h1 className="text-[26px] font-semibold leading-tight text-balance">
          Agenda tu lavado detailing sin salir de casa
        </h1>
        <p className="text-[15px] leading-relaxed text-muted">
          Elige día y hora, conoce tu precio exacto y suma puntos en cada
          servicio.
        </p>
      </div>

      <ElegirCondominio condominios={condominios} />
    </main>
  );
}
