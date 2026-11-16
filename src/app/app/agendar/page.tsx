import Link from "next/link";
import { Logo } from "@/components/Logo";

export const dynamic = "force-dynamic";

// En construcción: el flujo de agendamiento (categoría → servicio y recurrencia →
// día y hora → confirmar) se arma en el siguiente paso del desarrollo.
export default function AgendarPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-4 px-6 pb-6 pt-4">
      <div className="flex items-center justify-between">
        <Link href="/app" aria-label="Volver" className="-ml-3 flex h-11 w-11 items-center justify-center">
          <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
        </Link>
        <Logo />
        <span className="w-11" />
      </div>
      <h1 className="mt-6 text-2xl font-semibold">Agendar</h1>
      <p className="text-muted">
        El flujo de reserva (categoría, recurrencia, día y hora) está en
        construcción.
      </p>
    </main>
  );
}
