"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  Copy,
  ExternalLink,
  FileCode,
  Folder,
  Globe,
  KeyRound,
  Lock,
  Package,
  Rocket,
  Server,
  Shield,
  Sparkles,
  Terminal,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Footer from "@/components/layout/Footer";
import { cn } from "@/lib/utils";

type NavItem = { id: string; label: string };
type NavGroup = { title: string; items: NavItem[] };

const NAV: NavGroup[] = [
  {
    title: "Get started",
    items: [
      { id: "overview", label: "Overview" },
      { id: "prerequisites", label: "Prerequisites" },
      { id: "register-app", label: "1. Register your app" },
      { id: "install", label: "2. Install the SDK" },
    ],
  },
  {
    title: "Configure",
    items: [
      { id: "env", label: "3. Environment variables" },
      { id: "route-handler", label: "4. Add the route handler" },
      { id: "provider", label: "5. Wrap with the provider" },
      { id: "ui", label: "6. Sign-in & sign-out" },
    ],
  },
  {
    title: "Reference",
    items: [
      { id: "use-user", label: "useUser() hook" },
      { id: "endpoints", label: "OIDC endpoints" },
      { id: "scopes", label: "Scopes & claims" },
      { id: "troubleshoot", label: "Troubleshooting" },
    ],
  },
];

const ENV_VARS: {
  name: string;
  scope: "Public" | "Server";
  required: boolean;
  description: string;
  example: string;
}[] = [
  {
    name: "NEXT_PUBLIC_AUTH_URL",
    scope: "Public",
    required: true,
    description:
      "Base URL of the srvAuth backend. The SDK calls /o/token and /o/userinfo on this host.",
    example: "https://auth.example.com",
  },
  {
    name: "NEXT_PUBLIC_AUTH_UI_URL",
    scope: "Public",
    required: true,
    description:
      "Base URL of the srvAuth consent UI. SignInButton redirects the user to /authorize on this host.",
    example: "https://login.example.com",
  },
  {
    name: "NEXT_PUBLIC_CLIENT_ID",
    scope: "Public",
    required: true,
    description:
      "Client ID issued by the developer console when you register your app. Safe to expose.",
    example: "cl_8f3b2e1a9d4c",
  },
  {
    name: "NEXT_PUBLIC_REDIRECT_URI",
    scope: "Public",
    required: true,
    description:
      "Must match the route the SDK mounts: <your-app>/api/auth/srvauth/callback. Whitelisted in the console.",
    example: "https://app.example.com/api/auth/srvauth/callback",
  },
  {
    name: "CLIENT_SECRET",
    scope: "Server",
    required: true,
    description:
      "Issued once at app creation in the developer console. Never prefix with NEXT_PUBLIC_ — it must stay server-side.",
    example: "sk_live_…",
  },
];

function CodeBlock({
  code,
  lang = "bash",
  filename,
}: {
  code: string;
  lang?: string;
  filename?: string;
}) {
  const [copied, setCopied] = useState(false);
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // ignore
    }
  };
  return (
    <div className="group/code relative overflow-hidden border border-border bg-[oklch(0.07_0_0)] ring-1 ring-foreground/5">
      {filename && (
        <div className="flex items-center justify-between border-b border-border bg-card/60 px-4 py-2 text-xs">
          <div className="flex items-center gap-2 font-mono text-muted-foreground">
            <FileCode className="h-3.5 w-3.5 text-primary/80" />
            {filename}
          </div>
          <span className="font-mono uppercase tracking-widest text-[10px] text-muted-foreground/70">
            {lang}
          </span>
        </div>
      )}
      <button
        type="button"
        onClick={onCopy}
        aria-label="Copy code"
        className={cn(
          "absolute right-3 top-3 z-10 inline-flex items-center gap-1.5 border border-border bg-card/80 px-2 py-1 text-[11px] font-medium text-muted-foreground backdrop-blur transition-all hover:text-foreground hover:border-primary/40",
          filename && "top-12"
        )}
      >
        {copied ? (
          <>
            <Check className="h-3 w-3 text-primary" /> Copied
          </>
        ) : (
          <>
            <Copy className="h-3 w-3" /> Copy
          </>
        )}
      </button>
      <pre className="overflow-x-auto px-4 py-4 text-[13px] leading-relaxed">
        <code className="font-mono text-foreground/90 whitespace-pre">
          {code}
        </code>
      </pre>
    </div>
  );
}

function Section({
  id,
  number,
  eyebrow,
  title,
  description,
  children,
}: {
  id: string;
  number?: string;
  eyebrow?: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 space-y-6">
      <div className="space-y-3">
        {eyebrow && (
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
            {number && (
              <span className="border border-primary px-1.5 py-0.5 font-mono text-[10px] text-primary">
                {number}
              </span>
            )}
            <span>{eyebrow}</span>
          </div>
        )}
        <h2 className="text-3xl font-bold tracking-tight md:text-[2rem]">
          {title}
        </h2>
        {description && (
          <p className="max-w-3xl text-base leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      <div className="space-y-5">{children}</div>
    </section>
  );
}

function ScopeBadge({ scope }: { scope: "Public" | "Server" }) {
  const isPublic = scope === "Public";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-widest",
        isPublic
          ? "border-foreground/20 text-muted-foreground"
          : "border-primary/40 bg-primary/5 text-primary"
      )}
    >
      {isPublic ? <Globe className="h-2.5 w-2.5" /> : <Lock className="h-2.5 w-2.5" />}
      {scope}
    </span>
  );
}

export default function DocsPage() {
  const [activeId, setActiveId] = useState<string>("overview");
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const ids = NAV.flatMap((g) => g.items.map((i) => i.id));
    const targets = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el));

    observerRef.current?.disconnect();
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-96px 0px -65% 0px", threshold: [0, 1] }
    );
    targets.forEach((t) => observerRef.current!.observe(t));
    return () => observerRef.current?.disconnect();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary/30">
      {/* Top header (slim, doc-specific) */}
      <header className="sticky top-0 z-40 w-full border-b border-white/5 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="flex h-8 w-8 items-center justify-center bg-primary/10 font-bold text-primary transition-colors group-hover:bg-primary/20">
              S
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-bold text-xl tracking-tighter">srvAuth</span>
              <span className="hidden text-xs uppercase tracking-[0.25em] text-muted-foreground sm:inline">
                / docs
              </span>
            </div>
          </Link>
          <div className="flex items-center gap-6">
            <a
              href="https://www.npmjs.com/package/@srvauth/sdk"
              target="_blank"
              rel="noreferrer"
              className="hidden items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
            >
              <Package className="h-3.5 w-3.5" /> @srvauth/sdk
              <ExternalLink className="h-3 w-3" />
            </a>
            <Link
              href="/"
              className="text-xs font-bold uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
            >
              ← Back to console
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto flex-grow px-6 py-12 lg:py-16">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[240px_minmax(0,1fr)]">
          {/* Sidebar TOC */}
          <aside className="hidden lg:block">
            <nav className="sticky top-24 space-y-7 text-sm">
              {NAV.map((group) => (
                <div key={group.title} className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground/70">
                    {group.title}
                  </p>
                  <ul className="space-y-1 border-l border-border">
                    {group.items.map((item) => {
                      const isActive = activeId === item.id;
                      return (
                        <li key={item.id}>
                          <a
                            href={`#${item.id}`}
                            className={cn(
                              "-ml-px block border-l border-transparent py-1.5 pl-4 text-sm transition-colors",
                              isActive
                                ? "border-primary text-foreground font-medium"
                                : "text-muted-foreground hover:text-foreground"
                            )}
                          >
                            {item.label}
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </nav>
          </aside>

          {/* Main content */}
          <article className="min-w-0 space-y-20 lg:space-y-24">
            {/* Hero */}
            <motion.section
              id="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="scroll-mt-24 space-y-6 border-b border-border/60 pb-14"
            >
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="outline"
                  className="border-primary bg-primary/5 text-primary"
                >
                  <Sparkles className="mr-1 h-3 w-3" />
                  Integration guide
                </Badge>
                <Badge
                  variant="outline"
                  className="border-border text-muted-foreground"
                >
                  <Package className="mr-1 h-3 w-3" /> @srvauth/sdk · v1.0.3
                </Badge>
              </div>
              <h1 className="text-4xl font-bold leading-[1.05] tracking-tight md:text-6xl">
                Add srvAuth to your{" "}
                <span className="text-primary">Next.js app</span> in under
                five minutes.
              </h1>
              <p className="max-w-3xl text-lg leading-relaxed text-muted-foreground md:text-xl">
                A drop-in OAuth 2.0 / OpenID Connect SDK for Next.js — register
                an app in the console, paste four environment variables, mount a
                catch-all route, and you&apos;re shipping authenticated screens.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <a
                  href="#install"
                  className="group inline-flex items-center gap-2 border border-primary bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-[0_0_30px_-8px_oklch(from_var(--primary)_l_c_h/0.6)] transition-all hover:brightness-110"
                >
                  <Rocket className="h-4 w-4" />
                  Quickstart
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </a>
                <a
                  href="https://www.npmjs.com/package/@srvauth/sdk"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 border border-border bg-card/40 px-5 py-2.5 text-sm font-medium text-foreground/90 transition-colors hover:border-primary/40"
                >
                  <Package className="h-4 w-4" /> View on npm
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                </a>
              </div>

              {/* Feature trio */}
              <div className="grid grid-cols-1 gap-4 pt-8 md:grid-cols-3">
                {[
                  {
                    icon: <KeyRound className="h-5 w-5" />,
                    title: "OAuth 2.0 + PKCE",
                    body: "Authorization Code grant with refresh-token rotation, baked in.",
                  },
                  {
                    icon: <Shield className="h-5 w-5" />,
                    title: "OpenID Connect",
                    body: "RS256-signed ID tokens, JWKS, and a /userinfo endpoint.",
                  },
                  {
                    icon: <Zap className="h-5 w-5" />,
                    title: "Zero boilerplate",
                    body: "One catch-all route handler, one provider, two buttons.",
                  },
                ].map((f) => (
                  <div
                    key={f.title}
                    className="border border-border bg-card/40 p-5 transition-colors hover:border-primary/40"
                  >
                    <div className="mb-3 flex h-9 w-9 items-center justify-center border border-primary text-primary">
                      {f.icon}
                    </div>
                    <h3 className="font-semibold">{f.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {f.body}
                    </p>
                  </div>
                ))}
              </div>
            </motion.section>

            {/* Prerequisites */}
            <Section
              id="prerequisites"
              eyebrow="Before you start"
              title="Prerequisites"
              description="The SDK is built for Next.js (App Router). Make sure you have these in place before continuing."
            >
              <ul className="grid gap-3 sm:grid-cols-2">
                {[
                  ["Next.js 14 or later", "App Router; Pages Router is not supported."],
                  ["React 18+", "Required by the client provider and hooks."],
                  ["A srvAuth account", "Sign up in the developer console to register an app."],
                  ["A reachable callback URL", "https://localhost:3000 works for dev."],
                ].map(([t, d]) => (
                  <li
                    key={t}
                    className="flex items-start gap-3 border border-border bg-card/30 p-4"
                  >
                    <div className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center border border-primary text-primary">
                      <Check className="h-3 w-3" />
                    </div>
                    <div>
                      <p className="font-medium">{t}</p>
                      <p className="text-sm text-muted-foreground">{d}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </Section>

            {/* Step 1 — Register */}
            <Section
              id="register-app"
              number="01"
              eyebrow="Step 1"
              title="Register your application"
              description="Open the developer console, create a new application, and add at least one redirect URI. The console will issue a Client ID and a Client Secret — the secret is shown exactly once, so copy it immediately into your password manager."
            >
              <div className="border border-border bg-card/30 p-5">
                <p className="mb-3 text-sm text-muted-foreground">
                  Use this exact path as a redirect URI for your Next.js app:
                </p>
                <CodeBlock
                  code={`https://your-app.com/api/auth/srvauth/callback`}
                  lang="url"
                />
                <p className="mt-3 text-xs text-muted-foreground">
                  You can register multiple URIs (one per environment). For local
                  development, add{" "}
                  <code className="rounded-none border border-border bg-[oklch(0.1_0_0)] px-1.5 py-0.5 font-mono text-[11px] text-foreground">
                    http://localhost:3000/api/auth/srvauth/callback
                  </code>
                  .
                </p>
              </div>
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:gap-2 transition-all"
              >
                Open the developer console <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Section>

            {/* Step 2 — Install */}
            <Section
              id="install"
              number="02"
              eyebrow="Step 2"
              title="Install the SDK"
              description="Pull the package into your Next.js app from npm. The SDK is ESM- and CJS-friendly, with type definitions included."
            >
              <div className="grid gap-3 md:grid-cols-3">
                <CodeBlock code={`npm install @srvauth/sdk`} lang="bash" />
                <CodeBlock code={`pnpm add @srvauth/sdk`} lang="bash" />
                <CodeBlock code={`yarn add @srvauth/sdk`} lang="bash" />
              </div>
            </Section>

            {/* Step 3 — Env */}
            <Section
              id="env"
              number="03"
              eyebrow="Step 3"
              title="Set environment variables"
              description="Drop these into the .env file at the root of your Next.js project. NEXT_PUBLIC_* values are inlined into the browser bundle by Next.js — only the CLIENT_SECRET stays server-side."
            >
              <div className="overflow-hidden border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-card/60 text-left">
                    <tr className="border-b border-border">
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                        Variable
                      </th>
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                        Scope
                      </th>
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                        Description
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {ENV_VARS.map((v) => (
                      <tr
                        key={v.name}
                        className="border-b border-border last:border-0 align-top hover:bg-card/30"
                      >
                        <td className="px-4 py-4 font-mono text-[12.5px]">
                          <div className="font-semibold text-foreground">
                            {v.name}
                            {v.required && (
                              <span className="ml-1.5 align-middle text-[10px] text-primary">
                                ●
                              </span>
                            )}
                          </div>
                          <div className="mt-1 text-[11px] text-muted-foreground/70">
                            e.g. {v.example}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <ScopeBadge scope={v.scope} />
                        </td>
                        <td className="px-4 py-4 text-muted-foreground leading-relaxed">
                          {v.description}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p className="text-xs text-muted-foreground">
                <span className="text-primary">●</span> required ·{" "}
                <span className="font-mono">NEXT_PUBLIC_*</span> is exposed to
                the browser, everything else stays on the server.
              </p>

              <div>
                <p className="mb-2 text-sm font-medium text-foreground">
                  Sample <code className="font-mono text-primary">.env.local</code>
                </p>
                <CodeBlock
                  filename=".env.local"
                  lang="env"
                  code={`# srvAuth — public (browser-readable)
NEXT_PUBLIC_AUTH_URL=https://auth.example.com
NEXT_PUBLIC_AUTH_UI_URL=https://login.example.com
NEXT_PUBLIC_CLIENT_ID=cl_8f3b2e1a9d4c
NEXT_PUBLIC_REDIRECT_URI=http://localhost:3000/api/auth/srvauth/callback

# srvAuth — server-only (NEVER prefix with NEXT_PUBLIC_)
CLIENT_SECRET=sk_live_replace_me`}
                />
              </div>

              <div className="border-l-2 border-primary bg-primary/5 p-4">
                <p className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Lock className="h-4 w-4 text-primary" /> Heads up
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  The redirect URI in your env <em>must</em> match a URI
                  whitelisted in the developer console exactly — protocol, host,
                  port, and path. Mismatches return{" "}
                  <code className="font-mono text-foreground">invalid_request</code>{" "}
                  from the authorize endpoint.
                </p>
              </div>
            </Section>

            {/* Step 4 — Route handler */}
            <Section
              id="route-handler"
              number="04"
              eyebrow="Step 4"
              title="Mount the route handler"
              description="The SDK ships a single catch-all handler that powers /callback (code exchange), /me (userinfo + transparent refresh), and /signout (cookie cleanup). Drop it under the path the SDK expects."
            >
              <div className="border border-border bg-card/30 p-5">
                <div className="mb-3 flex items-center gap-2 text-sm">
                  <Folder className="h-4 w-4 text-primary" />
                  <span className="font-mono text-muted-foreground">
                    File location
                  </span>
                </div>
                <CodeBlock
                  code={`app/
└── api/
    └── auth/
        └── srvauth/
            └── [...srvauth]/
                └── route.ts`}
                  lang="text"
                />
              </div>

              <CodeBlock
                filename="app/api/auth/srvauth/[...srvauth]/route.ts"
                lang="ts"
                code={`import { createSrvAuthHandler } from "@srvauth/sdk/dist/server";

const handler = createSrvAuthHandler({
  authUrl: process.env.NEXT_PUBLIC_AUTH_URL!,
  clientId: process.env.NEXT_PUBLIC_CLIENT_ID!,
  clientSecret: process.env.CLIENT_SECRET!,
  redirectUri: process.env.NEXT_PUBLIC_REDIRECT_URI!,
});

export { handler as GET, handler as POST };`}
              />

              <div className="grid gap-3 md:grid-cols-3">
                {[
                  {
                    route: "/callback",
                    icon: <Server className="h-4 w-4" />,
                    body: "Exchanges the auth code, sets an HttpOnly refresh_token cookie, redirects home.",
                  },
                  {
                    route: "/me",
                    icon: <Shield className="h-4 w-4" />,
                    body: "Returns { user, accessToken } and silently refreshes when the access token has expired.",
                  },
                  {
                    route: "/signout",
                    icon: <Lock className="h-4 w-4" />,
                    body: "Clears refresh_token + id_token cookies. Reload the page to update UI state.",
                  },
                ].map((r) => (
                  <div
                    key={r.route}
                    className="border border-border bg-card/30 p-4"
                  >
                    <div className="mb-2 flex items-center gap-2 text-primary">
                      {r.icon}
                      <code className="font-mono text-sm font-semibold">
                        {r.route}
                      </code>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {r.body}
                    </p>
                  </div>
                ))}
              </div>
            </Section>

            {/* Step 5 — Provider */}
            <Section
              id="provider"
              number="05"
              eyebrow="Step 5"
              title="Wrap your tree with the provider"
              description="The provider fetches the current session once on mount and exposes it via context. Keep it in a client component so it can run in the browser, then mount that component from your root layout."
            >
              <CodeBlock
                filename="app/providers.tsx"
                lang="tsx"
                code={`"use client";

import { SrvAuthProvider as SDKProvider } from "@srvauth/sdk";

export function SrvAuthProvider({ children }: { children: React.ReactNode }) {
  return <SDKProvider>{children}</SDKProvider>;
}`}
              />
              <CodeBlock
                filename="app/layout.tsx"
                lang="tsx"
                code={`import { SrvAuthProvider } from "./providers";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SrvAuthProvider>{children}</SrvAuthProvider>
      </body>
    </html>
  );
}`}
              />
            </Section>

            {/* Step 6 — UI */}
            <Section
              id="ui"
              number="06"
              eyebrow="Step 6"
              title="Add sign-in & sign-out"
              description="Use the prebuilt buttons or roll your own — they each accept className and children, so you can dress them up to match your design system."
            >
              <CodeBlock
                filename="app/login/page.tsx"
                lang="tsx"
                code={`"use client";

import { SignInButton, useUser } from "@srvauth/sdk";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const { user, isLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) router.push("/profile");
  }, [user, isLoading, router]);

  return (
    <SignInButton className="rounded-md bg-emerald-500 px-4 py-3 text-white">
      Continue with srvAuth
    </SignInButton>
  );
}`}
              />
              <CodeBlock
                filename="app/profile/page.tsx"
                lang="tsx"
                code={`"use client";

import { SignOutButton, useUser } from "@srvauth/sdk";

export default function Profile() {
  const { user, isLoading } = useUser();

  if (isLoading) return <p>Loading…</p>;
  if (!user) return <p>Not signed in.</p>;

  return (
    <div>
      <h1>Hi, {user.name}</h1>
      <p>{user.email}</p>
      <SignOutButton>Log out</SignOutButton>
    </div>
  );
}`}
              />
            </Section>

            {/* useUser hook */}
            <Section
              id="use-user"
              eyebrow="API reference"
              title="useUser() hook"
              description="A typed React hook that surfaces the current session. Returns null while the request is in flight and after a failed refresh."
            >
              <div className="overflow-hidden border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-card/60 text-left">
                    <tr className="border-b border-border">
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                        Field
                      </th>
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                        Type
                      </th>
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                        Notes
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["user", "User | null", "OIDC userinfo (sub, email, name, …) — null when signed-out."],
                      ["accessToken", "string | null", "Bearer token for calling your own APIs that trust srvAuth."],
                      ["isLoading", "boolean", "True until the first /me request settles."],
                    ].map(([k, t, n]) => (
                      <tr
                        key={k}
                        className="border-b border-border last:border-0 align-top hover:bg-card/30"
                      >
                        <td className="px-4 py-3 font-mono text-foreground">{k}</td>
                        <td className="px-4 py-3 font-mono text-primary">{t}</td>
                        <td className="px-4 py-3 text-muted-foreground">{n}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>

            {/* Endpoints */}
            <Section
              id="endpoints"
              eyebrow="Reference"
              title="OIDC endpoints"
              description="The SDK speaks to these endpoints so you usually don't have to. Useful when debugging or integrating from a non-Next.js stack."
            >
              <div className="overflow-hidden border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-card/60 text-left">
                    <tr className="border-b border-border">
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                        Endpoint
                      </th>
                      <th className="px-4 py-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                        Purpose
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["/.well-known/openid-configuration", "Discovery document"],
                      ["/auth/certs", "JWKS — RS256 public keys"],
                      ["/o/authorize", "Auth request (consent + code)"],
                      ["/o/token", "Code → tokens; refresh-token rotation"],
                      ["/o/userinfo", "Identity claims for the access token"],
                    ].map(([e, p]) => (
                      <tr
                        key={e}
                        className="border-b border-border last:border-0 hover:bg-card/30"
                      >
                        <td className="px-4 py-3 font-mono text-foreground">
                          {e}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{p}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>

            {/* Scopes */}
            <Section
              id="scopes"
              eyebrow="Reference"
              title="Scopes & claims"
              description="By default SignInButton requests openid profile email. The ID token and /userinfo response include only the claims allowed by the scopes the user consented to."
            >
              <div className="grid gap-3 md:grid-cols-3">
                {[
                  {
                    scope: "openid",
                    claims: "sub",
                    body: "Always required. Mints a stable user identifier.",
                  },
                  {
                    scope: "profile",
                    claims: "name, preferred_username, picture",
                    body: "Display-friendly identity claims.",
                  },
                  {
                    scope: "email",
                    claims: "email, email_verified",
                    body: "Verified email address from the IdP.",
                  },
                ].map((s) => (
                  <div
                    key={s.scope}
                    className="border border-border bg-card/30 p-5"
                  >
                    <code className="font-mono text-sm font-semibold text-primary">
                      {s.scope}
                    </code>
                    <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                      {s.claims}
                    </p>
                    <p className="mt-3 text-sm text-muted-foreground">
                      {s.body}
                    </p>
                  </div>
                ))}
              </div>
            </Section>

            {/* Troubleshoot */}
            <Section
              id="troubleshoot"
              eyebrow="Reference"
              title="Troubleshooting"
            >
              <div className="space-y-3">
                {[
                  {
                    q: "redirect_uri_mismatch on /authorize",
                    a: "The URI sent by the SDK doesn't exactly match one in the console. Check protocol, port, and the trailing /api/auth/srvauth/callback segment.",
                  },
                  {
                    q: "useUser() returns null after a successful login",
                    a: "Confirm the route handler is reachable at /api/auth/srvauth/me, and that your refresh_token cookie is being set (check DevTools → Application → Cookies).",
                  },
                  {
                    q: "Code exchange fails with invalid_client",
                    a: "CLIENT_SECRET is wrong, or accidentally exposed via NEXT_PUBLIC_. Rotate the secret in the console and store it as a server-only env var.",
                  },
                  {
                    q: "CORS errors from the consent UI",
                    a: "Set DEVELOPER_CONSOLE_URL on the backend to your frontend origin so the backend CORS layer allows it.",
                  },
                ].map((item) => (
                  <details
                    key={item.q}
                    className="group border border-border bg-card/30 p-4 transition-colors open:border-primary/40"
                  >
                    <summary className="cursor-pointer list-none font-medium text-foreground/90 group-open:text-foreground flex items-center justify-between gap-3">
                      <span className="flex items-center gap-2">
                        <Terminal className="h-4 w-4 text-primary" />
                        {item.q}
                      </span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-90" />
                    </summary>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      {item.a}
                    </p>
                  </details>
                ))}
              </div>
            </Section>

            {/* CTA */}
            <section className="relative overflow-hidden border border-primary/30 bg-gradient-to-br from-primary/10 via-transparent to-transparent p-8 md:p-12">
              <div className="flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
                <div className="space-y-3">
                  <h3 className="text-2xl font-bold tracking-tight md:text-3xl">
                    Ship authenticated screens today.
                  </h3>
                  <p className="max-w-xl text-muted-foreground">
                    Register an app, paste your env, mount the handler. The
                    console gives you a working Client ID and Secret in one
                    click.
                  </p>
                </div>
                <Link
                  href="/"
                  className="group inline-flex items-center gap-2 border border-primary bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:brightness-110"
                >
                  Open the console
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            </section>
          </article>
        </div>
      </main>

      <Footer />
    </div>
  );
}
