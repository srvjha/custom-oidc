"use client";

import { motion, Variants } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Sparkles,
  Lock,
  Zap,
  ShieldCheck,
  Terminal,
  Copy,
  Check,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface HeroProps {
  onOpenRegister: () => void;
  onOpenLogin: () => void;
}

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const stagger: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const HERO_CODE = `import { createSrvAuthHandler } from "@srvauth/sdk/dist/server";

const handler = createSrvAuthHandler({
  authUrl: process.env.NEXT_PUBLIC_AUTH_URL!,
  clientId: process.env.NEXT_PUBLIC_CLIENT_ID!,
  clientSecret: process.env.CLIENT_SECRET!,
  redirectUri: process.env.NEXT_PUBLIC_REDIRECT_URI!,
});

export { handler as GET, handler as POST };`;

export default function Hero({ onOpenRegister, onOpenLogin }: HeroProps) {
  const [copied, setCopied] = useState(false);
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(HERO_CODE);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {}
  };

  return (
    <section className="relative overflow-hidden border-b border-border">
      {/* Background: radial glow + grid */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_-10%,oklch(from_var(--primary)_l_c_h/0.18),transparent_70%)]" />
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(to right, oklch(0.98 0.01 15 / 0.4) 1px, transparent 1px), linear-gradient(to bottom, oklch(0.98 0.01 15 / 0.4) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage:
            "radial-gradient(ellipse 80% 60% at 50% 0%, black 40%, transparent 100%)",
        }}
      />

      <div className="container relative z-10 mx-auto grid grid-cols-1 items-center gap-14 px-6 py-20 lg:grid-cols-[1.05fr_1fr] lg:py-28">
        {/* Left — copy + CTAs */}
        <motion.div
          className="space-y-7"
          initial="hidden"
          animate="visible"
          variants={stagger}
        >
          <motion.div
            variants={fadeUp}
            className="inline-flex items-center gap-2 border border-primary/40 bg-primary/5 px-3 py-1 text-xs font-semibold tracking-wide text-primary"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping bg-primary opacity-75" />
              <span className="relative inline-flex h-2 w-2 bg-primary" />
            </span>
            <span className="uppercase tracking-[0.18em]">
              OAuth 2.0 · OIDC · PKCE
            </span>
            <Sparkles className="h-3 w-3" />
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="text-5xl font-bold leading-[1.02] tracking-tight md:text-6xl lg:text-7xl"
          >
            Authentication, <br />
            <span className="bg-gradient-to-r from-primary via-primary to-primary/60 bg-clip-text text-transparent">
              shipped in minutes.
            </span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="max-w-xl text-lg leading-relaxed text-muted-foreground md:text-xl"
          >
            srvAuth is a self-hosted identity platform for modern web apps.
            Register a client, drop in our Next.js SDK, and ship sign-in flows
            backed by RS256 JWTs and rotated refresh tokens.
          </motion.p>

          <motion.div variants={fadeUp} className="flex flex-wrap gap-3 pt-2">
            <Button
              size="lg"
              onClick={onOpenRegister}
              className="group h-12 bg-primary px-6 text-base font-semibold text-primary-foreground shadow-[0_0_40px_-10px_oklch(from_var(--primary)_l_c_h/0.7)] hover:brightness-110"
            >
              Start building free
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Button>
            <Link href="/docs">
              <Button
                size="lg"
                variant="outline"
                className="h-12 border-border bg-card/40 px-6 text-base font-medium hover:border-primary/40"
              >
                <Terminal className="mr-2 h-4 w-4" />
                Read the docs
              </Button>
            </Link>
          </motion.div>

          <motion.div
            variants={fadeUp}
            className="grid grid-cols-3 gap-6 border-t border-border pt-8"
          >
            {[
              { icon: <Lock className="h-3.5 w-3.5" />, label: "RS256 + JWKS" },
              { icon: <Zap className="h-3.5 w-3.5" />, label: "60s auth codes" },
              {
                icon: <ShieldCheck className="h-3.5 w-3.5" />,
                label: "Token rotation",
              },
            ].map((s) => (
              <div
                key={s.label}
                className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-muted-foreground"
              >
                <span className="text-primary">{s.icon}</span>
                {s.label}
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Right — code preview */}
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
          className="relative"
        >
          <div className="absolute -inset-6 -z-10 bg-primary/10 blur-3xl" />

          {/* fake window */}
          <div className="relative overflow-hidden border border-border bg-[oklch(0.07_0_0)] shadow-2xl ring-1 ring-foreground/5">
            <div className="flex items-center justify-between border-b border-border bg-card/60 px-4 py-2.5">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-foreground/15" />
                <span className="h-2.5 w-2.5 rounded-full bg-foreground/15" />
                <span className="h-2.5 w-2.5 rounded-full bg-foreground/15" />
              </div>
              <div className="flex items-center gap-2 font-mono text-[11px] text-muted-foreground">
                <span className="text-primary/80">●</span>
                app/api/auth/srvauth/[...srvauth]/route.ts
              </div>
              <button
                type="button"
                onClick={onCopy}
                aria-label="Copy code"
                className="inline-flex items-center gap-1 border border-border px-1.5 py-0.5 text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
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
            </div>
            <pre className="overflow-x-auto px-5 py-5 font-mono text-[12.5px] leading-relaxed">
              <code className="block whitespace-pre text-foreground/90">
                <span className="text-muted-foreground">{`// `}</span>
                <span className="text-muted-foreground">
                  Drop this in once. That&apos;s it.
                </span>
                {"\n"}
                <span className="text-primary">import</span>{" "}
                <span>{`{ createSrvAuthHandler }`}</span>{" "}
                <span className="text-primary">from</span>{" "}
                <span className="text-emerald-300/80">{`"@srvauth/sdk/dist/server"`}</span>
                ;
                {"\n\n"}
                <span className="text-primary">const</span> handler ={" "}
                <span className="text-foreground">createSrvAuthHandler</span>(
                {"{"}
                {"\n  "}authUrl: process.env.
                <span className="text-amber-300/90">NEXT_PUBLIC_AUTH_URL</span>!,
                {"\n  "}clientId: process.env.
                <span className="text-amber-300/90">NEXT_PUBLIC_CLIENT_ID</span>
                !,{"\n  "}clientSecret: process.env.
                <span className="text-amber-300/90">CLIENT_SECRET</span>!,
                {"\n  "}redirectUri: process.env.
                <span className="text-amber-300/90">
                  NEXT_PUBLIC_REDIRECT_URI
                </span>
                !,{"\n"}
                {"}"});{"\n\n"}
                <span className="text-primary">export</span> {"{"} handler{" "}
                <span className="text-primary">as</span> GET, handler{" "}
                <span className="text-primary">as</span> POST {"}"};
              </code>
            </pre>
            <div className="border-t border-border bg-card/40 px-5 py-3">
              <button
                type="button"
                onClick={onOpenLogin}
                className="group flex w-full items-center justify-between text-left"
              >
                <div className="flex items-center gap-2 text-sm">
                  <span className="flex h-7 w-7 items-center justify-center bg-primary/10 text-primary">
                    <ShieldCheck className="h-3.5 w-3.5" />
                  </span>
                  <span className="font-medium text-foreground">
                    Try the live login flow
                  </span>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
