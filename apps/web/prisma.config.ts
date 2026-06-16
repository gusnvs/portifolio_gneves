import path from "node:path";
import process from "node:process";
import { defineConfig, env } from "prisma/config";

// Prisma 7 no longer auto-loads .env for the CLI — load it ourselves (no-op in
// production where env vars are provided directly).
try {
  process.loadEnvFile();
} catch {
  // no .env file present (e.g. production) — rely on the real environment
}

/**
 * Prisma 7 configuration. The connection URL for Migrate lives here (it is no
 * longer allowed in schema.prisma). The runtime client uses the pg driver
 * adapter configured in src/lib/prisma.ts.
 */
export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  migrations: {
    path: path.join("prisma", "migrations"),
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
