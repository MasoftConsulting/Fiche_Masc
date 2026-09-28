export default function ChargementFiches() {
  return (
    <div className="space-y-12 pt-8 md:pt-14">
      <div className="h-24 w-2/3 animate-pulse rounded-2xl bg-ink/[0.06]" />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
        {[5, 3, 2, 2].map((span, i) => (
          <div
            key={i}
            className={`h-32 animate-pulse rounded-[1.6rem] bg-ink/[0.06] md:col-span-${span}`}
            style={{ gridColumn: `span ${span} / span ${span}` }}
          />
        ))}
      </div>

      <div className="h-24 animate-pulse rounded-[1.75rem] bg-ink/[0.06]" />

      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="h-28 animate-pulse rounded-[1.6rem] bg-ink/[0.06]"
          />
        ))}
      </div>
    </div>
  );
}