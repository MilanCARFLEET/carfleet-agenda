import Link from "next/link";
import { type ComponentProps } from "react";

// Botón rojo principal
export function BotonPrimario({
  className = "",
  ...props
}: ComponentProps<"button">) {
  return (
    <button
      {...props}
      className={`flex h-[54px] w-full items-center justify-center rounded-xl bg-brand text-base font-semibold text-white transition active:scale-[0.99] disabled:opacity-60 ${className}`}
    />
  );
}

// Enlace con estilo de botón rojo principal
export function EnlacePrimario({
  className = "",
  ...props
}: ComponentProps<typeof Link>) {
  return (
    <Link
      {...props}
      className={`flex h-[54px] w-full items-center justify-center rounded-xl bg-brand text-base font-semibold text-white transition active:scale-[0.99] ${className}`}
    />
  );
}

// Campo de texto con etiqueta
export function Campo({
  label,
  id,
  ...props
}: ComponentProps<"input"> & { label: string; id: string }) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-[13px] font-medium text-white">
        {label}
      </label>
      <input
        id={id}
        {...props}
        className="h-12 rounded-xl border border-edge bg-surface px-3.5 text-[15px] text-white outline-none focus:border-white"
      />
    </div>
  );
}

// Contenedor centrado tipo app móvil (funciona en celular y computador)
export function Pantalla({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-6 px-6 pb-6 pt-10">
      {children}
    </main>
  );
}
