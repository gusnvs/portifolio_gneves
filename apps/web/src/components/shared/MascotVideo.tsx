"use client";

import { useState } from "react";
import Image from "next/image";

/**
 * Plays a rendered Remotion clip of the mascot. If the video is missing or
 * fails (e.g. not rendered yet), it gracefully falls back to the floating PNG.
 */
export function MascotVideo({
  src,
  className = "",
  alt = "Mascote boneco de neve do Gustavo",
}: {
  src: string;
  className?: string;
  alt?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className={className}>
        <span className="mascot-float absolute inset-0 block">
          <Image src="/mascote.png" alt={alt} fill className="object-contain" />
        </span>
      </div>
    );
  }

  return (
    <video
      src={src}
      autoPlay
      loop
      muted
      playsInline
      preload="auto"
      aria-label={alt}
      onError={() => setFailed(true)}
      className={`${className} h-full w-full object-contain`}
    />
  );
}
