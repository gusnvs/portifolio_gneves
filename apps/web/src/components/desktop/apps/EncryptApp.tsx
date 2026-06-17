"use client";

import { useRef, useState } from "react";
import { encryptToVault } from "@/lib/crypto-client";
import type { GnsecContainer } from "@/lib/gnsec";
import { AppScroll, AppHeading } from "./ui";

function downloadJSON(obj: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(obj)], { type: "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function EncryptApp() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "working" | "done" | "error">("idle");
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ container: GnsecContainer; filename: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const encrypt = async () => {
    setError("");
    if (!file) return setError("Escolha um arquivo primeiro.");
    setStatus("working");
    try {
      const res = await fetch("/api/pubkey");
      if (!res.ok) {
        setError("A criptografia não está configurada no servidor.");
        setStatus("error");
        return;
      }
      const { publicKey } = await res.json();
      const bytes = new Uint8Array(await file.arrayBuffer());
      const container = await encryptToVault(
        bytes,
        file.name,
        file.type || "application/octet-stream",
        publicKey,
      );
      setResult({ container, filename: `${file.name}.gnsec` });
      setStatus("done");
    } catch {
      setError("Falha ao criptografar.");
      setStatus("error");
    }
  };

  if (status === "done" && result) {
    return (
      <AppScroll>
        <AppHeading sub="camada interna — feita no seu navegador">Encriptado 🧊</AppHeading>
        <div className="inset mb-3 p-3">
          <p>
            ✅ O arquivo foi criptografado <strong>no cliente</strong>, antes de qualquer requisição.
          </p>
        </div>
        <button className="btn-95" onClick={() => downloadJSON(result.container, result.filename)}>
          ⬇ Baixar {result.filename}
        </button>
        <div className="inset mt-3 p-3 text-xs leading-relaxed text-[#3a372f]">
          Próximo passo: leve este arquivo <strong>.gnsec</strong> ao app{" "}
          <strong>Enviar Arquivo</strong>. Lá ele ganha uma 2ª camada (no servidor) e vai por email —
          a requisição já trafega criptografada.
        </div>
        <div className="mt-3">
          <button
            className="btn-95"
            onClick={() => {
              setStatus("idle");
              setFile(null);
              setResult(null);
            }}
          >
            Encriptar outro
          </button>
        </div>
      </AppScroll>
    );
  }

  return (
    <AppScroll>
      <AppHeading sub="criptografia do lado cliente (1ª camada)">Encriptar 🧊</AppHeading>
      <div
        className="inset mb-3 cursor-pointer p-4 text-center"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          if (e.dataTransfer.files[0]) setFile(e.dataTransfer.files[0]);
        }}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        {file ? (
          <p>
            📎 <strong>{file.name}</strong>{" "}
            <span className="text-[#5a564d]">({Math.ceil(file.size / 1024)} KB)</span>
          </p>
        ) : (
          <p className="text-[#5a564d]">Clique ou solte um arquivo aqui</p>
        )}
      </div>

      <p className="mb-3 text-xs text-[#5a564d]">
        O arquivo é cifrado com a chave pública do Gustavo dentro do seu navegador — nada sai em
        texto puro.
      </p>

      {error && <p className="mb-2 text-sm text-[#7a2c05]">{error}</p>}

      <button className="btn-95 w-full" onClick={encrypt} disabled={status === "working"}>
        {status === "working" ? "Criptografando…" : "🧊 Criptografar (cliente)"}
      </button>
    </AppScroll>
  );
}
