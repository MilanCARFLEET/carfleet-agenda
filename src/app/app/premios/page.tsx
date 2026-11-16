import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/Logo";
import { BottomNav } from "@/components/BottomNav";
import type { Premio } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function PremiosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: puntos } = await supabase.rpc("puntos_cliente", {
    p_cliente: user!.id,
  });
  const saldo = (puntos as number) ?? 0;

  const { data } = await supabase
    .from("premios")
    .select("id, nombre, costo_puntos, orden, activo")
    .eq("activo", true)
    .order("orden");
  const premios = (data ?? []) as Premio[];

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-2.5 px-6 pb-0 pt-4">
      <div className="flex items-center justify-between">
        <Logo size={22} />
        <span className="w-11" />
      </div>

      <div className="flex flex-col gap-1 rounded-2xl bg-white p-4 text-carbon">
        <div className="text-xs font-semibold uppercase tracking-wide text-ink2">
          Tus puntos
        </div>
        <div className="text-[34px] font-bold leading-none text-brand">{saldo}</div>
        <div className="text-[13px] text-ink2">
          Ganas 1 punto por cada $1.000 del precio normal. El premio se realiza en
          el servicio que agendes, que se cobra normal.
        </div>
      </div>

      <div className="flex flex-col">
        {premios.map((p) => {
          const alcanza = saldo >= p.costo_puntos;
          return (
            <div
              key={p.id}
              className="flex items-center justify-between gap-3 border-b border-line py-3 last:border-0"
            >
              <span>
                <span className="block text-sm font-semibold">{p.nombre}</span>
                <span className="text-xs text-muted">{p.costo_puntos} puntos</span>
              </span>
              {alcanza ? (
                <span className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white">
                  Disponible
                </span>
              ) : (
                <span className="whitespace-nowrap text-[13px] text-muted">
                  Te faltan {p.costo_puntos - saldo}
                </span>
              )}
            </div>
          );
        })}
      </div>

      <BottomNav activo="/app/premios" />
    </main>
  );
}
