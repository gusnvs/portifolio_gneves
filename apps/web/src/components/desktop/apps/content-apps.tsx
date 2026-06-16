"use client";

import Image from "next/image";
import { profile, projects, stack, socials, experience, education } from "@/content/site";
import { AppScroll, AppHeading, Field, Pill } from "./ui";
import { TechLogo } from "./TechLogo";

export function AboutApp() {
  return (
    <AppScroll>
      <div className="flex gap-4">
        <div className="relative h-24 w-24 shrink-0 border border-[#161616] bg-white">
          <Image src="/mascote.png" alt="mascote" fill className="object-contain p-1" />
        </div>
        <div className="min-w-0">
          <h2 className="font-display text-2xl font-extrabold leading-none">{profile.name}</h2>
          <p className="text-[#5a564d]">{profile.role}</p>
          <p className="mt-1 text-xs text-[#7a2c05]">{profile.availableLabel}</p>
        </div>
      </div>
      <div className="mt-4 space-y-1">
        <Field label="Mora em">
          {profile.location} · {profile.timezone}
        </Field>
        <Field label="Experiência">{profile.years}+ anos</Field>
        <Field label="Email">
          <a href={`mailto:${profile.email}`} className="text-[#7a2c05] underline">
            {profile.email}
          </a>
        </Field>
      </div>
      <p className="mt-4 leading-relaxed">{profile.longBio}</p>
      <div className="mt-4 inset p-3 text-xs leading-relaxed text-[#3a372f]">
        <strong>readme.txt</strong> — Dica: abra o Terminal e digite <code>ajuda</code>. Ou me envie
        um arquivo criptografado com <strong>Enviar Arquivo</strong>.
      </div>
    </AppScroll>
  );
}

export function ProjectsApp() {
  return (
    <AppScroll>
      <AppHeading sub={`${projects.length} projetos selecionados`}>Projetos</AppHeading>
      <div className="space-y-3">
        {projects.map((p, i) => (
          <div key={p.slug} className="inset p-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="font-display text-lg font-extrabold" style={{ color: "#161616" }}>
                <span className="mr-2 text-[#9a958a]">{String(i + 1).padStart(2, "0")}</span>
                {p.title}
              </h3>
              <span className="text-xs text-[#5a564d]">
                {p.role} · {p.year}
              </span>
            </div>
            <p className="mt-1 leading-relaxed">{p.description}</p>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {p.tags.map((t) => (
                <Pill key={t}>{t}</Pill>
              ))}
              {(p.link || p.repo) && (
                <a
                  href={p.link ?? p.repo}
                  target="_blank"
                  rel="noreferrer"
                  className="ml-auto text-xs font-bold text-[#7a2c05] underline"
                >
                  abrir ↗
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </AppScroll>
  );
}

export function StackApp() {
  return (
    <AppScroll>
      <AppHeading sub="linguagens, frameworks e ferramentas">Stack</AppHeading>
      <div className="space-y-3">
        {stack.map((g) => (
          <div key={g.label}>
            <p className="mb-1.5 font-bold text-[#7a2c05]">{g.label}</p>
            <div className="flex flex-wrap gap-1.5">
              {g.items.map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center gap-2 rounded-full border border-[#161616] bg-white px-2.5 py-1 text-xs"
                >
                  <TechLogo name={item} size={16} />
                  {item}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </AppScroll>
  );
}

export function SocialApp() {
  return (
    <AppScroll>
      <AppHeading sub="me encontre pela web">Social</AppHeading>
      <ul className="space-y-1.5">
        {socials.map((s) => (
          <li key={s.label}>
            <a
              href={s.url}
              target="_blank"
              rel="noreferrer"
              className="inset flex items-center justify-between gap-3 p-2.5 hover:bg-white"
            >
              <span className="font-bold">{s.label}</span>
              <span className="text-[#7a2c05]">{s.handle} ↗</span>
            </a>
          </li>
        ))}
      </ul>
    </AppScroll>
  );
}

export function ResumeApp() {
  return (
    <AppScroll>
      <div className="mb-3 flex items-center justify-between border-b-2 border-[#161616] pb-2">
        <div>
          <h2 className="font-display text-xl font-extrabold leading-none">{profile.name}</h2>
          <p className="text-xs text-[#5a564d]">{profile.role}</p>
        </div>
        <a href="/resume.pdf" className="btn-95" download>
          ⬇ Baixar PDF
        </a>
      </div>

      <p className="mb-4 leading-relaxed">{profile.bio}</p>

      <p className="mb-1 font-bold text-[#7a2c05]">Experiência</p>
      <div className="space-y-2">
        {experience.map((e) => (
          <div key={e.company} className="inset p-2.5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <strong>
                {e.role} <span className="font-normal text-[#5a564d]">@ {e.company}</span>
              </strong>
              <span className="text-xs text-[#5a564d]">{e.period}</span>
            </div>
            <p className="mt-1 text-[#3a372f]">{e.summary}</p>
          </div>
        ))}
      </div>

      <p className="mb-1 mt-4 font-bold text-[#7a2c05]">Formação</p>
      {education.map((ed) => (
        <div key={ed.school} className="inset p-2.5">
          <strong>{ed.degree}</strong> — {ed.school}{" "}
          <span className="text-xs text-[#5a564d]">({ed.period})</span>
        </div>
      ))}
    </AppScroll>
  );
}
