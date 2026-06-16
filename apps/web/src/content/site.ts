/**
 * Conteúdo central de todo o sistema — consumido pela landing, pelos comandos
 * do terminal e pelos apps do desktop. Os dados aqui são fictícios (placeholder)
 * para o Gustavo Neves.
 */

export const profile = {
  name: "Gustavo Neves",
  handle: "gneves",
  initials: "GN",
  role: "Desenvolvedor Full-Stack & Tecnólogo Criativo",
  shortRole: "Dev / Tecnólogo Criativo",
  location: "São Paulo, Brasil",
  timezone: "GMT-3",
  email: "hello@gustavoneves.dev",
  available: true,
  availableLabel: "Disponível para freelance — 3º tri. 2026",
  bio: "Crio experiências web rápidas e tácteis — de e-commerce headless e ferramentas em tempo real a playgrounds WebGL. Gosto de sistemas que parecem brinquedos: engenharia séria sob uma superfície divertida.",
  longBio:
    "Sou um desenvolvedor full-stack que trata o navegador como um meio criativo. Uns dez anos entregando software em produção — React/Next no front, Node e Postgres no back, e um carinho especial por shaders, áudio e qualquer coisa que faça uma interface ganhar vida. Este site é uma carta de amor aos computadores com que cresci: ele inicia como um terminal e se transforma num sistema operacional de desktop.",
  years: 10,
} as const;

export type Project = {
  slug: string;
  title: string;
  year: number;
  role: string;
  blurb: string;
  description: string;
  tags: string[];
  link?: string;
  repo?: string;
  accent?: string;
};

export const projects: Project[] = [
  {
    slug: "aurora-commerce",
    title: "Aurora Commerce",
    year: 2025,
    role: "Engenheiro Líder",
    blurb: "Plataforma de e-commerce headless com 9 dígitos de GMV.",
    description:
      "Um framework de loja headless com páginas de produto renderizadas na edge, um estúdio visual de merchandising e busca em menos de 50ms. Reduziu o time-to-first-byte em 70% sobre o monolito legado.",
    tags: ["Next.js", "GraphQL", "Edge", "Postgres"],
    link: "https://example.com/aurora",
    repo: "https://github.com/gneves/aurora",
    accent: "#ff6a1a",
  },
  {
    slug: "nebula-db",
    title: "Nebula DB",
    year: 2024,
    role: "Engenheiro Fundador",
    blurb: "Banco de dados colaborativo em tempo real com alma de planilha.",
    description:
      "Uma UI de banco de dados multiplayer — sync CRDT, cursores ao vivo e um canvas infinito de tabelas conectadas. Construí o motor de renderização e a resolução de conflitos do zero.",
    tags: ["TypeScript", "CRDT", "WebSockets", "Rust"],
    link: "https://example.com/nebula",
    repo: "https://github.com/gneves/nebula",
    accent: "#ff8a3d",
  },
  {
    slug: "frostbyte",
    title: "Frostbyte",
    year: 2024,
    role: "Criador",
    blurb: "Um playground de creative coding para shaders ao vivo.",
    description:
      "Escreva GLSL no navegador e veja reagir a áudio e webcam em tempo real. Uma ferramenta de ensino que virou uma pequena comunidade de 12 mil makers.",
    tags: ["WebGL", "GLSL", "Three.js", "Web Audio"],
    link: "https://example.com/frostbyte",
    repo: "https://github.com/gneves/frostbyte",
    accent: "#54a0ff",
  },
  {
    slug: "ceevee",
    title: "Ceevee",
    year: 2023,
    role: "Full-Stack",
    blurb: "Gerador de currículo com IA que não soa como robô.",
    description:
      "Mande um histórico bagunçado e receba um currículo afiado de uma página. Pipeline de LLM com streaming, saída estruturada e um motor de PDF perfeito para impressão.",
    tags: ["Next.js", "LLM", "Streaming", "PDF"],
    link: "https://example.com/ceevee",
    accent: "#1dd3b0",
  },
  {
    slug: "terminalia",
    title: "Terminalia",
    year: 2026,
    role: "Solo",
    blurb: "Este site — um portfólio que inicia como um computador.",
    description:
      "Uma landing premiada que desaba num terminal interativo e num desktop retrô arrastável, além de um envio de arquivos criptografado ponta a ponta. A coisa que você está usando agora.",
    tags: ["Next.js", "GSAP", "Three.js", "WebCrypto"],
    repo: "https://github.com/gneves/terminalia",
    accent: "#ff6a1a",
  },
];

export type StackGroup = { label: string; items: string[] };

export const stack: StackGroup[] = [
  {
    label: "Linguagens",
    items: ["TypeScript", "JavaScript", "Python", "SQL", "Java", "PHP", "Dart"],
  },
  {
    label: "Frameworks",
    items: ["Next.js", "React", "Node.js", "Prisma", "Three.js", "Django", "Flask"],
  },
  {
    label: "Criativo",
    items: ["GSAP", "WebGL", "Web Audio", "Remotion", "Framer Motion", "Canvas"],
  },
  {
    label: "Infra & Ferramentas",
    items: ["Postgres", "Docker", "Redis", "Caddy", "Vercel", "Figma"],
  },
];

export type ExperienceItem = {
  company: string;
  role: string;
  period: string;
  location: string;
  summary: string;
};

export const experience: ExperienceItem[] = [
  {
    company: "Aurora",
    role: "Engenheiro Frontend Líder",
    period: "2023 — Presente",
    location: "Remoto",
    summary:
      "Lidero um time de 5 construindo uma plataforma de e-commerce headless. Sou dono da arquitetura de renderização, do design system e do orçamento de performance.",
  },
  {
    company: "Nebula",
    role: "Engenheiro Fundador",
    period: "2021 — 2023",
    location: "Remoto",
    summary:
      "Primeira contratação de engenharia. Entreguei o motor de sync em tempo real, a UI em canvas e a API pública. Crescemos para 30 mil times.",
  },
  {
    company: "Pixelforge Studio",
    role: "Desenvolvedor Criativo",
    period: "2018 — 2021",
    location: "São Paulo",
    summary:
      "Construí sites de marketing premiados e experiências WebGL para marcas globais. Dois prêmios FWA Site do Dia.",
  },
  {
    company: "Freelance",
    role: "Desenvolvedor Web",
    period: "2016 — 2018",
    location: "São Paulo",
    summary:
      "Projetei e construí sites e ferramentas para pequenos negócios e startups pelo Brasil.",
  },
];

export const education = [
  {
    school: "Universidade de São Paulo (USP)",
    degree: "Bacharel em Ciência da Computação",
    period: "2014 — 2018",
  },
];

export type SocialLink = {
  label: string;
  handle: string;
  url: string;
  command: string;
};

export const socials: SocialLink[] = [
  { label: "GitHub", handle: "@gneves", url: "https://github.com/gneves", command: "github" },
  { label: "X / Twitter", handle: "@gnevesdev", url: "https://x.com/gnevesdev", command: "twitter" },
  { label: "LinkedIn", handle: "in/gneves", url: "https://linkedin.com/in/gneves", command: "linkedin" },
  { label: "Dribbble", handle: "@gneves", url: "https://dribbble.com/gneves", command: "dribbble" },
  { label: "Email", handle: profile.email, url: `mailto:${profile.email}`, command: "email" },
];

export const navSections = [
  { id: "intro", label: "Início", index: "01" },
  { id: "about", label: "Sobre", index: "02" },
  { id: "work", label: "Trabalhos", index: "03" },
  { id: "stack", label: "Stack", index: "04" },
  { id: "contact", label: "Contato", index: "05" },
] as const;
