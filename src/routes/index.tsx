import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck, WifiOff, Sparkles } from "lucide-react";
import { KuberMark } from "@/components/kuber/KuberMark";
import { db } from "@/lib/db";
import { useIsClient } from "@/lib/kuber";

export const Route = createFileRoute("/")({
  component: Welcome,
});

function Welcome() {
  const isClient = useIsClient();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isClient) return;
    (async () => {
      const p = await db.profile.get("me");
      if (p) navigate({ to: "/dashboard" });
    })();
  }, [isClient, navigate]);

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Ambient orbs */}
      <div className="pointer-events-none absolute -left-40 -top-40 h-[520px] w-[520px] rounded-full bg-[oklch(0.72_0.19_145/0.35)] blur-[120px]" />
      <div className="pointer-events-none absolute -right-32 top-32 h-[420px] w-[420px] rounded-full bg-[oklch(0.79_0.14_85/0.22)] blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 left-1/2 h-[520px] w-[720px] -translate-x-1/2 rounded-full bg-[oklch(0.42_0.16_265/0.35)] blur-[140px]" />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-8">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <KuberMark className="h-10 w-10" />
            <div className="leading-tight">
              <div className="font-display text-xl font-semibold tracking-tight">
                Kuber Vault
              </div>
              <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                Est. 2026
              </div>
            </div>
          </div>
          <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] uppercase tracking-[0.2em] text-muted-foreground sm:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_10px_2px_oklch(0.72_0.19_145)]" />
            Private · Offline-first
          </div>
        </header>

        <div className="mx-auto mt-16 flex max-w-3xl flex-1 flex-col items-center justify-center text-center lg:mt-24">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/5 px-3 py-1 text-[11px] uppercase tracking-[0.25em] text-gold"
          >
            <Sparkles className="h-3 w-3" /> A premium financial vault
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="mt-6 font-display text-5xl font-semibold leading-[1.02] tracking-[-0.04em] sm:text-7xl lg:text-8xl"
          >
            Your Wealth.
            <br />
            <span className="text-gradient-gold">Your Control.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-6 max-w-xl text-balance text-base leading-relaxed text-muted-foreground sm:text-lg"
          >
            An editorial-grade personal finance vault. Track every account, transaction,
            and goal — beautifully, privately, and entirely offline.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mt-10 flex flex-col items-center gap-3 sm:flex-row"
          >
            <Link
              to="/setup"
              className="group inline-flex h-14 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[oklch(0.78_0.20_150)] to-[oklch(0.66_0.18_140)] px-8 text-base font-semibold text-[oklch(0.14_0.02_145)] shadow-[0_20px_60px_-15px_oklch(0.72_0.19_145/0.7)] transition hover:brightness-110 active:scale-[0.98]"
            >
              Open your vault
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </Link>
            <Link
              to="/dashboard"
              className="inline-flex h-14 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] px-8 text-base font-semibold text-foreground transition hover:bg-white/[0.06]"
            >
              Continue as guest
            </Link>
          </motion.div>
        </div>

        {/* Feature strip */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mx-auto mt-20 grid w-full max-w-4xl grid-cols-1 gap-3 sm:grid-cols-3"
        >
          {[
            { icon: ShieldCheck, title: "Yours, alone", body: "Everything lives locally, encrypted by your device." },
            { icon: WifiOff, title: "No internet needed", body: "Track, edit and analyze — even in airplane mode." },
            { icon: Sparkles, title: "Editorial design", body: "Numbers rendered with typographic precision." },
          ].map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="glass rounded-2xl p-5"
            >
              <Icon className="h-5 w-5 text-primary" />
              <div className="mt-3 font-display text-base font-semibold">{title}</div>
              <div className="mt-1 text-sm text-muted-foreground">{body}</div>
            </div>
          ))}
        </motion.div>

        <footer className="mt-12 text-center text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
          Kuber Vault · A private financial instrument · By jmvtech
        </footer>
      </div>
    </div>
  );
}
