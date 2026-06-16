import { Reveal } from "@/components/shared/Reveal";
import { stack } from "@/content/site";

const marqueeItems = [
  "TypeScript",
  "JavaScript",
  "Python",
  "React",
  "Next.js",
  "Node.js",
  "Three.js",
  "Django",
  "Flask",
  "Prisma",
  "PHP",
  "Dart",
  "Java",
  "Docker",
];

export function Stack() {
  return (
    <section id="stack" className="relative overflow-hidden border-t border-line py-28 md:py-40">
      {/* marquee */}
      <div className="relative mb-24 select-none border-y border-line py-6">
        <div className="marquee gap-10">
          {[...marqueeItems, ...marqueeItems].map((item, i) => (
            <span
              key={i}
              className="flex items-center gap-10 font-display text-2xl font-bold text-fg/30 md:text-4xl"
            >
              {item}
              <span className="text-orange">✦</span>
            </span>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-[var(--maxw)] px-6 md:px-10">
        <Reveal className="mb-14">
          <p className="eyebrow mb-4">04 — Ferramentas</p>
          <h2 className="font-display text-4xl font-extrabold tracking-tight text-fg md:text-6xl">
            A stack
          </h2>
        </Reveal>

        <div className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-2">
          {stack.map((group) => (
            <Reveal key={group.label} className="bg-bg p-8">
              <h3 className="mb-5 font-mono text-xs uppercase tracking-[0.2em] text-orange">
                {group.label}
              </h3>
              <ul className="flex flex-wrap gap-2">
                {group.items.map((item) => (
                  <li
                    key={item}
                    className="rounded-full border border-line bg-bg-2 px-3.5 py-1.5 text-sm text-fg-soft transition-colors hover:border-orange/50 hover:text-fg"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
