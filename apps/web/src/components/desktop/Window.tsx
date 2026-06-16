"use client";

import { useRef } from "react";
import { useDesktop, type WindowInstance } from "@/stores/desktop";
import { AppIcon } from "./AppIcon";

export function Window({
  win,
  active,
  children,
}: {
  win: WindowInstance;
  active: boolean;
  children: React.ReactNode;
}) {
  const { focus, move, resize, closeApp, toggleMinimize, toggleMaximize } = useDesktop();
  const drag = useRef<{ dx: number; dy: number } | null>(null);
  const rsz = useRef<{ sx: number; sy: number; sw: number; sh: number } | null>(null);

  if (win.minimized) return null;

  const onTitlePointerDown = (e: React.PointerEvent) => {
    if (win.maximized) return;
    focus(win.id);
    drag.current = { dx: e.clientX - win.x, dy: e.clientY - win.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onTitlePointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    const x = Math.min(window.innerWidth - 60, Math.max(-win.w + 120, e.clientX - drag.current.dx));
    const y = Math.min(window.innerHeight - 60, Math.max(0, e.clientY - drag.current.dy));
    move(win.id, x, y);
  };
  const endDrag = (e: React.PointerEvent) => {
    drag.current = null;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  const onResizePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    focus(win.id);
    rsz.current = { sx: e.clientX, sy: e.clientY, sw: win.w, sh: win.h };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onResizePointerMove = (e: React.PointerEvent) => {
    if (!rsz.current) return;
    resize(win.id, rsz.current.sw + (e.clientX - rsz.current.sx), rsz.current.sh + (e.clientY - rsz.current.sy));
  };
  const endResize = (e: React.PointerEvent) => {
    rsz.current = null;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  return (
    <div
      className="win absolute flex flex-col"
      style={{ left: win.x, top: win.y, width: win.w, height: win.h, zIndex: win.z }}
      onPointerDown={() => focus(win.id)}
      role="dialog"
      aria-label={win.title}
    >
      {/* title bar */}
      <div
        className={`win-title flex h-8 select-none items-center justify-between gap-2 px-1 pl-2 ${
          active ? "win-title--active" : "win-title--inactive"
        }`}
        onPointerDown={onTitlePointerDown}
        onPointerMove={onTitlePointerMove}
        onPointerUp={endDrag}
        onDoubleClick={() => toggleMaximize(win.id)}
      >
        <div className="flex min-w-0 items-center gap-2">
          <AppIcon img={win.img} emoji={win.icon} title={win.title} size={18} />
          <span className="truncate font-system text-[13px] font-bold text-white">{win.title}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            aria-label="Minimizar"
            className="win-btn"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => toggleMinimize(win.id)}
          >
            <span className="-translate-y-1">_</span>
          </button>
          <button
            aria-label="Maximizar"
            className="win-btn"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => toggleMaximize(win.id)}
          >
            ▢
          </button>
          <button
            aria-label="Fechar"
            className="win-btn win-btn--close"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => closeApp(win.id)}
          >
            ✕
          </button>
        </div>
      </div>

      {/* body */}
      <div className="win-body min-h-0 flex-1 overflow-hidden">{children}</div>

      {/* resize handle */}
      {!win.maximized && (
        <div
          className="absolute bottom-0 right-0 z-10 h-4 w-4 cursor-nwse-resize"
          onPointerDown={onResizePointerDown}
          onPointerMove={onResizePointerMove}
          onPointerUp={endResize}
        />
      )}
    </div>
  );
}
