/** Maps a tech name to a logo URL (Simple Icons CDN, Devicon for a few). */

const slugs: Record<string, string> = {
  TypeScript: "typescript",
  JavaScript: "javascript",
  Python: "python",
  PHP: "php",
  Dart: "dart",
  "Next.js": "nextdotjs",
  React: "react",
  "Node.js": "nodedotjs",
  Prisma: "prisma",
  "Three.js": "threedotjs",
  Django: "django",
  Flask: "flask",
  GSAP: "greensock",
  WebGL: "webgl",
  Remotion: "remotion",
  "Framer Motion": "framer",
  Postgres: "postgresql",
  Docker: "docker",
  Redis: "redis",
  Caddy: "caddy",
  Vercel: "vercel",
  Figma: "figma",
};

const fullUrls: Record<string, string> = {
  Java: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/java/java-original.svg",
  SQL: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/azuresqldatabase/azuresqldatabase-original.svg",
};

/** Returns a logo URL for a tech name, or null to use a lettered fallback. */
export function techLogoUrl(name: string): string | null {
  if (fullUrls[name]) return fullUrls[name];
  const slug = slugs[name];
  return slug ? `https://cdn.simpleicons.org/${slug}` : null;
}
