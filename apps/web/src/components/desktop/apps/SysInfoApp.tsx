"use client";

import { useState } from "react";

type TabKey = "arq" | "eng" | "seg" | "aws" | "dec";

const TABS: { key: TabKey; label: string }[] = [
  { key: "arq", label: "Arquitetura" },
  { key: "eng", label: "Engenharia" },
  { key: "seg", label: "Segurança" },
  { key: "aws", label: "AWS & Cloud" },
  { key: "dec", label: "Decisões" },
];

function Item({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="inset p-3">
      <p className="mb-1 font-bold text-[#7a2c05]">{title}</p>
      <p className="leading-relaxed text-[#2a2820]">{children}</p>
    </div>
  );
}

export function SysInfoApp() {
  const [tab, setTab] = useState<TabKey>("arq");

  return (
    <div className="flex h-full flex-col bg-[#f5f1e9] font-system text-[13px] text-[#161616]">
      <div className="border-b-2 border-[#161616] px-4 pt-3">
        <h2 className="font-display text-xl font-extrabold leading-none">Sobre o Sistema</h2>
        <p className="mb-2 mt-1 text-xs text-[#5a564d]">
          Não é só um site — a engenharia, a arquitetura e a segurança por trás do GnevesOS.
        </p>
        <div className="flex flex-wrap gap-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`btn-95 text-xs ${tab === t.key ? "!shadow-[inset_1px_1px_0_0_#000,inset_-1px_-1px_0_0_#fff]" : ""}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-4">
        {tab === "arq" && (
          <>
            <Item title="Monorepo (pnpm workspaces)">
              <code>apps/web</code> (o site/sistema em Next.js 16 + React 19 + TypeScript) e{" "}
              <code>apps/video</code> (Remotion, motion graphics do mascote).
            </Item>
            <Item title="Três camadas, uma base">
              Landing premiada (Three.js/GSAP) → Terminal interativo → Desktop retrô (este). Tudo
              compartilha conteúdo, tema e estado.
            </Item>
            <Item title="App Router + Server/Client Components">
              Páginas estáticas pré-renderizadas; lógica sensível em Route Handlers e Server
              Functions que rodam só no servidor (segredos nunca chegam ao cliente).
            </Item>
            <Item title="Window manager próprio">
              Este desktop tem um gerenciador de janelas em Zustand: foco, z-index, arrastar,
              redimensionar, minimizar/maximizar, taskbar e menu iniciar — feito do zero.
            </Item>
            <Item title="Deploy">
              Docker multi-stage (saída <code>standalone</code>) + Postgres + Caddy (HTTPS
              automático). Migrações aplicadas por um serviço one-shot no boot.
            </Item>
          </>
        )}

        {tab === "eng" && (
          <>
            <Item title="Criptografia em dupla camada">
              Arquivos passam por <strong>2 camadas</strong>: a interna é feita no navegador
              (WebCrypto) com a chave pública; a externa, no servidor (AES-256-GCM). A requisição
              nunca carrega o arquivo original — se interceptada, já é ilegível.
            </Item>
            <Item title="Híbrido RSA + AES">
              RSA-OAEP (4096) protege uma chave AES-256-GCM aleatória por arquivo. A descriptografia
              roda 100% no cliente; a chave privada nunca toca o servidor.
            </Item>
            <Item title="Tipos de ponta a ponta">
              TypeScript estrito do front ao back. Prisma gera tipos do banco; Zod valida toda
              entrada nas bordas.
            </Item>
            <Item title="Estado e performance">
              Zustand para o SO; lazy-loading do 3D; <code>next/image</code> otimiza assets;
              respeito a <code>prefers-reduced-motion</code>.
            </Item>
            <Item title="Motion graphics como código">
              O mascote é animado em Remotion (React → vídeo), versionado junto do código.
            </Item>
          </>
        )}

        {tab === "seg" && (
          <>
            <Item title="XSS (Cross-Site Scripting)">
              React escapa toda saída por padrão; zero <code>dangerouslySetInnerHTML</code>. Uma{" "}
              <strong>Content-Security-Policy</strong> restringe scripts/origens, mitigando injeção e
              pivot de ataque.
            </Item>
            <Item title="CSRF (Cross-Site Request Forgery)">
              Cookies de sessão <code>httpOnly</code> + <code>SameSite=Lax</code> + <code>Secure</code>{" "}
              (iron-session, cifrados). Mutações exigem sessão; validação de origem nas rotas.
            </Item>
            <Item title="SQL Injection">
              Acesso ao banco só via <strong>Prisma</strong> (queries parametrizadas) — nunca
              concatenação de SQL cru. Entradas validadas por schema antes de chegar ao banco.
            </Item>
            <Item title="Autenticação & segredos">
              Senhas com <strong>bcrypt</strong>; comparações em tempo constante; segredos só em
              variáveis de ambiente (nunca no bundle). Derivação de chave com PBKDF2.
            </Item>
            <Item title="Abuso & robôs">
              Rate-limiting por IP, honeypot anti-spam no guestbook, limites de tamanho/tipo de
              upload, e cabeçalhos de segurança (HSTS, X-Frame-Options, X-Content-Type-Options,
              Referrer-Policy, Permissions-Policy).
            </Item>
            <Item title="Princípio">
              Menor privilégio, validação nas bordas, e &quot;assuma que a rede é hostil&quot;.
              Por isso a dupla camada de cripto e os tokens.
            </Item>
          </>
        )}

        {tab === "aws" && (
          <>
            <Item title="Cloud pessoal sobre Amazon S3">
              O app <strong>Meu Cloud</strong> é um gerenciador de arquivos que reflete um bucket S3:
              criar/renomear/mover/excluir pastas e arquivos sincroniza direto com a AWS.
            </Item>
            <Item title="Acesso restrito">
              Só o dono entra — janela com login/senha forte e sessão por token. Operações de
              escrita exigem essa sessão no servidor.
            </Item>
            <Item title="Presigned URLs">
              Uploads/downloads usam URLs assinadas e temporárias: as credenciais da AWS ficam no
              servidor; o navegador fala direto com o S3 sem nunca ver a chave secreta.
            </Item>
            <Item title="IAM mínimo">
              A policy concede só o necessário no bucket — princípio do menor privilégio.
            </Item>
          </>
        )}

        {tab === "dec" && (
          <>
            <Item title="Por que Node em vez de PHP">
              Uma só linguagem (TypeScript) do front ao back, WebCrypto/node:crypto nativos e
              integração direta com Three.js/GSAP/Remotion.
            </Item>
            <Item title="Por que Prisma 7">
              Tipos seguros, driver adapters e migrações versionadas — além da proteção nativa
              contra SQL injection.
            </Item>
            <Item title="Por que um SO no navegador">
              Mostrar engenharia de UI de verdade (window manager, drag, estado) num formato lúdico
              e memorável — um portfólio que se usa, não só que se lê.
            </Item>
            <Item title="Trade-offs assumidos">
              Mais código próprio (menos libs mágicas) em troca de controle, performance e
              aprendizado demonstrável.
            </Item>
          </>
        )}
      </div>
    </div>
  );
}
