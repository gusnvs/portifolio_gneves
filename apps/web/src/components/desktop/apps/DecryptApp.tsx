"use client";

import { useRef, useState } from "react";
import { decryptWithPrivateKey } from "@/lib/crypto-client";
import {
  b64ToBytes,
  isGnsecContainer,
  isGnsecWrap,
  type GnsecContainer,
} from "@/lib/gnsec";
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

type Loaded =
  | { kind: "wrap"; name: string; raw: unknown }
  | { kind: "inner"; name: string; container: GnsecContainer };

export function DecryptApp() {
  const [loaded, setLoaded] = useState<Loaded | null>(null);
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
      if (isGnsecWrap(parsed)) setLoaded({ kind: "wrap", name: parsed.meta.innerName, raw: parsed });
      else if (isGnsecContainer(parsed))
        setLoaded({ kind: "inner", name: parsed.meta.originalName, container: parsed });
      else setError("Arquivo não reconhecido (.gnsec ou .gnsec2).");
    } catch {
      setError("Não consegui ler o arquivo.");
    }
  };

  const decrypt = async () => {
    if (!loaded) return;
    setError("");
    setBusy(true);
    try {
      let container: GnsecContainer;
      if (loaded.kind === "wrap") {
        // 1) remove the outer server layer
        const res = await fetch("/api/unwrap", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(loaded.raw),
        });
        const d = await res.json();
        if (!res.ok) {
          setError(d.error ?? "Falha ao remover a camada externa.");
          setBusy(false);
          return;
        }
        const innerJson = new TextDecoder().decode(b64ToBytes(d.inner));
        const inner = JSON.parse(innerJson);
        if (!isGnsecContainer(inner)) {
          setError("Camada interna inválida.");
          setBusy(false);
          return;
        }
        container = inner;
      } else {
        container = loaded.container;
      }
      // 2) remove the inner client layer with the private key
      const bytes = await decryptWithPrivateKey(container, privateKey);
      downloadBytes(bytes, container.meta.originalName, container.meta.mime);
      setOk(true);
    } catch {
      setError("Não consegui descriptografar — chave errada ou arquivo corrompido.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppScroll>
      <AppHeading sub="remove a camada do servidor e a do cliente">Descriptografar 🔓</AppHeading>

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
          accept=".gnsec,.gnsec2,application/json,application/octet-stream"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && loadFile(e.target.files[0])}
        />
        {loaded ? (
          <p>
            📦 <strong>{loaded.name}</strong>{" "}
            <span className="text-[#5a564d]">
              ({loaded.kind === "wrap" ? "dupla camada" : "camada interna"})
            </span>
          </p>
        ) : (
          <p className="text-[#5a564d]">Clique ou solte um arquivo .gnsec / .gnsec2</p>
        )}
      </div>

      {loaded && (
        <>
          <p className="mb-1 text-xs font-bold text-[#7a2c05]">Sua chave privada (camada interna):</p>
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
            Sua chave fica neste navegador — nunca é enviada. (A camada externa é removida no
            servidor; a interna, aqui.)
          </p>

          {error && <p className="mb-2 mt-2 text-sm text-[#7a2c05]">{error}</p>}
          {ok && <p className="mb-2 mt-2 text-sm text-[#1e8a3b]">✅ Descriptografado — o download deve começar.</p>}

          <button className="btn-95 mt-2 w-full" onClick={decrypt} disabled={busy}>
            {busy ? "Descriptografando…" : "🔓 Descriptografar e baixar"}
          </button>
        </>
      )}
    </AppScroll>
  );
}
