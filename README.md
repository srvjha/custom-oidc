# srvAuth

A self-hosted OpenID Connect / OAuth 2.0 identity platform. The repository contains everything needed to run a production-grade IdP, register OAuth clients through a developer console, and integrate authentication into consumer Next.js apps with a single SDK.

## What's in this repo

This is a four-package monorepo:

| Package | Path | Description |
| --- | --- | --- |
| Backend (IdP) | `backend/` | OIDC + OAuth 2.0 server. Express + TypeScript + PostgreSQL (Drizzle ORM). RS256-signed JWTs. |
| Developer console | `frontend/` | Next.js 16 App Router app where developers sign up, register clients, manage redirect URIs, and read the integration docs. |
| SDK | `srvauth-package/` | `@srvauth/sdk` — a Next.js SDK published to npm. One catch-all route handler, one provider, two buttons, and a `useUser()` hook. |
| Demo app | `demo-app/` | Reference Next.js consumer that wires up the SDK end-to-end, useful when validating changes to either side. |

## Architecture at a glance

```
+------------------+        +-----------------------+        +-------------------+
|  Consumer app    |        |  Developer console    |        |  Backend (IdP)    |
|  (Next.js + SDK) |  --->  |  /authorize, /consent |  --->  |  /o/token         |
|                  |  <---  |  (frontend/)          |  <---  |  /o/userinfo      |
+------------------+        +-----------------------+        +-------------------+
        |                                                              ^
        | uses @srvauth/sdk                                             |
        | (npm)                                                         |
        +--------------------------------------------------------------+
              code exchange + refresh + userinfo over HTTPS
```

The consumer app never talks to the consent UI directly — `SignInButton` redirects the user's browser to the developer console host, which renders the consent screen and hands back an authorization code. The SDK's route handler exchanges that code at the backend and stores the rotated refresh token in an HttpOnly cookie.

## Quick start (local development)

You'll need four terminals: one for Postgres, one for the backend, one for the frontend, and (optionally) one for the demo app.

### 0. Prerequisites

- Node.js 18 or later
- pnpm (used by the backend) and npm (used by the frontend / demo)
- Docker (for Postgres) or a local PostgreSQL 16+ instance
- OpenSSL on `PATH` for generating RSA signing keys

### 1. Start PostgreSQL

```bash
cd backend
docker compose up -d
```

This brings up Postgres 17 on port `5432` with `postgres / postgres` as the credentials.

### 2. Configure and run the backend

```bash
cd backend
pnpm install
bash key-gen.sh                  # generates cert/private-key.pem and cert/public-key.pub
cp .env.example .env             # if present; otherwise create one (see below)
pnpm db:generate
pnpm db:push
pnpm dev
```

Minimum `.env` for the backend:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/postgres
ISSUER=http://localhost:8000
PORT=8000
AUTHORIZE_URL=http://localhost:3000
DEVELOPER_CONSOLE_URL=http://localhost:3000
```

The backend listens on `http://localhost:8000` and exposes the standard OIDC discovery document at `/.well-known/openid-configuration`.

### 3. Run the developer console (frontend)

```bash
cd frontend
npm install
npm run dev
```

The console runs at `http://localhost:3000`. Sign up, then create an OAuth client to obtain a Client ID and Client Secret. The secret is shown exactly once.

### 4. (Optional) Run the demo consumer

```bash
cd demo-app
npm install
cp .env.local.example .env.local  # if present, otherwise create one
npm run dev
```

The demo runs at `http://localhost:3001`. Set its `.env.local` to the values issued by the developer console:

```env
NEXT_PUBLIC_AUTH_URL=http://localhost:8000
NEXT_PUBLIC_AUTH_UI_URL=http://localhost:3000
NEXT_PUBLIC_CLIENT_ID=cl_xxx
NEXT_PUBLIC_REDIRECT_URI=http://localhost:3001/api/auth/srvauth/callback
CLIENT_SECRET=sk_xxx
```

Make sure `http://localhost:3001/api/auth/srvauth/callback` is whitelisted as a redirect URI on the OAuth client.

## Integrating srvAuth into your own Next.js app

Once your IdP is running and you've registered a client, three files connect a fresh Next.js app to srvAuth.

### 1. Install the SDK

```bash
npm install @srvauth/sdk
```

### 2. Mount the catch-all route handler

`app/api/auth/srvauth/[...srvauth]/route.ts`

```ts
import { createSrvAuthHandler } from "@srvauth/sdk/dist/server";

const handler = createSrvAuthHandler({
  authUrl:      process.env.NEXT_PUBLIC_AUTH_URL!,
  clientId:     process.env.NEXT_PUBLIC_CLIENT_ID!,
  clientSecret: process.env.CLIENT_SECRET!,
  redirectUri:  process.env.NEXT_PUBLIC_REDIRECT_URI!,
});

export { handler as GET, handler as POST };
```

### 3. Wrap your tree with the provider and render the buttons

```tsx
// app/providers.tsx
"use client";
import { SrvAuthProvider } from "@srvauth/sdk";
export function Providers({ children }: { children: React.ReactNode }) {
  return <SrvAuthProvider>{children}</SrvAuthProvider>;
}

// any client component
"use client";
import { SignInButton, SignOutButton, useUser } from "@srvauth/sdk";

export default function Page() {
  const { user, isLoading } = useUser();
  if (isLoading) return null;
  return user
    ? <SignOutButton>Log out</SignOutButton>
    : <SignInButton>Continue with srvAuth</SignInButton>;
}
```

A full walkthrough — including the env-var reference, scope behavior, and troubleshooting — lives at `/docs` in the developer console.

## Environment variables (consumer side)

| Variable | Scope | Required | Notes |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_AUTH_URL` | Public | Yes | Base URL of the backend (`/o/token`, `/o/userinfo`). |
| `NEXT_PUBLIC_AUTH_UI_URL` | Public | Yes | Base URL of the developer console (`/authorize` lives here). |
| `NEXT_PUBLIC_CLIENT_ID` | Public | Yes | Client ID issued by the console. |
| `NEXT_PUBLIC_REDIRECT_URI` | Public | Yes | Must match a URI whitelisted on the client. |
| `CLIENT_SECRET` | Server | Yes | Issued once on client creation. Never prefix with `NEXT_PUBLIC_`. |

## Endpoint reference (backend)

| Endpoint | Purpose |
| --- | --- |
| `GET /.well-known/openid-configuration` | OIDC discovery document. |
| `GET /auth/certs` | JWKS — RSA public keys used for verifying access and ID tokens. |
| `GET /o/authorize` | Authorization endpoint. Returns JSON instructing the consent UI when login or consent is needed. |
| `POST /o/consent` | Internal endpoint used by the consent screen to record a user decision. |
| `POST /o/token` | Token endpoint. Authorization Code and Refresh Token grants. |
| `GET /o/userinfo` | Identity claims for the bearer access token. |
| `POST /auth/sign-up`, `/auth/sign-in`, `/auth/sign-out`, `GET /auth/me` | First-party user auth used by the developer console. |
| `POST/GET/DELETE /oauth/clients` | First-party OAuth client management. |

The backend ships its own `backend/README.md` with full request and response payloads.

## Tech stack

- Backend: Node.js, Express 5, TypeScript, Drizzle ORM, PostgreSQL, `node-jose`, `jsonwebtoken`, Zod.
- Frontend: Next.js 16 (App Router), React 19, Tailwind CSS 4, shadcn primitives, framer-motion.
- SDK: TypeScript package built with `tsup`, ships ESM + CJS + types.
- Demo: Next.js 16 + the SDK.

## Security highlights

- Passwords stored with SHA-256 HMAC and per-user salts.
- Client secrets stored as SHA-256 hashes; raw values surface to the developer exactly once.
- Access and ID tokens signed with RS256 (RSA-2048). Public keys exposed at `/auth/certs`.
- Refresh-token rotation: every token use revokes the previous token and issues a new one. Reusing a revoked token invalidates the chain.
- All consumer-side configuration uses HttpOnly cookies for refresh tokens; access tokens stay in memory.
- Strict request validation via Zod on every backend route.

## Project layout

```
oidc/
  backend/           Express + Drizzle OIDC server (this is the IdP)
    src/app/auth/    First-party user auth
    src/app/oauth/   OAuth client management
    src/app/openid/  OIDC protocol endpoints
    cert/            RSA keys (generated, not committed)
    drizzle/         Migrations
  frontend/          Next.js developer console
    app/             App Router pages (/, /docs, /authorize, /dashboard)
    components/      home, dashboard, auth modals, layout, ui primitives
  srvauth-package/   @srvauth/sdk source
    src/server.ts    createSrvAuthHandler — code exchange, /me, /signout
    src/client.tsx   SrvAuthProvider + useUser
    src/components.tsx  SignInButton, SignOutButton
  demo-app/          Reference Next.js consumer
```

## Useful commands

```bash
# Backend
cd backend
pnpm dev                 # tsc-watch + node dist/index.js
pnpm db:generate         # generate Drizzle migrations
pnpm db:push             # apply schema to DB
pnpm db:studio           # open Drizzle Studio

# Frontend
cd frontend
npm run dev              # next dev
npm run build            # next build
npm run lint             # eslint

# SDK
cd srvauth-package
npm run build            # tsup
npm run dev              # tsup --watch

# Demo app
cd demo-app
npm run dev
```

## License

ISC. See individual package manifests for details.
