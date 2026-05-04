"use client";

import { motion } from "framer-motion";
import { ArrowRight, Terminal } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface FinalCTAProps {
  onOpenRegister: () => void;
}

export default function FinalCTA({ onOpenRegister }: FinalCTAProps) {
  return (
    <section className="relative">
      <div className="container mx-auto px-6 py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative overflow-hidden border border-primary/30 bg-gradient-to-br from-primary/15 via-background to-background p-10 md:p-16"
        >
          {/* decorative grid */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                "linear-gradient(to right, oklch(0.98 0.01 15 / 0.5) 1px, transparent 1px), linear-gradient(to bottom, oklch(0.98 0.01 15 / 0.5) 1px, transparent 1px)",
              backgroundSize: "44px 44px",
              maskImage:
                "radial-gradient(ellipse 60% 80% at 100% 50%, black, transparent)",
            }}
          />

          <div className="relative grid items-center gap-10 md:grid-cols-[1.5fr_1fr]">
            <div className="space-y-5">
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-primary">
                Ready when you are
              </p>
              <h2 className="text-3xl font-bold leading-tight tracking-tight md:text-5xl">
                Stop rolling your own auth.
                <br />
                <span className="text-primary">Start shipping product.</span>
              </h2>
              <p className="max-w-xl text-base leading-relaxed text-muted-foreground">
                Spin up a srvAuth client, paste your env vars, and your Next.js
                app is OIDC-ready. Free for development. Self-hosted, always.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <Button
                  size="lg"
                  onClick={onOpenRegister}
                  className="group h-12 bg-primary px-6 text-base font-semibold text-primary-foreground shadow-[0_0_40px_-10px_oklch(from_var(--primary)_l_c_h/0.7)] hover:brightness-110"
                >
                  Create your account
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Button>
                <Link href="/docs">
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-12 border-border bg-card/40 px-6 text-base font-medium hover:border-primary/40"
                  >
                    <Terminal className="mr-2 h-4 w-4" />
                    Browse the docs
                  </Button>
                </Link>
              </div>
            </div>

            <div className="hidden md:block">
              <div className="relative aspect-square w-full max-w-[280px] ml-auto">
                <div className="absolute inset-0 border border-primary/40" />
                <div className="absolute inset-3 border border-primary/30" />
                <div className="absolute inset-6 border border-primary/20 flex items-center justify-center">
                  <div className="text-center">
                    <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-primary/80">
                      npm install
                    </p>
                    <p className="mt-2 font-mono text-lg font-semibold text-foreground">
                      @srvauth/sdk
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
