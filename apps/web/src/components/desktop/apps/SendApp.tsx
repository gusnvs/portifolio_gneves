"use client";

import { useRef, useState } from "react";
import { generatePassword } from "@/lib/crypto-client";
import type { GnsecContainer } from "@/lib/gnsec";
import { AppScroll, AppHeading } from "./ui";

type Mode = "vault" | "password";

function downloadContainer(container: GnsecContainer, filename: string) {
  const blob = new Blob([JSON.stringify(container)], { type: "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function SendApp() {
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<Mode>("vault");
  const [recipient, setRecipient] = useState("");
  const [senderName, setSenderName] = useState("");
  const [message, setMessage] = useState("");
  const [password, setPassword] = useState(() => generatePassword());
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ emailed: boolean; container?: GnsecContainer; filename?: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const submit = async () => {
    setError("");
    if (!file) return setError("Escolha um arquivo primeiro.");
    if (mode === "password" && !recipient) return setError("Adicione o email do destinatário.");
    setStatus("sending");
    try {
      const fd = new FormData();
      fd.set("file", file);
      fd.set("mode", mode);
      fd.set("senderName", senderName);
      fd.set("message", message);
      if (mode === "password") {
        fd.set("recipient", recipient);
        fd.set("password", password);
      }
      const res = await fetch("/api/send", { method: "POST", body: fd });
      const d = await res.json();
      if (!res.ok) {
        setError(d.error ?? "Algo deu errado.");
        setStatus("error");
        return;
      }
      setResult({ emailed: d.emailed, container: d.container, filename: d.filename });
      setStatus("done");
    } catch {
      setError("Erro de rede.");
      setStatus("error");
    }
  };

  if (status === "done" && result) {
    return (
      <AppScroll>
        <AppHeading sub="seu arquivo foi criptografado">Enviado 🔒</AppHeading>
        <div className="inset mb-3 p-3">
          {result.emailed ? (
            <p>
              ✅ Criptografado e enviado por email{" "}
              {mode === "vault" ? "ao cofre do Gustavo" : "ao destinatário"}.
            </p>
          ) : (
            <p>
              ✅ Criptografado. O email não está configurado aqui, então baixe o arquivo{" "}
              <strong>.gnsec</strong> e continue testando.
            </p>
          )}
        </div>

        {mode === "password" && (
          <div className="inset mb-3 p-3">
            <p className="mb-1 font-bold text-[#7a2c05]">Compartilhe esta senha (não vai por email):</p>
            <div className="flex items-center gap-2">
              <code className="inset flex-1 break-all bg-white px-2 py-1">{password}</code>
              <button className="btn-95" onClick={() => navigator.clipboard?.writeText(password)}>
                Copiar
              </button>
            </div>
            <p className="mt-1 text-xs text-[#5a564d]">
              O destinatário precisa dela para abrir o arquivo no app Descriptografar.
            </p>
          </div>
        )}

        {result.container && result.filename && (
          <button
            className="btn-95"
            onClick={() => downloadContainer(result.container!, result.filename!)}
          >
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
              setPassword(generatePassword());
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
      <AppHeading sub="envio de arquivo criptografado ponta a ponta">Enviar Arquivo 🔒</AppHeading>

      {/* seletor de arquivo */}
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
          <p className="text-[#5a564d]">Clique ou solte um arquivo aqui (máx. 8 MB)</p>
        )}
      </div>

      {/* modo */}
      <div className="mb-3 flex gap-2">
        <button
          className={`btn-95 flex-1 ${mode === "vault" ? "!shadow-[inset_1px_1px_0_0_#000,inset_-1px_-1px_0_0_#fff]" : ""}`}
          onClick={() => setMode("vault")}
        >
          🏛️ Para o Gustavo (cofre)
        </button>
        <button
          className={`btn-95 flex-1 ${mode === "password" ? "!shadow-[inset_1px_1px_0_0_#000,inset_-1px_-1px_0_0_#fff]" : ""}`}
          onClick={() => setMode("password")}
        >
          👤 Para alguém (senha)
        </button>
      </div>

      {mode === "vault" ? (
        <p className="mb-3 text-xs text-[#5a564d]">
          Criptografado com a chave pública do Gustavo — só ele consegue abrir com a chave privada.
        </p>
      ) : (
        <div className="mb-3 space-y-2">
          <input
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="Email do destinatário"
            type="email"
            className="inset w-full bg-white px-2 py-1.5 outline-none"
          />
          <div>
            <p className="mb-1 text-xs font-bold text-[#7a2c05]">Senha gerada (compartilhe à parte):</p>
            <div className="flex items-center gap-2">
              <code className="inset flex-1 break-all bg-white px-2 py-1 text-xs">{password}</code>
              <button className="btn-95" onClick={() => setPassword(generatePassword())}>
                ↻
              </button>
            </div>
          </div>
        </div>
      )}

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
        {status === "sending" ? "Criptografando…" : "🔒 Criptografar e enviar"}
      </button>
    </AppScroll>
  );
}
