import type { ReactNode } from "react";
import { profile, projects, stack, socials, experience, education } from "@/content/site";

/* ------------------------------------------------------------------ types */

export type CommandContext = {
  navigate: (path: string) => void;
  openApp?: (appId: string) => void;
  clear: () => void;
  setInput?: (value: string) => void;
};

export type CommandResult = {
  /** Nó renderizado da saída (null = sem saída). */
  output: ReactNode;
};

export type Command = {
  name: string;
  description: string;
  usage?: string;
  hidden?: boolean;
  run: (args: string[], ctx: CommandContext) => CommandResult | Promise<CommandResult>;
};

/* --------------------------------------------------------------- helpers */

const O = ({ children }: { children: ReactNode }) => (
  <span className="text-orange">{children}</span>
);
const Dim = ({ children }: { children: ReactNode }) => (
  <span className="text-[var(--muted)]">{children}</span>
);

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap gap-x-3">
      <span className="w-28 shrink-0 text-orange">{label}</span>
      <span className="text-[var(--fg-soft)]">{children}</span>
    </div>
  );
}

export const BANNER = String.raw`
   ___  _   _
  / __|| \ | | ___  _ _   ___  ___
 | (_ ||  \| |/ -_)| ' \ / -_)(_-<
  \___||_|\__|\___||_||_|\___|/__/
`;

/* -------------------------------------------------------------- registry */

export const commands: Record<string, Command> = {
  ajuda: {
    name: "ajuda",
    description: "lista todos os comandos disponíveis",
    run: () => ({
      output: (
        <div className="space-y-1">
          <p className="text-[var(--fg-soft)]">Comandos disponíveis — digite um e aperte enter:</p>
          <div className="mt-2 grid grid-cols-1 gap-x-8 gap-y-1 sm:grid-cols-2">
            {Object.values(commands)
              .filter((c) => !c.hidden)
              .map((c) => (
                <div key={c.name} className="flex gap-3">
                  <span className="w-32 shrink-0 text-orange">{c.name}</span>
                  <Dim>{c.description}</Dim>
                </div>
              ))}
          </div>
          <p className="mt-3 text-[var(--faint)]">
            dica: digite <O>gui</O> para abrir o desktop · <O>↑/↓</O> histórico · <O>Tab</O>{" "}
            autocompletar
          </p>
        </div>
      ),
    }),
  },

  sobre: {
    name: "sobre",
    description: "quem é o Gustavo Neves",
    run: () => ({
      output: (
        <div className="space-y-1">
          <Row label="nome">{profile.name}</Row>
          <Row label="função">{profile.role}</Row>
          <Row label="local">
            {profile.location} ({profile.timezone})
          </Row>
          <Row label="status">
            <span className={profile.available ? "text-orange" : ""}>{profile.availableLabel}</span>
          </Row>
          <p className="mt-3 max-w-2xl text-[var(--fg-soft)]">{profile.longBio}</p>
        </div>
      ),
    }),
  },

  projetos: {
    name: "projetos",
    description: "trabalhos selecionados",
    run: () => ({
      output: (
        <div className="space-y-3">
          {projects.map((p, i) => (
            <div key={p.slug}>
              <div className="flex flex-wrap items-baseline gap-3">
                <span className="text-[var(--faint)]">{String(i + 1).padStart(2, "0")}</span>
                <span className="font-semibold" style={{ color: p.accent }}>
                  {p.title}
                </span>
                <Dim>
                  · {p.role} · {p.year}
                </Dim>
                {(p.link || p.repo) && (
                  <a
                    href={p.link ?? p.repo}
                    target="_blank"
                    rel="noreferrer"
                    className="text-orange underline-offset-2 hover:underline"
                  >
                    [abrir ↗]
                  </a>
                )}
              </div>
              <p className="max-w-2xl pl-8 text-[var(--fg-soft)]">{p.description}</p>
            </div>
          ))}
        </div>
      ),
    }),
  },

  stack: {
    name: "stack",
    description: "linguagens, frameworks e ferramentas",
    run: () => ({
      output: (
        <div className="space-y-1">
          {stack.map((g) => (
            <Row key={g.label} label={g.label.toLowerCase()}>
              {g.items.join("  ·  ")}
            </Row>
          ))}
        </div>
      ),
    }),
  },

  curriculo: {
    name: "curriculo",
    description: "experiência e formação",
    run: () => ({
      output: (
        <div className="space-y-3">
          <p className="text-orange">experiência</p>
          {experience.map((e) => (
            <div key={e.company} className="pl-2">
              <div className="flex flex-wrap gap-x-3">
                <span className="font-semibold text-[var(--fg)]">{e.role}</span>
                <Dim>
                  @ {e.company} · {e.period} · {e.location}
                </Dim>
              </div>
              <p className="max-w-2xl text-[var(--fg-soft)]">{e.summary}</p>
            </div>
          ))}
          <p className="mt-2 text-orange">formação</p>
          {education.map((ed) => (
            <div key={ed.school} className="pl-2 text-[var(--fg-soft)]">
              {ed.degree} — {ed.school} <Dim>({ed.period})</Dim>
            </div>
          ))}
          <p className="mt-2 text-[var(--faint)]">
            download:{" "}
            <a href="/resume.pdf" className="text-orange hover:underline">
              /resume.pdf
            </a>
          </p>
        </div>
      ),
    }),
  },

  social: {
    name: "social",
    description: "me encontre por aí",
    run: () => ({
      output: (
        <div className="space-y-1">
          {socials.map((s) => (
            <Row key={s.label} label={s.label.toLowerCase()}>
              <a href={s.url} target="_blank" rel="noreferrer" className="text-orange hover:underline">
                {s.handle}
              </a>
            </Row>
          ))}
        </div>
      ),
    }),
  },

  contato: {
    name: "contato",
    description: "fale comigo / envie um arquivo",
    run: () => ({
      output: (
        <div className="space-y-1 text-[var(--fg-soft)]">
          <Row label="email">
            <a href={`mailto:${profile.email}`} className="text-orange hover:underline">
              {profile.email}
            </a>
          </Row>
          <p className="mt-2">
            Quer me enviar um arquivo <O>criptografado</O>? Abra o desktop (<O>gui</O>) e use{" "}
            <O>Enviar Arquivo</O>. Para descriptografar, abra <O>Descriptografar</O>.
          </p>
        </div>
      ),
    }),
  },

  jogos: {
    name: "jogos",
    description: "jogue alguma coisa",
    run: () => ({
      output: (
        <p className="text-[var(--fg-soft)]">
          O fliperama fica no desktop. Digite <O>gui</O> e abra <O>Jogos</O>. 🕹️
        </p>
      ),
    }),
  },

  enviar: {
    name: "enviar",
    description: "abre o envio de arquivo criptografado",
    run: (_args, ctx) => {
      if (ctx.openApp) ctx.openApp("send");
      else ctx.navigate("/system/desktop?open=send");
      return { output: <span className="text-orange">abrindo Enviar Arquivo…</span> };
    },
  },

  descriptografar: {
    name: "descriptografar",
    description: "abre o descriptografador de arquivos",
    run: (_args, ctx) => {
      if (ctx.openApp) ctx.openApp("decrypt");
      else ctx.navigate("/system/desktop?open=decrypt");
      return { output: <span className="text-orange">abrindo Descriptografar…</span> };
    },
  },

  gui: {
    name: "gui",
    description: "abre o desktop retrô",
    run: (_args, ctx) => {
      if (ctx.openApp) {
        return { output: <span className="text-orange">o desktop já está aberto.</span> };
      }
      ctx.navigate("/system/desktop");
      return {
        output: <span className="text-orange">iniciando servidor X… carregando GnevesOS 2000…</span>,
      };
    },
  },

  quemsou: {
    name: "quemsou",
    description: "mostra o usuário atual",
    run: () => ({ output: <span className="text-[var(--fg-soft)]">visitante@gneves.dev</span> }),
  },

  banner: {
    name: "banner",
    description: "mostra o banner",
    run: () => ({
      output: <pre className="text-orange leading-tight">{BANNER}</pre>,
    }),
  },

  limpar: {
    name: "limpar",
    description: "limpa a tela",
    run: (_args, ctx) => {
      ctx.clear();
      return { output: null };
    },
  },

  sair: {
    name: "sair",
    description: "volta para a página inicial",
    run: (_args, ctx) => {
      ctx.navigate("/");
      return { output: <span className="text-[var(--muted)]">saindo…</span> };
    },
  },

  /* --------------------------------------------------- escondidos / extras */

  data: {
    name: "data",
    description: "data e hora atuais",
    hidden: true,
    run: () => ({
      output: <span className="text-[var(--fg-soft)]">{new Date().toLocaleString("pt-BR")}</span>,
    }),
  },

  eco: {
    name: "eco",
    description: "repete um texto",
    hidden: true,
    run: (args) => ({ output: <span className="text-[var(--fg-soft)]">{args.join(" ")}</span> }),
  },

  ls: {
    name: "ls",
    description: "lista o diretório",
    hidden: true,
    run: () => ({
      output: (
        <div className="flex flex-wrap gap-x-6 text-[var(--fg-soft)]">
          <span className="text-orange">sobre/</span>
          <span className="text-orange">projetos/</span>
          <span className="text-orange">desktop/</span>
          <span>curriculo.pdf</span>
          <span>contato.txt</span>
          <span>.secreto</span>
        </div>
      ),
    }),
  },

  sudo: {
    name: "sudo",
    description: "elevar privilégios",
    hidden: true,
    run: () => ({
      output: (
        <span className="text-[var(--fg-soft)]">
          visitante não está no arquivo sudoers. Este incidente será reportado. ❄️
        </span>
      ),
    }),
  },

  login: {
    name: "login",
    description: "autenticar como admin",
    usage: "login <senha>",
    hidden: true,
    run: async (args) => {
      const pw = args.join(" ");
      if (!pw)
        return { output: <span className="text-[var(--fg-soft)]">uso: login &lt;senha&gt;</span> };
      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password: pw }),
        });
        if (res.ok) {
          return {
            output: (
              <span className="text-orange">bem-vindo de volta, gustavo. modo admin ativado. ❄️</span>
            ),
          };
        }
        if (res.status === 429)
          return { output: <span className="text-red-400">muitas tentativas. aguarde um minuto.</span> };
        return { output: <span className="text-red-400">senha incorreta.</span> };
      } catch {
        return { output: <span className="text-red-400">erro de rede.</span> };
      }
    },
  },

  logout: {
    name: "logout",
    description: "encerrar a sessão admin",
    hidden: true,
    run: async () => {
      await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
      return { output: <span className="text-[var(--muted)]">sessão admin encerrada.</span> };
    },
  },
};

/** English (and a few extra) aliases mapped to the Portuguese commands. */
const aliases: Record<string, string> = {
  help: "ajuda",
  about: "sobre",
  projects: "projetos",
  resume: "curriculo",
  cv: "curriculo",
  contact: "contato",
  games: "jogos",
  whoami: "quemsou",
  clear: "limpar",
  cls: "limpar",
  exit: "sair",
  send: "enviar",
  decrypt: "descriptografar",
  date: "data",
  echo: "eco",
  startx: "gui",
};

export const commandNames = Array.from(
  new Set([...Object.keys(commands), ...Object.keys(aliases)]),
).sort();

/** Execute a raw input line. Returns the command result, or an error node. */
export async function runCommand(raw: string, ctx: CommandContext): Promise<CommandResult> {
  const trimmed = raw.trim();
  if (!trimmed) return { output: null };
  const [rawName, ...args] = trimmed.split(/\s+/);
  const name = rawName.toLowerCase();
  const key = aliases[name] ?? name;
  const cmd = commands[key];
  if (!cmd) {
    return {
      output: (
        <span className="text-[var(--fg-soft)]">
          comando não encontrado: <span className="text-red-400">{rawName}</span> — digite{" "}
          <span className="text-orange">ajuda</span>
        </span>
      ),
    };
  }
  return cmd.run(args, ctx);
}
