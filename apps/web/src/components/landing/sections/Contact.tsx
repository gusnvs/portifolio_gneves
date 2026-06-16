import Link from "next/link";
import { Reveal } from "@/components/shared/Reveal";
import { profile, socials } from "@/content/site";

export function Contact() {
  return (
    <footer id="contact" className="relative border-t border-line px-6 pt-28 md:px-10 md:pt-40">
      <div className="mx-auto max-w-[var(--maxw)]">
        <Reveal>
          <p className="eyebrow mb-6">05 — Contato</p>
        </Reveal>
        <Reveal>
          <h2 className="font-display text-[13vw] font-extrabold leading-[0.9] tracking-tighter text-fg md:text-[9vw]">
            Vamos construir
            <br />
            <span className="text-orange">algo diferente.</span>
          </h2>
        </Reveal>

        <div className="mt-16 grid gap-12 border-t border-line pt-12 md:grid-cols-[1fr_auto]">
          <Reveal>
            <p className="mb-3 font-mono text-xs uppercase tracking-wider text-faint">Manda um oi</p>
            <a
              href={`mailto:${profile.email}`}
              data-cursor-text="email"
              className="link-underline font-display text-2xl font-bold text-fg md:text-4xl"
            >
              {profile.email}
            </a>
            <p className="mt-6 max-w-md text-muted">
              Quer me enviar um arquivo com segurança? Abra o{" "}
              <Link href="/system" className="text-orange link-underline">
                sistema
              </Link>{" "}
              e use o envio criptografado.
            </p>
          </Reveal>

          <Reveal>
            <p className="mb-4 font-mono text-xs uppercase tracking-wider text-faint">
              Em outros lugares
            </p>
            <ul className="space-y-2">
              {socials.map((s) => (
                <li key={s.label}>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noreferrer"
                    className="group flex items-center justify-between gap-10 border-b border-line py-2 transition-colors hover:text-orange"
                  >
                    <span className="font-mono text-sm uppercase tracking-wide">{s.label}</span>
                    <span className="text-sm text-muted transition-colors group-hover:text-orange">
                      {s.handle}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>

        <div className="mt-24 flex flex-col items-center justify-between gap-4 border-t border-line py-8 md:flex-row">
          <p className="font-mono text-[11px] uppercase tracking-wider text-faint">
            © {new Date().getFullYear()} {profile.name} — feito do zero
          </p>
          <p className="font-mono text-[11px] uppercase tracking-wider text-faint">
            digite <span className="text-orange">gui</span> para o desktop · v1.0
          </p>
        </div>
      </div>
    </footer>
  );
}
