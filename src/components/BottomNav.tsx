import Link from "next/link";

const items = [
  { href: "/app", label: "Inicio", icon: "M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" },
  { href: "/app/agendar", label: "Agendar", icon: "M3 10h18M8 3v4M16 3v4", rect: true },
  { href: "/app/premios", label: "Premios", icon: "M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" },
  { href: "/app/cuenta", label: "Cuenta", icon: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c0-4 4-6 8-6s8 2 8 6", circle: true },
];

export function BottomNav({ activo }: { activo: string }) {
  return (
    <nav
      aria-label="Secciones"
      className="sticky bottom-0 -mx-6 mt-auto grid grid-cols-4 border-t border-line bg-surface px-2 pb-3 pt-2"
    >
      {items.map((it) => {
        const on = it.href === activo;
        return (
          <Link
            key={it.href}
            href={it.href}
            className={`flex min-h-12 flex-col items-center justify-center gap-1 text-[11px] ${
              on ? "font-semibold text-white" : "text-muted"
            }`}
          >
            <svg
              aria-hidden="true"
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke={on ? "#ef2b2d" : "currentColor"}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {it.rect && <rect x="3" y="5" width="18" height="16" rx="2" />}
              {it.circle && <circle cx="12" cy="8" r="4" />}
              <path d={it.icon} />
            </svg>
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
