import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

async function AdminNav() {
  return (
    <header className="flex flex-wrap items-center gap-x-6 gap-y-2 bg-carbon px-6 py-3.5 text-white">
      <span className="text-[22px] font-bold tracking-tight">
        <span className="text-brand-bright">Car</span><span className="text-white">Fleet</span>
      </span>
      <nav className="flex flex-1 flex-wrap gap-1">
        <AdminLink href="/admin" label="Resumen" />
        <AdminLink href="/admin/catalogo" label="Precios y premios" />
        <AdminLink href="/admin/condominios" label="Condominios" />
      </nav>
      <span className="text-[13px] text-[#d0d0d0]">Administrador</span>
    </header>
  );
}

function AdminLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="flex min-h-11 items-center rounded-lg px-3.5 text-sm text-[#d0d0d0] hover:bg-white/10">
      {label}
    </Link>
  );
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/ingresar");

  const { data: cliente } = await supabase
    .from("clientes").select("rol").eq("id", user.id).single();
  if (cliente?.rol !== "admin") redirect("/app");

  return (
    <div className="min-h-dvh bg-[#efefef] text-carbon">
      <AdminNav />
      <div className="mx-auto max-w-6xl px-6 py-6">{children}</div>
    </div>
  );
}
