import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/Logo";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/ingresar");

  const { data: cliente } = await supabase
    .from("clientes")
    .select("rol, nombre")
    .eq("id", user.id)
    .single();

  if (cliente?.rol !== "admin") redirect("/app");

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col gap-4 px-6 py-6">
      <div className="flex items-center gap-4">
        <Logo size={22} />
        <span className="text-sm text-muted">Panel de administrador</span>
      </div>
      <h1 className="text-2xl font-semibold">Resumen del negocio</h1>
      <p className="text-muted">
        El panel con métricas, tabla de clientes y edición de precios/premios se
        construye en el siguiente paso.
      </p>
    </main>
  );
}
