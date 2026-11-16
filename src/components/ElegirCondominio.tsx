"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Condominio } from "@/lib/types";

export function ElegirCondominio({ condominios }: { condominios: Condominio[] }) {
  const router = useRouter();
  const [sel, setSel] = useState<string | null>(
    condominios.length === 1 ? condominios[0].id : null
  );

  return (
    <>
      <div className="flex flex-col gap-2.5">
        <h2 className="text-base font-semibold">¿En qué condominio vives?</h2>

        {condominios.length === 0 && (
          <p className="rounded-xl border border-edge bg-surface p-4 text-sm text-muted">
            Aún no hay condominios disponibles. Escríbenos por WhatsApp para
            sumar el tuyo.
          </p>
        )}

        {condominios.map((c) => {
          const activo = sel === c.id;
          return (
            <button
              key={c.id}
              type="button"
              aria-pressed={activo}
              onClick={() => setSel(c.id)}
              className={`flex min-h-16 items-center justify-between gap-3 rounded-2xl px-4 text-left transition ${
                activo
                  ? "border-2 border-brand bg-white text-carbon"
                  : "border border-edge bg-surface text-white"
              }`}
            >
              <span className="flex flex-col gap-0.5">
                <span className="text-base font-semibold">{c.nombre}</span>
                <span
                  className={`text-[13px] ${activo ? "text-ink2" : "text-muted"}`}
                >
                  {c.comuna}
                </span>
              </span>
              {activo && (
                <svg
                  aria-hidden="true"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#d91f2b"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12.5l4.5 4.5L19 7.5" />
                </svg>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-auto flex flex-col gap-1.5">
        <button
          type="button"
          disabled={!sel}
          onClick={() => router.push(`/registro?c=${sel}`)}
          className="flex h-[54px] w-full items-center justify-center rounded-xl bg-brand text-base font-semibold text-white transition active:scale-[0.99] disabled:opacity-50"
        >
          Continuar
        </button>
        <Link
          href="/ingresar"
          className="flex h-12 items-center justify-center text-sm text-white"
        >
          Ya tengo cuenta · Iniciar sesión
        </Link>
      </div>
    </>
  );
}
