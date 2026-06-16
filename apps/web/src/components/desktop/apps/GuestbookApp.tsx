"use client";

import { useEffect, useState } from "react";
import { useAdmin } from "@/lib/use-admin";
import { AppScroll, AppHeading } from "./ui";

type Msg = { id: string; name: string; message: string; createdAt: string };

export function GuestbookApp() {
  const { admin } = useAdmin();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [offline, setOffline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const load = () => {
    fetch("/api/guestbook")
      .then((r) => r.json())
      .then((d) => {
        setMessages(d.messages ?? []);
        setOffline(Boolean(d.dbDisabled));
      })
      .catch(() => setOffline(true))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const submit = async () => {
    setError("");
    if (!name.trim() || !message.trim()) return;
    setSending(true);
    try {
      const res = await fetch("/api/guestbook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, message, website }),
      });
      const d = await res.json();
      if (!res.ok) {
        setError(d.error ?? "Não foi possível enviar.");
      } else {
        setMessage("");
        if (d.message) setMessages((m) => [d.message, ...m]);
      }
    } catch {
      setError("Erro de rede.");
    } finally {
      setSending(false);
    }
  };

  const remove = async (id: string) => {
    setMessages((m) => m.filter((x) => x.id !== id));
    await fetch(`/api/guestbook/${id}`, { method: "DELETE" }).catch(() => {});
  };

  return (
    <AppScroll>
      <AppHeading sub="assine o mural — como em 2003">Livro de Visitas</AppHeading>

      {offline ? (
        <div className="inset p-3 text-[#5a564d]">
          O livro de visitas está offline (sem banco conectado). Volte quando o backend estiver no ar.
        </div>
      ) : (
        <>
          <div className="inset mb-4 p-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Seu nome"
              maxLength={40}
              className="mb-2 w-full border border-[#9a958a] bg-white px-2 py-1.5 outline-none"
            />
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Deixe uma mensagem…"
              maxLength={280}
              rows={3}
              className="w-full resize-none border border-[#9a958a] bg-white px-2 py-1.5 outline-none"
            />
            {/* honeypot: escondido dos humanos */}
            <input
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              tabIndex={-1}
              autoComplete="off"
              aria-hidden
              className="absolute left-[-9999px] h-0 w-0"
            />
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-[#9a958a]">{280 - message.length} caracteres restantes</span>
              <button className="btn-95" onClick={submit} disabled={sending}>
                {sending ? "Enviando…" : "Assinar ✍"}
              </button>
            </div>
            {error && <p className="mt-1 text-xs text-[#7a2c05]">{error}</p>}
          </div>

          {loading ? (
            <p className="text-[#9a958a]">Carregando mensagens…</p>
          ) : messages.length === 0 ? (
            <p className="text-[#9a958a]">Seja o primeiro a assinar. ❄️</p>
          ) : (
            <ul className="space-y-2">
              {messages.map((m) => (
                <li key={m.id} className="inset p-2.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <strong className="text-[#7a2c05]">{m.name}</strong>
                    <span className="flex items-center gap-2 text-[11px] text-[#9a958a]">
                      {new Date(m.createdAt).toLocaleDateString("pt-BR")}
                      {admin && (
                        <button className="text-[#7a2c05] hover:underline" onClick={() => remove(m.id)}>
                          excluir
                        </button>
                      )}
                    </span>
                  </div>
                  <p className="mt-1 break-words">{m.message}</p>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </AppScroll>
  );
}
