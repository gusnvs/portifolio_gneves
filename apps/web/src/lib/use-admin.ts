"use client";

import { useEffect, useState } from "react";

/** Reads the admin session state from /api/auth/me (best-effort). */
export function useAdmin() {
  const [admin, setAdmin] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let on = true;
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (on) {
          setAdmin(Boolean(d.admin));
          setReady(true);
        }
      })
      .catch(() => on && setReady(true));
    return () => {
      on = false;
    };
  }, []);

  return { admin, ready };
}
