"use client";

import Link from "next/link";

export function Header() {
  return (
    <header
      className="fixed inset-x-0 top-0 z-40 flex items-center justify-between px-6 py-5 md:px-10"
      style={{ color: "var(--mania-ink, #161310)" }}
    >
      <Link
        href="/"
        className="font-display text-lg font-extrabold lowercase leading-[0.9]"
      >
        gustavo
        <br />
        neves
      </Link>
      <Link href="/system" className="mania-pill mania-pill--small pointer-events-auto">
        terminal
      </Link>
    </header>
  );
}
