# Gustavo Neves — Portfolio & Interactive System

A developer portfolio that lives in three layers:

1. **Landing** — an award-style page: animated preloader, 3D hero (Three.js / R3F), custom cursor, GSAP + Lenis smooth scroll, and the snowman mascot in motion.
2. **Terminal** (`/system`) — a real interactive terminal. Type `help`, `about`, `projects`, `gui`…
3. **Retro desktop** (`/system/desktop`) — a Windows-2000-style OS with draggable windows: About, Projects, Stack, Social, Resume, Guestbook, Notepad, To-Do, Task Manager, Games, **Send File** (encrypted), **Decrypt**, and a Terminal.

Plus an end-to-end **encrypted file drop**: a visitor encrypts a file in the browser-bound flow and emails it to you; you decrypt it back, 100% client-side.

## Stack

- **Next.js 16** (App Router) · React 19 · TypeScript · Tailwind CSS v4
- **Three.js** (`@react-three/fiber`, `drei`, `postprocessing`) · **GSAP** + **Lenis** · **Zustand**
- **PostgreSQL** + **Prisma 7** (pg driver adapter) · **iron-session** auth
- **Nodemailer** (SMTP) · **WebCrypto** + `node:crypto` (RSA-OAEP + AES-256-GCM)
- **Remotion** for the mascot motion graphics (`apps/video`)
- **Docker** + **Caddy** for deployment

## Layout

```
apps/web      Next.js app (the site + system + API + crypto)
apps/video    Remotion compositions for the mascot (renders to apps/web/public/videos)
scripts       gen-keys, resume generator, crypto round-trip test
Dockerfile, docker-compose.yml, Caddyfile   deployment
```

## Local development

```bash
pnpm install

# 1) Database — start a Postgres (Docker example):
docker run -d --name gn-pg -e POSTGRES_USER=gn -e POSTGRES_PASSWORD=gnpass \
  -e POSTGRES_DB=gnportfolio -p 5432:5432 postgres:16

# 2) Env — apps/web/.env (already has working dev defaults):
#    DATABASE_URL, ADMIN_PASSWORD, SESSION_SECRET, RSA_PUBLIC_KEY

# 3) Generate the Prisma client + apply the schema:
pnpm --filter web exec prisma generate
pnpm --filter web exec prisma migrate deploy

# 4) Run it:
pnpm dev          # http://localhost:3000
```

Everything degrades gracefully without a DB (guestbook shows offline; To-Do/Notepad use localStorage).

## Admin (you)

Log in from the terminal: type `login <your-password>` (matches `ADMIN_PASSWORD` /
`ADMIN_PASSWORD_HASH`). As admin, the **To-Do** and **Notepad** sync to the server
and you can delete guestbook messages. `logout` ends the session.

## Encrypted file drop

```bash
pnpm gen:keys     # writes keys/ (gitignored) and prints RSA_PUBLIC_KEY for your .env
```

- **Vault mode** — file is encrypted to your RSA public key; only your private key opens it.
- **Password mode** — send to anyone; a one-time password (shown to the sender, shared out-of-band) opens it. You can always open it too, with your private key.

To decrypt, open the **Decrypt** app, drop the `.gnsec` file, and either paste your
`keys/private_key.pem` or enter the password. The key/password never leaves the browser.

Round-trip test (server running): `node scripts/crypto-roundtrip-test.mjs`

## Mascot videos (Remotion)

```bash
pnpm video:studio          # live preview
pnpm video:render          # renders mp4s into apps/web/public/videos/
```

The site uses the rendered clips and falls back to an animated PNG if they're absent.

## Deploy (VPS + Docker)

```bash
cp .env.example .env        # set DOMAIN, DATABASE_URL (host = db), secrets, SMTP, RSA_PUBLIC_KEY
docker compose up -d --build
```

Compose runs Postgres, applies migrations (one-shot `migrate` service), starts the
standalone Next server, and fronts it with Caddy (automatic HTTPS for your `DOMAIN`).
Point your domain's DNS at the server and you're live.

### Environment variables

| Var | Used for |
|---|---|
| `DATABASE_URL` | Postgres connection (host `db` in compose) |
| `SESSION_SECRET` | iron-session cookie (≥ 32 chars) |
| `ADMIN_PASSWORD_HASH` / `ADMIN_PASSWORD` | admin login (bcrypt hash preferred) |
| `RSA_PUBLIC_KEY` | base64 of your RSA public PEM (vault encryption) |
| `SMTP_HOST/PORT/USER/PASS` | email delivery for Send File |
| `MAIL_FROM` / `MAIL_TO` | sender / your vault inbox |
| `DOMAIN` | Caddy TLS host |

> Content (projects, experience, etc.) is placeholder data in `apps/web/src/content/site.ts`.
