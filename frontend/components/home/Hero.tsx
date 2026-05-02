"use client";

import { motion, Variants } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Shield, CheckCircle2 } from "lucide-react";
import Link from "next/link";

interface HeroProps {
  onOpenRegister: () => void;
  onOpenLogin: () => void;
}

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

export default function Hero({ onOpenRegister, onOpenLogin }: HeroProps) {
  return (
    <section className="relative overflow-hidden border-b border-border">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />
      <div className="container mx-auto px-6 py-24 lg:py-32 relative z-10 flex flex-col lg:flex-row items-center gap-12">
        <motion.div
          className="flex-1 space-y-8"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <motion.div
            variants={fadeUp}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-none border border-primary text-sm text-primary font-medium"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-none bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-none h-2 w-2 bg-primary"></span>
            </span>
            OAuth 2.0 & OIDC Ready
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="text-5xl lg:text-7xl font-bold tracking-tight text-foreground"
          >
            Authentication <br /> made{" "}
            <span className="text-primary">effortless.</span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="text-lg lg:text-xl text-muted-foreground max-w-2xl leading-relaxed"
          >
            A modern developer console for managing your OAuth credentials,
            integrating OIDC seamlessly, and securing your applications in
            minutes.
          </motion.p>

          <motion.div
            variants={fadeUp}
            className="flex flex-col sm:flex-row gap-4 pt-4"
          >
            <Button
              size="lg"
              onClick={onOpenRegister}
              className="bg-primary hover:opacity-90 text-primary-foreground shadow-xl shadow-primary/20 h-14 px-8 text-lg"
            >
              Get Started <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Link href="/docs">
              <Button
                size="lg"
                variant="outline"
                className="border-border text-foreground hover:bg-accent h-14 px-8 text-lg rounded-none"
              >
                View Documentation
              </Button>
            </Link>
          </motion.div>
        </motion.div>

        <motion.div
          className="flex-1 w-full lg:w-auto"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <div className="relative">
            <div className="absolute -inset-4 bg-primary/5 blur-3xl rounded-none" />
            <Card className="relative gradient-border bg-transparent p-8 sm:p-12 shadow-2xl maroon-shadow overflow-hidden rounded-none">
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] rotate-12">
                <Shield className="w-48 h-48" />
              </div>
              <div className="text-center space-y-8 relative z-10">
                <div className="space-y-3">
                  <h2 className="text-3xl lg:text-4xl font-bold tracking-tight text-foreground">
                    Experience srvAuth
                  </h2>
                  <p className="text-muted-foreground text-lg">
                    The next generation of identity infrastructure.
                  </p>
                </div>

                <div className="py-4">
                  <Button
                    size="lg"
                    className="w-full bg-primary text-primary-foreground hover:brightness-110 h-16 text-xl rounded-none shadow-[0_0_20px_rgba(var(--primary),0.3)] transition-all active:scale-[0.98]"
                    onClick={onOpenLogin}
                  >
                    Login with srvAuth
                  </Button>
                </div>

                <div className="flex items-center justify-center gap-6 pt-2">
                  <p className="text-xs font-medium text-muted-foreground flex items-center gap-2 uppercase tracking-widest">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Secure
                  </p>
                  <p className="text-xs font-medium text-muted-foreground flex items-center gap-2 uppercase tracking-widest">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Fast
                  </p>
                  <p className="text-xs font-medium text-muted-foreground flex items-center gap-2 uppercase tracking-widest">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />{" "}
                    Compliant
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
