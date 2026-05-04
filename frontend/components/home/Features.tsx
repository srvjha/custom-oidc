"use client";

import { motion, Variants } from "framer-motion";
import {
  Shield,
  KeyRound,
  RefreshCw,
  FileKey,
  Users,
  Globe,
} from "lucide-react";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const FEATURES = [
  {
    icon: <KeyRound className="h-5 w-5" />,
    title: "Authorization Code + PKCE",
    body: "Standards-compliant Authorization Code grant with PKCE for SPAs and native apps. No magic, just OAuth done right.",
  },
  {
    icon: <Shield className="h-5 w-5" />,
    title: "OpenID Connect",
    body: "ID tokens, /userinfo, and a fully-served discovery document at /.well-known/openid-configuration.",
  },
  {
    icon: <FileKey className="h-5 w-5" />,
    title: "RS256 + JWKS",
    body: "Asymmetric signing with public keys exposed via /auth/certs — verify tokens without sharing secrets.",
  },
  {
    icon: <RefreshCw className="h-5 w-5" />,
    title: "Refresh-token rotation",
    body: "Random 32-byte refresh tokens rotated on every use. Reuse a stale token and the chain is invalidated.",
  },
  {
    icon: <Users className="h-5 w-5" />,
    title: "Granular consent",
    body: "Scope-aware consent UI. Stored consents are merged on re-authorize so users aren't pestered for permissions they've already granted.",
  },
  {
    icon: <Globe className="h-5 w-5" />,
    title: "Self-hosted",
    body: "Run it next to your services on Postgres. No vendor lock-in, no per-MAU pricing surprises.",
  },
];

export default function Features() {
  return (
    <section className="relative border-b border-border">
      <div className="container mx-auto px-6 py-24">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={stagger}
          className="mx-auto max-w-2xl space-y-4 text-center"
        >
          <motion.p
            variants={fadeUp}
            className="text-xs font-bold uppercase tracking-[0.25em] text-primary"
          >
            Everything in the box
          </motion.p>
          <motion.h2
            variants={fadeUp}
            className="text-3xl font-bold tracking-tight md:text-5xl"
          >
            Identity primitives that don&apos;t leak.
          </motion.h2>
          <motion.p
            variants={fadeUp}
            className="text-base text-muted-foreground md:text-lg"
          >
            Every feature you&apos;d expect from a production-grade IdP — and
            none of the legacy cruft.
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={stagger}
          className="mt-14 grid grid-cols-1 gap-px border border-border bg-border md:grid-cols-2 lg:grid-cols-3"
        >
          {FEATURES.map((f) => (
            <motion.div
              key={f.title}
              variants={fadeUp}
              className="group relative bg-background p-7 transition-colors hover:bg-card/50"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center border border-primary/40 bg-primary/5 text-primary transition-colors group-hover:bg-primary/10">
                {f.icon}
              </div>
              <h3 className="text-lg font-semibold tracking-tight">
                {f.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {f.body}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
