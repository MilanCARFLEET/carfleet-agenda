export function Logo({ size = 20 }: { size?: number }) {
  return (
    <span
      style={{ fontSize: size, letterSpacing: "-0.03em" }}
      className="font-bold leading-none"
    >
      <span className="text-brand-bright">Car</span>
      <span className="text-white">Fleet</span>
    </span>
  );
}
