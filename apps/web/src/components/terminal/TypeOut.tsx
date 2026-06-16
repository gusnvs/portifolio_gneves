"use client";

import { useLayoutEffect, useRef, useState } from "react";

/**
 * Reveals a (possibly rich/colored) ReactNode with a typewriter effect.
 *
 * It renders the children once, then progressively fills their text nodes
 * left-to-right. Colors and links are preserved because only text *content*
 * is mutated, never the DOM structure. The clip is re-applied every animation
 * frame, so even if React re-commits the subtree the effect can't be undone.
 */
export function TypeOut({
  children,
  skipRef,
  onDone,
  onUpdate,
}: {
  children: React.ReactNode;
  skipRef?: { current: boolean };
  onDone?: () => void;
  onUpdate?: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [done, setDone] = useState(false);

  useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;

    // Collect text nodes (skip the trailing cursor span — it has no text).
    const cursor = root.querySelector("[data-cursor-block]");
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: (n) =>
        cursor && cursor.contains(n) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT,
    });
    const nodes: Text[] = [];
    let node: Node | null;
    while ((node = walker.nextNode())) nodes.push(node as Text);

    const fulls = nodes.map((t) => t.nodeValue ?? "");
    const total = fulls.reduce((a, s) => a + s.length, 0);
    const offsets: number[] = [];
    let acc = 0;
    for (const s of fulls) {
      offsets.push(acc);
      acc += s.length;
    }

    const apply = (pos: number) => {
      for (let i = 0; i < nodes.length; i++) {
        const vis = Math.min(fulls[i].length, Math.max(0, pos - offsets[i]));
        const want = fulls[i].slice(0, vis);
        if (nodes[i].nodeValue !== want) nodes[i].nodeValue = want;
      }
    };

    const finish = () => {
      apply(total);
      setDone(true);
      onUpdate?.();
      onDone?.();
    };

    if (total === 0) {
      finish();
      return;
    }

    // Visible but snappy: between 0.25s and ~1.3s regardless of length.
    const durationMs = Math.min(1300, Math.max(250, (total / 55) * 16));
    apply(0); // start hidden (before paint, so no full-text flash)

    let raf = 0;
    let start = 0;
    let cancelled = false;

    const loop = (ts: number) => {
      if (cancelled) return;
      if (skipRef?.current) {
        finish();
        return;
      }
      if (!start) start = ts;
      const t = Math.min(1, (ts - start) / durationMs);
      apply(Math.ceil(t * total));
      onUpdate?.();
      if (t >= 1) {
        setDone(true);
        onDone?.();
        return;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      apply(total); // restore on unmount / strict-mode re-run
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div ref={ref}>
      {children}
      {!done && (
        <span
          data-cursor-block
          className="ml-1 inline-block h-3.5 w-2 translate-y-[2px] animate-pulse bg-orange align-baseline"
        />
      )}
    </div>
  );
}
