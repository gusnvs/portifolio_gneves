import { Reveal } from "@/components/shared/Reveal";
import { MascotVideo } from "@/components/shared/MascotVideo";
import { profile } from "@/content/site";

const stats = [
  { value: "10+", label: "Anos entregando" },
  { value: "40+", label: "Projetos lançados" },
  { value: "3", label: "Prêmios de design" },
  { value: "∞", label: "Xícaras de café" },
];

export function About() {
  return (
    <section id="about" className="relative border-t border-line px-6 py-28 md:px-10 md:py-40">
      <div className="mx-auto grid max-w-[var(--maxw)] gap-16 lg:grid-cols-[1fr_0.8fr]">
        <div>
          <Reveal>
            <p className="eyebrow mb-8">02 — Sobre</p>
          </Reveal>
          <Reveal>
            <p className="font-display text-3xl font-semibold leading-[1.15] tracking-tight text-fg md:text-5xl">
              Eu trato o navegador como um{" "}
              <span className="text-orange">meio criativo</span> — construindo
              interfaces que parecem menos software e mais{" "}
              <span className="text-orange">brinquedos dos quais você não larga</span>.
            </p>
          </Reveal>
          <Reveal>
            <p className="mt-8 max-w-xl text-lg leading-relaxed text-muted">{profile.longBio}</p>
          </Reveal>

          <Reveal>
            <dl className="mt-14 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-4">
              {stats.map((s) => (
                <div key={s.label} className="bg-bg p-5">
                  <dt className="font-display text-3xl font-extrabold text-fg md:text-4xl">
                    {s.value}
                  </dt>
                  <dd className="mt-1 font-mono text-[11px] uppercase tracking-wider text-faint">
                    {s.label}
                  </dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>

        <Reveal className="relative flex items-center justify-center">
          <div className="relative aspect-square w-full max-w-sm">
            <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(255,106,26,0.18),transparent_65%)] blur-2xl" />
            <MascotVideo
              src="/videos/mascot-loop.mp4"
              className="absolute inset-0 drop-shadow-[0_20px_50px_rgba(255,106,26,0.2)]"
            />
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full border border-line bg-bg-2 px-4 py-1.5 font-mono text-[10px] uppercase tracking-wider text-muted">
              {profile.location} · {profile.timezone}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
