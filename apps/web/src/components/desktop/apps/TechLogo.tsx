"use client";

import { useState } from "react";
import { techLogoUrl } from "@/content/tech-logos";

/** A tech logo (from a CDN) with a lettered fallback if it has no logo / fails. */
export function TechLogo({ name, size = 16 }: { name: string; size?: number }) {
  const url = techLogoUrl(name);
  const [failed, setFailed] = useState(false);

  if (!url || failed) {
    return (
      <span
        aria-hidden
        className="grid shrink-0 place-items-center rounded bg-[#7a2c05] font-bold text-white"
        style={{ width: size, height: size, fontSize: Math.round(size * 0.6) }}
      >
        {name[0]}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      onError={() => setFailed(true)}
      className="shrink-0 object-contain"
      style={{ width: size, height: size }}
    />
  );
}
