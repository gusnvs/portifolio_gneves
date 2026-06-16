import type { Metadata } from "next";
import Link from "next/link";
import { Terminal } from "@/components/terminal/Terminal";
import { CustomCursor } from "@/components/shared/CustomCursor";

export const metadata: Metadata = {
  title: "Terminal",
  description: "Um terminal interativo — digite comandos ou abra o desktop retrô.",
};

export default function SystemTerminalPage() {
  return (
    <div className="flex min-h-[100svh] items-center justify-center p-0 sm:p-6">
      <CustomCursor />
      <div className="flex h-[100svh] w-full flex-col overflow-hidden border border-line bg-bg shadow-2xl sm:h-[86vh] sm:max-w-5xl sm:rounded-xl">
        {/* window chrome */}
        <div className="flex items-center justify-between border-b border-line bg-bg-2 px-4 py-2.5">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-[#ff5f56]" />
            <span className="h-3 w-3 rounded-full bg-[#ffbd2e]" />
            <span className="h-3 w-3 rounded-full bg-[#27c93f]" />
          </div>
          <p className="font-mono text-[11px] uppercase tracking-wider text-muted">
            visitante@gneves : ~ — gneves-terminal
          </p>
          <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-wider">
            <Link href="/" className="text-muted hover:text-fg" data-cursor-text="início">
              sair
            </Link>
            <Link
              href="/system/desktop"
              className="rounded border border-orange/60 px-2 py-0.5 text-orange hover:bg-orange hover:text-[#120a04]"
              data-cursor-text="boot"
            >
              gui ▸
            </Link>
          </div>
        </div>

        {/* terminal body */}
        <div className="min-h-0 flex-1">
          <Terminal />
        </div>
      </div>
    </div>
  );
}
