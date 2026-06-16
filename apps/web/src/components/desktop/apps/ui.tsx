/** Small retro UI primitives shared across desktop apps. */

export function AppScroll({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`h-full overflow-y-auto bg-[#f5f1e9] p-4 font-system text-[13px] text-[#161616] ${className}`}>
      {children}
    </div>
  );
}

export function AppHeading({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div className="mb-3 border-b-2 border-[#161616] pb-2">
      <h2 className="font-display text-xl font-extrabold leading-none text-[#161616]">{children}</h2>
      {sub && <p className="mt-1 text-xs text-[#5a564d]">{sub}</p>}
    </div>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-2">
      <span className="w-24 shrink-0 font-bold text-[#7a2c05]">{label}</span>
      <span className="min-w-0">{children}</span>
    </div>
  );
}

export function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block border border-[#161616] bg-white px-2 py-0.5 text-xs">
      {children}
    </span>
  );
}
