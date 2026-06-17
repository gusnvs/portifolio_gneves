"use client";

import { useRef, useState } from "react";
import type { GnsecWrap } from "@/lib/gnsec";
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

export function SendApp() {
  const [file, setFile] = useState<File | null>(null);
  const [recipient, setRecipient] = useState("");
  const [senderName, setSenderName] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ emailed: boolean; wrap?: GnsecWrap; filename?: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const submit = async () => {
    setError("");
    if (!file) return setError("Escolha o arquivo .gnsec gerado no Encriptar.");
    setStatus("sending");
    try {
      const fd = new FormData();
      fd.set("file", file);
      fd.set("recipient", recipient);
      fd.set("senderName", senderName);
      fd.set("message", message);
      const res = await fetch("/api/send", { method: "POST", body: fd });
      const d = await res.json();
      if (!res.ok) {
        setError(d.error ?? "Algo deu errado.");
        setStatus("error");
        return;
      }
      setResult({ emailed: d.emailed, wrap: d.wrap, filename: d.filename });
      setStatus("done");
    } catch {
      setError("Erro de rede.");
      setStatus("error");
    }
  };

  if (status === "done" && result) {
    return (
      <AppScroll>
        <AppHeading sub="2ª camada (servidor) aplicada">Enviado 🔒🔒</AppHeading>
        <div className="inset mb-3 p-3">
          {result.emailed ? (
            <p>✅ Arquivo com dupla camada criptografado e enviado por email.</p>
          ) : (
            <p>
              ✅ Dupla camada aplicada. O email não está configurado aqui — baixe o{" "}
              <strong>.gnsec2</strong> para testar.
            </p>
          )}
        </div>
        {result.wrap && result.filename && (
          <button className="btn-95" onClick={() => downloadJSON(result.wrap, result.filename!)}>
            ⬇ Baixar {result.filename}
          </button>
        )}
        <div className="mt-3">
          <button
            className="btn-95"
            onClick={() => {
              setStatus("idle");
              setFile(null);
              setResult(null);
            }}
          >
            Enviar outro
          </button>
        </div>
      </AppScroll>
    );
  }

  return (
    <AppScroll>
      <AppHeading sub="adiciona a 2ª camada no servidor e envia por email">Enviar Arquivo 🔒</AppHeading>

      <div className="inset mb-3 p-2.5 text-xs text-[#3a372f]">
        Envie aqui o arquivo <strong>.gnsec</strong> gerado no app <strong>Encriptar</strong>. Como
        ele já está cifrado, a requisição nunca carrega o arquivo original.
      </div>

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
          accept=".gnsec,application/json,application/octet-stream"
          className="hidden"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        {file ? (
          <p>
            📎 <strong>{file.name}</strong>{" "}
            <span className="text-[#5a564d]">({Math.ceil(file.size / 1024)} KB)</span>
          </p>
        ) : (
          <p className="text-[#5a564d]">Clique ou solte o arquivo .gnsec aqui</p>
        )}
      </div>

      <input
        value={recipient}
        onChange={(e) => setRecipient(e.target.value)}
        placeholder="Email do destinatário (vazio = caixa do Gustavo)"
        type="email"
        className="inset mb-2 w-full bg-white px-2 py-1.5 outline-none"
      />
      <input
        value={senderName}
        onChange={(e) => setSenderName(e.target.value)}
        placeholder="Seu nome (opcional)"
        className="inset mb-2 w-full bg-white px-2 py-1.5 outline-none"
      />
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Mensagem (opcional)"
        rows={2}
        className="inset mb-3 w-full resize-none bg-white px-2 py-1.5 outline-none"
      />

      {error && <p className="mb-2 text-sm text-[#7a2c05]">{error}</p>}

      <button className="btn-95 w-full" onClick={submit} disabled={status === "sending"}>
        {status === "sending" ? "Enviando…" : "🔒 Aplicar 2ª camada e enviar"}
      </button>
    </AppScroll>
  );
}
