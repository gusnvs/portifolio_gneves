"use client";

import { useState } from "react";
import { useDesktop } from "@/stores/desktop";
import { desktopApps } from "./registry";
import { AppIcon } from "./AppIcon";

export function DesktopIcons() {
  const openApp = useDesktop((s) => s.openApp);
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div
      className="absolute left-3 top-3 grid grid-flow-col grid-rows-6 gap-1"
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) setSelected(null);
      }}
    >
      {desktopApps.map((app) => (
        <button
          key={app.id}
          data-selected={selected === app.id}
          className="desk-icon flex w-20 flex-col items-center gap-1 rounded p-2 text-center"
          onPointerDown={() => setSelected(app.id)}
          onDoubleClick={() => openApp(app.id)}
          onKeyDown={(e) => {
            if (e.key === "Enter") openApp(app.id);
          }}
        >
          <span className="desk-icon-img grid h-11 w-11 place-items-center rounded p-0.5">
            <AppIcon img={app.img} emoji={app.icon} title={app.title} size={40} />
          </span>
          <span className="font-system text-[11px] leading-tight">{app.title}</span>
        </button>
      ))}
    </div>
  );
}
