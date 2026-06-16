"use client";

import { useRef, useState } from "react";
import { decryptWithPassword, decryptWithPrivateKey } from "@/lib/crypto-client";
import { isGnsecContainer, type GnsecContainer } from "@/lib/gnsec";
import { AppScroll, AppHeading } from "./ui";

function downloadBytes(bytes: Uint8Array, name: string, mime: string) {
  const ab = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(ab).set(bytes);
  const blob = new Blob([ab], { type: mime || "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

export function DecryptApp() {
  const [container, setContainer] = useState<GnsecContainer | null>(null);
  const [method, setMethod] = useState<"password" | "key">("password");
  const [password, setPassword] = useState("");
  const [privateKey, setPrivateKey] = useState("");
  const [error, setError] = useState("");
  const [ok, setOk] = useState(false);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const keyRef = useRef<HTMLInputElement>(null);

  const loadFile = async (f: File) => {
    setError("");
    setOk(false);
    try {
      const parsed = JSON.parse(await f.text());
      if (!isGnsecContainer(parsed)) {
        setError("Esse não é um arquivo .gnsec válido.");
        return;
      }
      setContainer(parsed);
      setMethod(parsed.kdf ? "password" : "key");
    } catch {
      setError("Não consegui ler o arquivo.");
    }
  };

  const decrypt = async () => {
    if (!container) return;
    setError("");
    setBusy(true);
    try {
      const bytes =
        method === "password"
          ? await decryptWithPassword(container, password)
          : await decryptWithPrivateKey(container, privateKey);
      downloadBytes(bytes, container.meta.originalName, container.meta.mime);
      setOk(true);
    } catch {
      setError("Não consegui descriptografar — senha/chave errada, ou o arquivo está corrompido.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppScroll>
      <AppHeading sub="descriptografe um .gnsec — roda 100% no seu navegador">Descriptografar 🔓</AppHeading>

      {/* seletor de arquivo */}
      <div
        className="inset mb-3 cursor-pointer p-4 text-center"
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          if (e.dataTransfer.files[0]) loadFile(e.dataTransfer.files[0]);
        }}
      >
        <input
          ref={fileRef}
          type="file"
          accept=".gnsec,application/json,application/octet-stream"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && loadFile(e.target.files[0])}
        />
        {container ? (
          <p>
            📦 <strong>{container.meta.originalName}</strong>{" "}
            <span className="text-[#5a564d]">
              ({container.mode === "vault" ? "cofre" : "senha"} · {container.meta.size} bytes)
            </span>
          </p>
        ) : (
          <p className="text-[#5a564d]">Clique ou solte um arquivo .gnsec</p>
        )}
      </div>

      {container && (
        <>
          <div className="mb-3 flex gap-2">
            {container.kdf && (
              <button
                className={`btn-95 flex-1 ${method === "password" ? "!shadow-[inset_1px_1px_0_0_#000,inset_-1px_-1px_0_0_#fff]" : ""}`}
                onClick={() => setMethod("password")}
              >
                🔑 Tenho a senha
              </button>
            )}
            <button
              className={`btn-95 flex-1 ${method === "key" ? "!shadow-[inset_1px_1px_0_0_#000,inset_-1px_-1px_0_0_#fff]" : ""}`}
              onClick={() => setMethod("key")}
            >
              🗝️ Sou o Gustavo (chave privada)
            </button>
          </div>

          {method === "password" ? (
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Senha"
              type="text"
              autoComplete="off"
              className="inset mb-3 w-full bg-white px-2 py-1.5 outline-none"
            />
          ) : (
            <div className="mb-3">
              <textarea
                value={privateKey}
                onChange={(e) => setPrivateKey(e.target.value)}
                placeholder="-----BEGIN PRIVATE KEY-----&#10;…cole sua private_key.pem aqui…&#10;-----END PRIVATE KEY-----"
                rows={4}
                className="inset w-full resize-none bg-white px-2 py-1.5 font-mono text-[11px] outline-none"
              />
              <input
                ref={keyRef}
                type="file"
                accept=".pem,.txt"
                className="hidden"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (f) setPrivateKey(await f.text());
                }}
              />
              <button className="btn-95 mt-1 text-xs" onClick={() => keyRef.current?.click()}>
                …ou carregue um arquivo .pem
              </button>
              <p className="mt-1 text-[11px] text-[#5a564d]">
                Sua chave fica neste navegador — nunca é enviada.
              </p>
            </div>
          )}

          {error && <p className="mb-2 text-sm text-[#7a2c05]">{error}</p>}
          {ok && <p className="mb-2 text-sm text-[#1e8a3b]">✅ Descriptografado — o download deve começar.</p>}

          <button className="btn-95 w-full" onClick={decrypt} disabled={busy}>
            {busy ? "Descriptografando…" : "🔓 Descriptografar e baixar"}
          </button>
        </>
      )}
    </AppScroll>
  );
}
