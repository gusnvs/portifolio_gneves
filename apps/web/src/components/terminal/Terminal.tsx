"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BANNER, commandNames, runCommand, type CommandContext } from "@/lib/commands";
import { TypeOut } from "./TypeOut";

type Entry = { id: number; content: React.ReactNode };

let uid = 0;
const nextId = () => ++uid;

const PROMPT = (
  <span className="select-none">
    <span className="text-orange">visitante</span>
    <span className="text-[var(--muted)]">@gneves</span>
    <span className="text-[var(--fg)]">:</span>
    <span className="text-[var(--orange-bright)]">~</span>
    <span className="text-[var(--fg)]">$ </span>
  </span>
);

export function Terminal({
  embedded = false,
  onOpenApp,
}: {
  embedded?: boolean;
  onOpenApp?: (appId: string) => void;
}) {
  const router = useRouter();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [histIndex, setHistIndex] = useState(-1);
  const [booting, setBooting] = useState(true);
  const [typing, setTyping] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const skipRef = useRef(false);

  const push = useCallback((content: React.ReactNode) => {
    setEntries((e) => [...e, { id: nextId(), content }]);
  }, []);

  const scrollToBottom = useCallback(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  const ctx: CommandContext = {
    navigate: (path) => {
      if (path.startsWith("/")) router.push(path);
    },
    openApp: onOpenApp,
    clear: () => setEntries([]),
    setInput,
  };

  /* boot sequence */
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const lines: React.ReactNode[] = [
      <pre key="b" className="text-orange leading-tight">
        {BANNER}
      </pre>,
      <TypeOut key="v" onUpdate={scrollToBottom}>
        <span className="text-[var(--muted)]">Terminal GnevesOS — v1.0.0 (gustavo neves)</span>
      </TypeOut>,
      <TypeOut key="w" onUpdate={scrollToBottom}>
        <span className="text-[var(--fg-soft)]">Bem-vindo. Você está dentro do sistema.</span>
      </TypeOut>,
      <TypeOut key="h" onUpdate={scrollToBottom}>
        <span className="text-[var(--fg-soft)]">
          Digite <span className="text-orange">ajuda</span> para ver os comandos, ou{" "}
          <span className="text-orange">gui</span> para abrir o desktop.
        </span>
      </TypeOut>,
    ];
    let i = 0;
    let cancelled = false;
    const step = () => {
      if (cancelled) return;
      if (i < lines.length) {
        push(lines[i]);
        i++;
        setTimeout(step, reduce ? 0 : 360);
      } else {
        setBooting(false);
        inputRef.current?.focus();
      }
    };
    step();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* keep scrolled to bottom as entries change */
  useEffect(() => {
    scrollToBottom();
  }, [entries, scrollToBottom]);

  const submit = useCallback(
    async (raw: string) => {
      push(
        <div className="flex gap-1">
          {PROMPT}
          <span className="text-[var(--fg)]">{raw}</span>
        </div>,
      );
      if (raw.trim()) setHistory((h) => [...h, raw]);
      setHistIndex(-1);

      const result = await runCommand(raw, ctx);
      if (result.output) {
        setTyping(true);
        skipRef.current = false;
        push(
          <TypeOut
            skipRef={skipRef}
            onUpdate={scrollToBottom}
            onDone={() => {
              setTyping(false);
              skipRef.current = false;
            }}
          >
            <div className="pb-1">{result.output}</div>
          </TypeOut>,
        );
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ctx, push, scrollToBottom],
  );

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (booting) return;

    // While output is typing, Enter fast-forwards instead of submitting.
    if (typing) {
      if (e.key === "Enter") {
        e.preventDefault();
        skipRef.current = true;
      }
      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();
      const raw = input;
      setInput("");
      submit(raw);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!history.length) return;
      const idx = histIndex === -1 ? history.length - 1 : Math.max(0, histIndex - 1);
      setHistIndex(idx);
      setInput(history[idx]);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (histIndex === -1) return;
      const idx = histIndex + 1;
      if (idx >= history.length) {
        setHistIndex(-1);
        setInput("");
      } else {
        setHistIndex(idx);
        setInput(history[idx]);
      }
    } else if (e.key === "Tab") {
      e.preventDefault();
      const matches = commandNames.filter((c) => c.startsWith(input.trim()));
      if (matches.length === 1) {
        setInput(matches[0] + " ");
      } else if (matches.length > 1 && input.trim()) {
        push(
          <div className="flex flex-wrap gap-x-4 text-[var(--muted)]">
            {matches.map((m) => (
              <span key={m}>{m}</span>
            ))}
          </div>,
        );
      }
    } else if (e.key === "l" && e.ctrlKey) {
      e.preventDefault();
      setEntries([]);
    }
  };

  return (
    <div
      className={`scanlines flex h-full w-full flex-col font-mono text-[13px] leading-relaxed text-[var(--fg)] sm:text-sm ${
        embedded ? "" : "bg-bg"
      }`}
      onClick={() => inputRef.current?.focus()}
    >
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 md:px-6">
        <div className="space-y-1">
          {entries.map((e) => (
            <div key={e.id}>{e.content}</div>
          ))}

          {!booting && (
            <div className={`flex items-center gap-1 ${typing ? "opacity-50" : ""}`}>
              {PROMPT}
              <div className="relative flex-1">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={onKeyDown}
                  autoFocus
                  spellCheck={false}
                  autoComplete="off"
                  autoCapitalize="off"
                  aria-label="terminal input"
                  className="w-full border-none bg-transparent text-[var(--fg)] caret-orange outline-none"
                />
              </div>
            </div>
          )}
          {booting && (
            <span className="inline-block h-4 w-2.5 animate-pulse bg-orange align-middle" />
          )}
        </div>
      </div>
    </div>
  );
}
