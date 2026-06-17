"use client";

import { useEffect, useRef, useState } from "react";
import { AppScroll, AppHeading } from "./ui";

type Entry = { name: string; path: string; type: "folder" | "file"; size?: number };

const parentOf = (p: string) => {
  const t = p.replace(/\/$/, "");
  const i = t.lastIndexOf("/");
  return i < 0 ? "" : t.slice(0, i + 1);
};

async function cloud(action: string, extra: Record<string, unknown> = {}) {
  const res = await fetch("/api/cloud", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...extra }),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, ...data };
}

/* ----------------------------------------------------------------- login */

function CloudLogin({ onUnlock }: { onUnlock: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (res.ok) onUnlock();
      else {
        const d = await res.json().catch(() => ({}));
        setError(d.error ?? "Falha no login.");
      }
    } catch {
      setError("Erro de rede.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid h-full place-items-center bg-[#f5f1e9] p-6 font-system text-[13px] text-[#161616]">
      <div className="inset w-full max-w-xs p-5 text-center">
        <div className="mb-2 text-4xl">🔐</div>
        <p className="mb-1 font-display text-lg font-extrabold">Meu Cloud</p>
        <p className="mb-4 text-xs text-[#5a564d]">Acesso privado. Faça login para continuar.</p>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Usuário"
          autoComplete="off"
          className="mb-2 w-full border border-[#9a958a] bg-white px-2 py-1.5 outline-none"
        />
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Senha"
          type="password"
          className="mb-3 w-full border border-[#9a958a] bg-white px-2 py-1.5 outline-none"
        />
        {error && <p className="mb-2 text-xs text-[#7a2c05]">{error}</p>}
        <button className="btn-95 w-full" onClick={submit} disabled={busy}>
          {busy ? "Entrando…" : "Entrar"}
        </button>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- manager */

function CloudManager() {
  const [path, setPath] = useState("");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notConfigured, setNotConfigured] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async (p = path) => {
    setLoading(true);
    setError("");
    const r = await cloud("list", { prefix: p });
    if (r.notConfigured) setNotConfigured(true);
    else if (!r.ok) setError(r.error ?? "Falha ao listar.");
    else setEntries(r.entries ?? []);
    setLoading(false);
  };
  useEffect(() => {
    load("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const go = (p: string) => {
    setPath(p);
    load(p);
  };

  const newFolder = async () => {
    const name = prompt("Nome da nova pasta:");
    if (!name) return;
    const r = await cloud("folder", { path: path + name });
    if (!r.ok) setError(r.error ?? "Falha ao criar pasta.");
    else load();
  };

  const upload = async (file: File) => {
    const r = await cloud("upload-url", {
      path: path + file.name,
      contentType: file.type || "application/octet-stream",
    });
    if (!r.ok) return setError(r.error ?? "Falha no upload.");
    await fetch(r.url, {
      method: "PUT",
      headers: { "Content-Type": file.type || "application/octet-stream" },
      body: file,
    });
    load();
  };

  const download = async (e: Entry) => {
    const r = await cloud("download-url", { path: e.path });
    if (r.ok) window.open(r.url, "_blank");
  };

  const remove = async (e: Entry) => {
    if (!confirm(`Excluir "${e.name}"${e.type === "folder" ? " e tudo dentro" : ""}?`)) return;
    const r = await cloud("delete", { path: e.path, isFolder: e.type === "folder" });
    if (!r.ok) setError(r.error ?? "Falha ao excluir.");
    else load();
  };

  const rename = async (e: Entry) => {
    const name = prompt("Novo nome (pode incluir pasta/destino):", e.name);
    if (!name || name === e.name) return;
    const dir = parentOf(e.path);
    const to = dir + name;
    const r = await cloud("rename", { from: e.path, to, isFolder: e.type === "folder" });
    if (!r.ok) setError(r.error ?? "Falha ao renomear.");
    else load();
  };

  if (notConfigured) {
    return (
      <AppScroll>
        <AppHeading sub="armazenamento na AWS S3">Meu Cloud</AppHeading>
        <div className="inset p-3 text-[#5a564d]">
          O S3 ainda não está configurado neste servidor (faltam credenciais da AWS). Defina{" "}
          <code>AWS_REGION</code>, <code>AWS_ACCESS_KEY_ID</code>, <code>AWS_SECRET_ACCESS_KEY</code> e{" "}
          <code>S3_BUCKET</code> para ativar.
        </div>
      </AppScroll>
    );
  }

  const crumbs = path ? path.replace(/\/$/, "").split("/") : [];

  return (
    <div className="flex h-full flex-col bg-[#f5f1e9] font-system text-[13px] text-[#161616]">
      {/* toolbar */}
      <div className="flex flex-wrap items-center gap-1 border-b border-[#9a958a] px-2 py-1.5">
        <button className="btn-95 text-xs" disabled={!path} onClick={() => go(parentOf(path))}>
          ↑ Acima
        </button>
        <button className="btn-95 text-xs" onClick={newFolder}>
          📁 Nova pasta
        </button>
        <button className="btn-95 text-xs" onClick={() => fileRef.current?.click()}>
          ⬆ Upload
        </button>
        <input
          ref={fileRef}
          type="file"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
        />
        <button className="btn-95 text-xs" onClick={() => load()}>
          ↻
        </button>
        <span className="ml-auto truncate text-xs text-[#5a564d]">
          <button className="hover:underline" onClick={() => go("")}>
            🏠
          </button>
          {crumbs.map((c, i) => (
            <span key={i}>
              {" / "}
              <button
                className="hover:underline"
                onClick={() => go(crumbs.slice(0, i + 1).join("/") + "/")}
              >
                {c}
              </button>
            </span>
          ))}
        </span>
      </div>

      {error && <p className="px-3 py-1 text-xs text-[#7a2c05]">{error}</p>}

      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {loading ? (
          <p className="p-2 text-[#9a958a]">Carregando…</p>
        ) : entries.length === 0 ? (
          <p className="p-2 text-[#9a958a]">Pasta vazia. Crie uma pasta ou faça upload. ❄️</p>
        ) : (
          <ul className="space-y-0.5">
            {entries.map((e) => (
              <li
                key={e.path}
                className="group flex items-center gap-2 rounded px-2 py-1.5 hover:bg-[#e7e1d4]"
              >
                <span className="text-base">{e.type === "folder" ? "📁" : "📄"}</span>
                <button
                  className="min-w-0 flex-1 truncate text-left hover:underline"
                  onClick={() => (e.type === "folder" ? go(e.path) : download(e))}
                  title={e.name}
                >
                  {e.name}
                </button>
                {e.type === "file" && e.size != null && (
                  <span className="text-[11px] text-[#9a958a]">{Math.ceil(e.size / 1024)} KB</span>
                )}
                <span className="flex gap-1 opacity-0 group-hover:opacity-100">
                  {e.type === "file" && (
                    <button className="text-[#7a2c05] hover:underline" onClick={() => download(e)}>
                      baixar
                    </button>
                  )}
                  <button className="text-[#7a2c05] hover:underline" onClick={() => rename(e)}>
                    renomear
                  </button>
                  <button className="text-[#7a2c05] hover:underline" onClick={() => remove(e)}>
                    excluir
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ app */

export function CloudApp() {
  const [state, setState] = useState<"checking" | "locked" | "unlocked">("checking");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setState(d.admin ? "unlocked" : "locked"))
      .catch(() => setState("locked"));
  }, []);

  if (state === "checking") {
    return <div className="grid h-full place-items-center bg-[#f5f1e9] font-system text-[#9a958a]">…</div>;
  }
  if (state === "locked") return <CloudLogin onUnlock={() => setState("unlocked")} />;
  return <CloudManager />;
}
