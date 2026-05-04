"use client";

import { motion, Variants } from "framer-motion";
import { Folder, KeyRound, UserCheck } from "lucide-react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const STEPS = [
  {
    n: "01",
    icon: <Folder className="h-5 w-5" />,
    title: "Register your app",
    body: "Create a client in the developer console. We mint a Client ID and a one-time Client Secret.",
  },
  {
    n: "02",
    icon: <KeyRound className="h-5 w-5" />,
    title: "Drop in the SDK",
    body: "npm install @srvauth/sdk, paste four env vars, mount the catch-all route. Done.",
  },
  {
    n: "03",
    icon: <UserCheck className="h-5 w-5" />,
    title: "Ship sign-in",
    body: "Wrap your tree with <SrvAuthProvider/>, render <SignInButton/>, and you have authenticated users.",
  },
];

export default function HowItWorks() {
  return (
    <section className="relative border-b border-border">
      <div className="container mx-auto px-6 py-24">
        <div className="mx-auto max-w-2xl space-y-4 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-primary">
            How it works
          </p>
          <h2 className="text-3xl font-bold tracking-tight md:text-5xl">
            From npm install to first login,{" "}
            <span className="text-primary">in three steps.</span>
          </h2>
        </div>

        <div className="relative mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* Connector line on md+ */}
          <div
            aria-hidden
            className="pointer-events-none absolute left-0 right-0 top-[42px] hidden h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent md:block"
          />

          {STEPS.map((s, i) => (
            <motion.div
              key={s.n}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={fadeUp}
              transition={{ delay: i * 0.1 }}
              className="relative space-y-5"
            >
              <div className="relative z-10 mx-auto flex h-[84px] w-[84px] items-center justify-center border border-primary/40 bg-background text-primary">
                {s.icon}
                <span className="absolute -right-2 -top-2 border border-primary bg-background px-1.5 py-0.5 font-mono text-[10px] font-bold text-primary">
                  {s.n}
                </span>
              </div>
              <div className="space-y-2 text-center">
                <h3 className="text-xl font-semibold tracking-tight">
                  {s.title}
                </h3>
                <p className="mx-auto max-w-xs text-sm leading-relaxed text-muted-foreground">
                  {s.body}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-14 text-center">
          <Link
            href="/docs"
            className="inline-flex items-center gap-2 border border-border bg-card/40 px-5 py-2.5 text-sm font-medium transition-colors hover:border-primary/40"
          >
            Walk through the full guide
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
