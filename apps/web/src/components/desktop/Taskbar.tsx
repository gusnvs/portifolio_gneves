"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useDesktop } from "@/stores/desktop";
import { appsMeta, type AppId } from "./registry";
import { AppIcon } from "./AppIcon";

function Clock() {
  const [time, setTime] = useState("");
  useEffect(() => {
    const fmt = () =>
      new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setTime(fmt());
    const t = setInterval(() => setTime(fmt()), 15000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="inset ml-1 grid place-items-center px-2 py-1 font-system text-xs text-black">
      {time}
    </div>
  );
}

const startMenuApps: AppId[] = [
  "about",
  "projects",
  "stack",
  "resume",
  "social",
  "guestbook",
  "games",
  "notepad",
  "todo",
  "taskmanager",
  "send",
  "decrypt",
];

export function Taskbar() {
  const router = useRouter();
  const { windows, focusedId, openApp, focus, toggleMinimize, startOpen, setStartOpen } =
    useDesktop();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setStartOpen(false);
    };
    if (startOpen) document.addEventListener("pointerdown", onClick);
    return () => document.removeEventListener("pointerdown", onClick);
  }, [startOpen, setStartOpen]);

  return (
    <div className="absolute inset-x-0 bottom-0 z-[9000]" ref={menuRef}>
      {startOpen && (
        <div className="start-menu absolute bottom-11 left-1 flex w-64 p-1">
          <div className="flex w-7 flex-col items-center justify-end bg-gradient-to-b from-[var(--win-title)] to-[#7a2c05] py-3">
            <span className="rotate-180 font-display text-sm font-extrabold tracking-widest text-white [writing-mode:vertical-rl]">
              GnevesOS<span className="text-black/60"> 2000</span>
            </span>
          </div>
          <ul className="flex-1 py-1 font-system text-[13px] text-black">
            {startMenuApps.map((id) => (
              <li key={id}>
                <button
                  className="start-menu-item flex w-full items-center gap-3 px-3 py-1.5 text-left"
                  onClick={() => openApp(id)}
                >
                  <AppIcon
                    img={appsMeta[id].img}
                    emoji={appsMeta[id].icon}
                    title={appsMeta[id].title}
                    size={20}
                  />
                  {appsMeta[id].title}
                </button>
              </li>
            ))}
            <li className="my-1 border-t border-[var(--win-shadow)]" />
            <li>
              <button
                className="start-menu-item flex w-full items-center gap-3 px-3 py-1.5 text-left"
                onClick={() => openApp("terminal")}
              >
                <AppIcon
                  img={appsMeta.terminal.img}
                  emoji={appsMeta.terminal.icon}
                  title="Terminal"
                  size={20}
                />{" "}
                Terminal
              </button>
            </li>
            <li>
              <button
                className="start-menu-item flex w-full items-center gap-3 px-3 py-1.5 text-left"
                onClick={() => router.push("/")}
              >
                <span className="text-base">⏻</span> Desligar…
              </button>
            </li>
          </ul>
        </div>
      )}

      <div className="taskbar flex h-11 items-center gap-1 px-1.5">
        <button
          className="start-btn flex h-8 items-center gap-1.5 px-2 font-system text-[13px] text-black"
          data-open={startOpen}
          onClick={(e) => {
            e.stopPropagation();
            setStartOpen(!startOpen);
          }}
        >
          <Image src="/mascote.png" alt="" width={20} height={20} className="object-contain" />
          Start
        </button>

        <div className="mx-1 h-7 w-px bg-[var(--win-shadow)]" />

        <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
          {windows.map((w) => (
            <button
              key={w.id}
              data-active={focusedId === w.id && !w.minimized}
              className="task-btn flex h-8 min-w-0 max-w-44 flex-1 items-center gap-2 px-2 font-system text-xs text-black"
              onClick={() => (focusedId === w.id && !w.minimized ? toggleMinimize(w.id) : focus(w.id))}
            >
              <AppIcon img={w.img} emoji={w.icon} title={w.title} size={16} />
              <span className="truncate">{w.title}</span>
            </button>
          ))}
        </div>

        <Clock />
      </div>
    </div>
  );
}
