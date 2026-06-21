export function Sekce({
  titulek, children, badge,
}: { titulek: string; children: React.ReactNode; badge?: { text: string; tone: "green" | "zinc" } }) {
  return (
    <section className="mb-6 rounded-2xl border border-border bg-panel p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-900">{titulek}</h2>
        {badge && (
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
              badge.tone === "green" ? "bg-accent/15 text-accent" : "bg-slate-200 text-slate-500"
            }`}
          >
            {badge.text}
          </span>
        )}
      </div>
      {children}
    </section>
  );
}

export function Pole({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs text-slate-500">{label}</label>
      {children}
    </div>
  );
}

export const input =
  "w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-accent2 focus:ring-2";
