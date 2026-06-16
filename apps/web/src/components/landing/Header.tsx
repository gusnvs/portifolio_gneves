"use client";

import Link from "next/link";
import { navSections } from "@/content/site";

export function Header() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 mix-blend-difference">
      <div className="mx-auto flex max-w-[var(--maxw)] items-center justify-between px-6 py-5 md:px-10">
        <a href="#intro" className="group flex items-center gap-2" data-cursor-text="top">
          <span className="grid h-8 w-8 place-items-center rounded-md border border-white/30 font-display text-sm font-extrabold text-white">
            GN
          </span>
          <span className="hidden font-mono text-xs uppercase tracking-[0.2em] text-white sm:inline">
            gustavo&nbsp;neves
          </span>
        </a>

        <nav className="hidden items-center gap-7 md:flex">
          {navSections.slice(1, 5).map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="link-underline font-mono text-xs uppercase tracking-[0.18em] text-white/80 hover:text-white"
            >
              <span className="text-white/40">{s.index}</span> {s.label}
            </a>
          ))}
        </nav>

        <Link
          href="/system"
          data-cursor-text="boot"
          className="flex items-center gap-2 rounded-full border border-white/40 px-4 py-2 font-mono text-xs uppercase tracking-[0.18em] text-white transition-colors hover:bg-white hover:text-black"
        >
          sistema<span className="animate-pulse">_</span>
        </Link>
      </div>
    </header>
  );
}
