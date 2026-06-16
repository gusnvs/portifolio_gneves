"use client";

import { useEffect } from "react";
import Image from "next/image";
import { useDesktop } from "@/stores/desktop";
import { DesktopIcons } from "./DesktopIcons";
import { Taskbar } from "./Taskbar";
import { Window } from "./Window";
import { DesktopCursor } from "./DesktopCursor";
import { appComponents } from "./apps";
import { appsMeta, type AppId } from "./registry";

export function Desktop() {
  const windows = useDesktop((s) => s.windows);
  const focusedId = useDesktop((s) => s.focusedId);
  const openApp = useDesktop((s) => s.openApp);

  useEffect(() => {
    const open = new URLSearchParams(window.location.search).get("open");
    if (open && Object.prototype.hasOwnProperty.call(appsMeta, open)) {
      openApp(open as AppId);
    }
  }, [openApp]);

  return (
    <div className="desktop-surface isolate relative h-[100svh] w-full select-none overflow-hidden">
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
              Dê dois cliques em um ícone, ou clique em <strong>Start</strong>.
            </p>
          </div>
        </div>
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
