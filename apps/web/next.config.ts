import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone server output for a small Docker runtime image.
  output: "standalone",
  // In a monorepo, trace deps from the repo root.
  outputFileTracingRoot: path.join(process.cwd(), "../../"),
  // Keep Prisma + driver adapter out of the bundle (loaded from node_modules).
  serverExternalPackages: ["@prisma/client", "@prisma/adapter-pg"],
};

export default nextConfig;
