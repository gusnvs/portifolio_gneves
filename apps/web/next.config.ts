import path from "node:path";
import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

// Content-Security-Policy — restricts where scripts, images, connections etc.
// may come from, mitigating XSS and limiting attack pivots.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://cdn.simpleicons.org https://cdn.jsdelivr.net https://*.amazonaws.com",
  "font-src 'self' data:",
  "connect-src 'self' https://*.amazonaws.com",
  "media-src 'self'",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
];

const nextConfig: NextConfig = {
  // Standalone server output for a small Docker runtime image.
  output: "standalone",
  // In a monorepo, trace deps from the repo root.
  outputFileTracingRoot: path.join(process.cwd(), "../../"),
  // Keep Prisma + driver adapter out of the bundle (loaded from node_modules).
  serverExternalPackages: ["@prisma/client", "@prisma/adapter-pg"],
  // Don't advertise the framework.
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
