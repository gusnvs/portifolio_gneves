"use client";

import { useEffect, useRef, useState } from "react";
import { useDesktop } from "@/stores/desktop";
import { useAdmin } from "@/lib/use-admin";
import { AppScroll, AppHeading } from "./ui";

type Mode = "local" | "server";

/* ------------------------------------------------------------- Notepad */

export function NotepadApp() {
  const { admin, ready } = useAdmin();
  const [text, setText] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [mode, setMode] = useState<Mode>("local");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!ready) return;
    if (admin) {
      setMode("server");
      fetch("/api/notes")
        .then((r) => r.json())
        .then((d) => setText(d.note?.content ?? ""))
        .catch(() => setText(localStorage.getItem("gn:notepad") ?? ""))
        .finally(() => setLoaded(true));
    } else {
      setMode("local");
      setText(localStorage.getItem("gn:notepad") ?? "");
      setLoaded(true);
    }
  }, [ready, admin]);

  useEffect(() => {
    if (!loaded) return;
    if (mode === "local") {
      localStorage.setItem("gn:notepad", text);
      return;
    }
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      fetch("/api/notes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
      }).catch(() => {});
    }, 700);
  }, [text, loaded, mode]);

  const words = text.trim() ? text.trim().split(/\s+/).length : 0;

  return (
    <div className="flex h-full flex-col bg-[#f5f1e9] font-system text-[13px] text-[#161616]">
      <div className="flex items-center gap-3 border-b border-[#9a958a] px-2 py-1 text-xs">
        <span className="cursor-default hover:underline">Arquivo</span>
        <span className="cursor-default hover:underline">Editar</span>
        <button className="hover:underline" onClick={() => setText("")}>
          Limpar
        </button>
        <span className="ml-auto text-[#7a2c05]">
          {mode === "server" ? "● sincronizado (admin)" : "● salvo localmente"}
        </span>
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        spellCheck={false}
        placeholder="Digite aqui…"
        className="min-h-0 flex-1 resize-none bg-white p-3 font-mono text-[13px] leading-relaxed text-[#161616] outline-none"
      />
      <div className="flex justify-between border-t border-[#9a958a] px-2 py-1 text-[11px] text-[#5a564d]">
        <span>{words} palavras</span>
        <span>{text.length} caracteres</span>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- To-Do */

type Todo = { id: string; text: string; done: boolean };

export function TodoApp() {
  const { admin, ready } = useAdmin();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [value, setValue] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [mode, setMode] = useState<Mode>("local");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!ready) return;
    if (admin) {
      setMode("server");
      fetch("/api/todos")
        .then((r) => r.json())
        .then((d) =>
          setTodos(
            (d.todos ?? []).map((t: { id: string; text: string; done: boolean }) => ({
              id: t.id,
              text: t.text,
              done: t.done,
            })),
          ),
        )
        .catch(() => {})
        .finally(() => setLoaded(true));
    } else {
      setMode("local");
      try {
        setTodos(JSON.parse(localStorage.getItem("gn:todos") ?? "[]"));
      } catch {}
      setLoaded(true);
    }
  }, [ready, admin]);

  useEffect(() => {
    if (!loaded) return;
    if (mode === "local") {
      localStorage.setItem("gn:todos", JSON.stringify(todos));
      return;
    }
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      fetch("/api/todos", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(todos.map((t) => ({ text: t.text, done: t.done }))),
      }).catch(() => {});
    }, 600);
  }, [todos, loaded, mode]);

  const add = () => {
    const t = value.trim();
    if (!t) return;
    setTodos((p) => [...p, { id: crypto.randomUUID(), text: t, done: false }]);
    setValue("");
  };
  const remaining = todos.filter((t) => !t.done).length;

  return (
    <AppScroll className="flex flex-col">
      <AppHeading sub={`${remaining} restantes · ${mode === "server" ? "sincronizado" : "local"}`}>
        To-Do List
      </AppHeading>
      <div className="mb-3 flex gap-1.5">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="Adicione uma tarefa…"
          className="inset min-w-0 flex-1 bg-white px-2 py-1.5 outline-none"
        />
        <button className="btn-95" onClick={add}>
          Adicionar
        </button>
      </div>
      <ul className="space-y-1">
        {todos.length === 0 && <li className="text-[#9a958a]">Nada por aqui ainda. ❄️</li>}
        {todos.map((t) => (
          <li key={t.id} className="inset flex items-center gap-2 p-2">
            <input
              type="checkbox"
              checked={t.done}
              onChange={() =>
                setTodos((p) => p.map((x) => (x.id === t.id ? { ...x, done: !x.done } : x)))
              }
            />
            <span className={`min-w-0 flex-1 break-words ${t.done ? "text-[#9a958a] line-through" : ""}`}>
              {t.text}
            </span>
            <button
              className="text-[#7a2c05] hover:underline"
              onClick={() => setTodos((p) => p.filter((x) => x.id !== t.id))}
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
    </AppScroll>
  );
}

/* -------------------------------------------------------- Task Manager */

export function TaskManagerApp() {
  const { windows, closeApp, focus } = useDesktop();
  const [cpu, setCpu] = useState(7);

  useEffect(() => {
    const t = setInterval(() => {
      setCpu(Math.min(98, Math.max(3, 7 + windows.length * 9 + Math.round(Math.random() * 14))));
    }, 1200);
    return () => clearInterval(t);
  }, [windows.length]);

  return (
    <AppScroll className="flex flex-col">
      <AppHeading sub="processos e desempenho">Gerenciador de Tarefas</AppHeading>

      <div className="inset mb-3 p-2">
        <div className="mb-1 flex justify-between text-xs">
          <span>Uso de CPU</span>
          <span>{cpu}%</span>
        </div>
        <div className="h-3 w-full border border-[#161616] bg-white">
          <div className="h-full bg-[#1e8a3b] transition-all" style={{ width: `${cpu}%` }} />
        </div>
      </div>

      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-[#161616] text-xs text-[#5a564d]">
            <th className="py-1">Tarefa</th>
            <th>Status</th>
            <th className="text-right">Ação</th>
          </tr>
        </thead>
        <tbody>
          {windows.length === 0 && (
            <tr>
              <td colSpan={3} className="py-3 text-[#9a958a]">
                Nenhuma tarefa rodando.
              </td>
            </tr>
          )}
          {windows.map((w) => (
            <tr key={w.id} className="border-b border-[#dcd6c8]">
              <td className="py-1.5">
                <button className="hover:underline" onClick={() => focus(w.id)}>
                  {w.title}
                </button>
              </td>
              <td className="text-[#1e8a3b]">{w.minimized ? "Suspenso" : "Rodando"}</td>
              <td className="text-right">
                <button className="btn-95 text-xs" onClick={() => closeApp(w.id)}>
                  Encerrar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </AppScroll>
  );
}
