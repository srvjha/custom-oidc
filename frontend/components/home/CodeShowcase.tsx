"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type Tab = {
  id: string;
  label: string;
  filename: string;
  code: string;
};

const TABS: Tab[] = [
  {
    id: "route",
    label: "Route handler",
    filename: "app/api/auth/srvauth/[...srvauth]/route.ts",
    code: `import { createSrvAuthHandler } from "@srvauth/sdk/dist/server";

const handler = createSrvAuthHandler({
  authUrl:      process.env.NEXT_PUBLIC_AUTH_URL!,
  clientId:     process.env.NEXT_PUBLIC_CLIENT_ID!,
  clientSecret: process.env.CLIENT_SECRET!,
  redirectUri:  process.env.NEXT_PUBLIC_REDIRECT_URI!,
});

export { handler as GET, handler as POST };`,
  },
  {
    id: "layout",
    label: "Provider",
    filename: "app/providers.tsx",
    code: `"use client";

import { SrvAuthProvider } from "@srvauth/sdk";

export function Providers({ children }: { children: React.ReactNode }) {
  return <SrvAuthProvider>{children}</SrvAuthProvider>;
}`,
  },
  {
    id: "page",
    label: "Sign-in",
    filename: "app/login/page.tsx",
    code: `"use client";

import { SignInButton, useUser } from "@srvauth/sdk";

export default function Login() {
  const { user, isLoading } = useUser();

  if (isLoading) return <p>Loading…</p>;
  if (user) return <p>Signed in as {user.email}</p>;

  return <SignInButton>Continue with srvAuth</SignInButton>;
}`,
  },
];

export default function CodeShowcase() {
  const [active, setActive] = useState<string>(TABS[0].id);
  const tab = TABS.find((t) => t.id === active)!;

  return (
    <section className="relative border-b border-border">
      <div className="container mx-auto grid grid-cols-1 items-center gap-14 px-6 py-24 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-6">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-primary">
            Developer experience
          </p>
          <h2 className="text-3xl font-bold tracking-tight md:text-5xl">
            Three files. <br />
            <span className="text-primary">Real auth.</span>
          </h2>
          <p className="max-w-md text-base leading-relaxed text-muted-foreground md:text-lg">
            No auth library reinventions. No bespoke session stores. Mount a
            handler, wrap with a provider, render a button — that&apos;s the
            entire integration.
          </p>

          <ul className="space-y-2 pt-2 text-sm">
            {[
              "Typed React hook for the current session",
              "HttpOnly refresh-token cookie out of the box",
              "Transparent token refresh on /me requests",
              "Works with App Router (Next.js 14 / 15 / 16)",
            ].map((item) => (
              <li
                key={item}
                className="flex items-center gap-2 text-muted-foreground"
              >
                <span className="font-mono text-primary">›</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative"
        >
          <div className="absolute -inset-6 -z-10 bg-primary/10 blur-3xl" />
          <div className="overflow-hidden border border-border bg-[oklch(0.07_0_0)] ring-1 ring-foreground/5 shadow-2xl">
            {/* tabs */}
            <div className="flex items-center border-b border-border bg-card/60">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActive(t.id)}
                  className={cn(
                    "relative px-4 py-2.5 text-xs font-medium uppercase tracking-widest transition-colors",
                    active === t.id
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {t.label}
                  {active === t.id && (
                    <span className="absolute inset-x-2 -bottom-px h-px bg-primary" />
                  )}
                </button>
              ))}
              <span className="ml-auto pr-4 font-mono text-[11px] text-muted-foreground/70">
                {tab.filename}
              </span>
            </div>
            <pre className="overflow-x-auto px-5 py-5 font-mono text-[12.5px] leading-relaxed">
              <code className="text-foreground/90">{tab.code}</code>
            </pre>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
