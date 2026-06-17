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
      className="absolute left-3 top-3 grid grid-flow-col grid-rows-5 gap-1"
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) setSelected(null);
      }}
    >
      {desktopApps.map((app) => (
        <button
          key={app.id}
          data-selected={selected === app.id}
          className="desk-icon flex w-[104px] flex-col items-center gap-1 rounded p-2 text-center"
          onPointerDown={() => setSelected(app.id)}
          onClick={() => openApp(app.id)}
          onKeyDown={(e) => {
            if (e.key === "Enter") openApp(app.id);
          }}
        >
          <span className="desk-icon-img grid h-[76px] w-[76px] place-items-center rounded">
            <AppIcon img={app.img} emoji={app.icon} title={app.title} size={72} />
          </span>
          <span className="font-system text-xs leading-tight">{app.title}</span>
        </button>
      ))}
    </div>
  );
}
