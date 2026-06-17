"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useDesktop } from "@/stores/desktop";
import { DesktopIcons } from "./DesktopIcons";
import { Taskbar } from "./Taskbar";
import { Window } from "./Window";
import { DesktopCursor } from "./DesktopCursor";
import { appComponents } from "./apps";
import { appsMeta, type AppId } from "./registry";

type Marquee = { l: number; t: number; w: number; h: number };

export function Desktop() {
  const windows = useDesktop((s) => s.windows);
  const focusedId = useDesktop((s) => s.focusedId);
  const openApp = useDesktop((s) => s.openApp);

  const surfaceRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef<{ x: number; y: number } | null>(null);
  const [marquee, setMarquee] = useState<Marquee | null>(null);

  useEffect(() => {
    const open = new URLSearchParams(window.location.search).get("open");
    if (open && Object.prototype.hasOwnProperty.call(appsMeta, open)) {
      openApp(open as AppId);
    }
  }, [openApp]);

  const onPointerDown = (e: React.PointerEvent) => {
    const target = e.target as HTMLElement;
    if (
      e.button !== 0 ||
      target.closest(".win, .taskbar, .desk-icon, .start-menu, button, a, input, textarea")
    ) {
      return;
    }
    dragStart.current = { x: e.clientX, y: e.clientY };
    setMarquee({ l: e.clientX, t: e.clientY, w: 0, h: 0 });
    surfaceRef.current?.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const s = dragStart.current;
    if (!s) return;
    setMarquee({
      l: Math.min(s.x, e.clientX),
      t: Math.min(s.y, e.clientY),
      w: Math.abs(e.clientX - s.x),
      h: Math.abs(e.clientY - s.y),
    });
  };
  const endDrag = () => {
    dragStart.current = null;
    setMarquee(null);
  };

  return (
    <div
      ref={surfaceRef}
      className="desktop-surface isolate relative h-[100svh] w-full select-none overflow-hidden"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      {/* wallpaper */}
      <Image
        src="/boneco_neve/wallpaper_desktop.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="-z-20 object-cover"
        draggable={false}
      />
      {/* old-monitor diagonal lines on top of the wallpaper */}
      <div className="desktop-lines pointer-events-none absolute inset-0 -z-10" />

      <DesktopIcons />

      {windows.length === 0 && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <div className="text-center">
            <p className="font-display text-2xl font-extrabold text-white drop-shadow-[1px_1px_3px_#000]">
              GnevesOS 2000
            </p>
            <p className="mt-1 font-system text-sm text-white/90 drop-shadow-[1px_1px_3px_#000]">
              Dê um clique em um ícone, ou clique em <strong>Start</strong>.
            </p>
          </div>
        </div>
      )}

      {/* drag-select marquee */}
      {marquee && (marquee.w > 2 || marquee.h > 2) && (
        <div
          className="pointer-events-none absolute z-[5] border border-orange/80 bg-orange/15"
          style={{ left: marquee.l, top: marquee.t, width: marquee.w, height: marquee.h }}
        />
      )}

      {windows.map((w) => {
        const App = appComponents[w.appId];
        return (
          <Window key={w.id} win={w} active={focusedId === w.id}>
            <App onOpenApp={openApp} />
          </Window>
        );
      })}

      <Taskbar />
      <DesktopCursor />
    </div>
  );
}
