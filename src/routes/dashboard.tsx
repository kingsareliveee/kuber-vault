import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownLeft, TrendingUp, TrendingDown, Eye, EyeOff, Sparkles } from "lucide-react";
import { AppShell } from "@/components/kuber/AppShell";
import { AddTransactionSheet } from "@/components/kuber/AddTransactionSheet";
import { AccountIcon } from "@/components/kuber/AccountIcon";
import { db } from "@/lib/db";
import { formatMoney, useAccounts, useIsClient, useProfile, useTransactions } from "@/lib/kuber";

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
  head: () => ({ meta: [{ title: "Dashboard · Kuber Vault" }] }),
});

function Dashboard() {
  const isClient = useIsClient();
  const navigate = useNavigate();
  const profile = useProfile();
  const accounts = useAccounts();
  const txns = useTransactions(6);
  const [addOpen, setAddOpen] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (!isClient) return;
    (async () => {
      const p = await db.profile.get("me");
      if (!p) navigate({ to: "/" });
    })();
  }, [isClient, navigate]);

  const currency = profile?.currency ?? "INR";

  const netWorth = useMemo(
    () =>
      (accounts ?? [])
        .filter((a) => a.includeInNetWorth)
        .reduce((s, a) => s + a.balance, 0),
    [accounts],
  );

  const monthStats = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const inMonth = (txns ?? []).concat([]).filter((t) => t.date >= start);
    // Since useTransactions(6) is limited, we compute month from a live-derived value later
    return inMonth;
  }, [txns]);
  void monthStats;

  // Full month totals via live query would be nicer; compute from all txns:
  const allTxns = useTransactions();
  const { income, expense } = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    let inc = 0, exp = 0;
    for (const t of allTxns ?? []) {
      if (t.date < start) continue;
      if (t.amount > 0) inc += t.amount;
      else exp += -t.amount;
    }
    return { income: inc, expense: exp };
  }, [allTxns]);

  const budget = profile?.monthlyBudget ?? 0;
  const budgetPct = budget > 0 ? Math.min(100, (expense / budget) * 100) : 0;

  const mask = (s: string) => (hidden ? "•••••" : s);

  return (
    <>
      <AppShell onAdd={() => setAddOpen(true)}>
        <div className="mx-auto max-w-6xl px-5 pb-32 pt-4 lg:px-10 lg:pt-10">
          {/* Header */}
          <div className="flex items-end justify-between gap-4">
            <div>
              <div className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
                Welcome back
              </div>
              <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                {profile?.fullName ?? "You"}
              </h1>
            </div>
            <button
              onClick={() => setHidden((h) => !h)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.04] text-muted-foreground hover:bg-white/[0.08]"
              aria-label={hidden ? "Show amounts" : "Hide amounts"}
            >
              {hidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </button>
          </div>

          {/* Net worth hero */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative mt-6 overflow-hidden rounded-[32px] p-8 sm:p-10"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.28 0.10 155 / 0.9), oklch(0.18 0.05 240 / 0.9))",
              boxShadow:
                "0 30px 80px -20px oklch(0.72 0.19 145 / 0.35), inset 0 1px 0 oklch(1 0 0 / 0.1)",
              border: "1px solid oklch(1 0 0 / 0.08)",
            }}
          >
            {/* decorative rings */}
            <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full border border-white/10" />
            <div className="pointer-events-none absolute -right-40 -top-40 h-96 w-96 rounded-full border border-white/5" />
            <div className="pointer-events-none absolute inset-0 opacity-40 [background:radial-gradient(circle_at_20%_20%,oklch(0.72_0.19_145/0.35),transparent_50%)]" />

            <div className="relative flex items-center gap-2 text-[11px] uppercase tracking-[0.25em] text-white/60">
              <Sparkles className="h-3 w-3 text-gold" /> Net Worth
            </div>
            <div className="relative mt-3 flex items-baseline gap-3">
              <div className="num text-5xl font-semibold tracking-tighter sm:text-7xl">
                {mask(formatMoney(netWorth, currency))}
              </div>
            </div>
            <div className="relative mt-4 flex flex-wrap gap-4 text-sm text-white/70">
              <div className="flex items-center gap-1.5">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="num text-white">{mask(formatMoney(income, currency))}</span>
                <span className="text-white/50">income</span>
              </div>
              <div className="flex items-center gap-1.5">
                <TrendingDown className="h-4 w-4 text-destructive" />
                <span className="num text-white">{mask(formatMoney(expense, currency))}</span>
                <span className="text-white/50">this month</span>
              </div>
            </div>
          </motion.div>

          {/* Budget + Quick actions */}
          <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="glass rounded-3xl p-6 lg:col-span-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                    Monthly Budget
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="num text-2xl font-semibold">
                      {mask(formatMoney(expense, currency))}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      of {mask(formatMoney(budget, currency))}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="num text-3xl font-semibold text-gradient-emerald">
                    {budget > 0 ? `${Math.round(budgetPct)}%` : "—"}
                  </div>
                  <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    used
                  </div>
                </div>
              </div>
              <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-white/[0.05]">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${budgetPct}%` }}
                  transition={{ type: "spring", damping: 22, stiffness: 180 }}
                  className={
                    "h-full " +
                    (budgetPct < 75
                      ? "bg-gradient-to-r from-primary to-gold"
                      : "bg-gradient-to-r from-gold to-destructive")
                  }
                />
              </div>
            </div>

            <div className="glass grid grid-cols-2 gap-2 rounded-3xl p-4">
              <button
                onClick={() => setAddOpen(true)}
                className="group flex flex-col items-start gap-2 rounded-2xl bg-primary/10 p-4 text-left transition hover:bg-primary/15"
              >
                <ArrowUpRight className="h-5 w-5 text-primary" />
                <div className="text-sm font-semibold">Add expense</div>
              </button>
              <button
                onClick={() => setAddOpen(true)}
                className="flex flex-col items-start gap-2 rounded-2xl bg-gold/10 p-4 text-left transition hover:bg-gold/15"
              >
                <ArrowDownLeft className="h-5 w-5 text-gold" />
                <div className="text-sm font-semibold">Add income</div>
              </button>
              <Link
                to="/analytics"
                className="col-span-2 flex items-center justify-between rounded-2xl bg-white/[0.03] p-4 transition hover:bg-white/[0.06]"
              >
                <div className="text-sm font-semibold">View analytics</div>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            </div>
          </div>

          {/* Accounts */}
          <section className="mt-8">
            <SectionHeader title="Accounts" hint={`${accounts?.length ?? 0} total`} />
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {(accounts ?? []).map((a) => (
                <div
                  key={a.id}
                  className="group relative overflow-hidden rounded-3xl p-5 transition"
                  style={{
                    background: `linear-gradient(135deg, ${a.color}22, oklch(0.20 0.02 240 / 0.6))`,
                    border: `1px solid ${a.color}30`,
                    boxShadow: `0 20px 50px -20px ${a.color}55, inset 0 1px 0 oklch(1 0 0 / 0.08)`,
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div
                      className="flex h-11 w-11 items-center justify-center rounded-2xl"
                      style={{ background: `${a.color}30`, color: a.color }}
                    >
                      <AccountIcon icon={a.icon} className="h-5 w-5" />
                    </div>
                    <span className="rounded-full border border-white/10 bg-black/20 px-2.5 py-0.5 text-[10px] uppercase tracking-[0.15em] text-white/60">
                      {a.type}
                    </span>
                  </div>
                  <div className="mt-6 text-sm text-muted-foreground">{a.name}</div>
                  <div className="num mt-1 text-2xl font-semibold tracking-tight">
                    {mask(formatMoney(a.balance, currency))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Recent */}
          <section className="mt-10">
            <div className="flex items-center justify-between">
              <SectionHeader title="Recent" hint="" />
              <Link
                to="/transactions"
                className="text-xs font-semibold text-primary hover:underline"
              >
                View all →
              </Link>
            </div>
            <div className="mt-4 glass overflow-hidden rounded-3xl">
              {(txns ?? []).length === 0 ? (
                <div className="p-10 text-center text-sm text-muted-foreground">
                  No transactions yet. Add your first one to see the magic.
                </div>
              ) : (
                <ul className="divide-y divide-white/5">
                  {(txns ?? []).map((t) => {
                    const acc = accounts?.find((a) => a.id === t.accountId);
                    const income = t.amount > 0;
                    return (
                      <li key={t.id} className="flex items-center gap-4 px-5 py-4">
                        <div
                          className={
                            "flex h-11 w-11 items-center justify-center rounded-2xl " +
                            (income ? "bg-primary/15 text-primary" : "bg-white/5 text-foreground")
                          }
                        >
                          {income ? (
                            <ArrowDownLeft className="h-5 w-5" />
                          ) : (
                            <ArrowUpRight className="h-5 w-5" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-semibold">
                            {t.merchant || t.category}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {t.category} · {acc?.name ?? "—"}
                          </div>
                        </div>
                        <div className="text-right">
                          <div
                            className={
                              "num text-sm font-semibold " +
                              (income ? "text-primary" : "text-foreground")
                            }
                          >
                            {income ? "+" : "−"}
                            {mask(formatMoney(Math.abs(t.amount), currency))}
                          </div>
                          <div className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                            {new Date(t.date).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                            })}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </section>
        </div>
      </AppShell>

      <AddTransactionSheet
        open={addOpen}
        onClose={() => setAddOpen(false)}
        accounts={accounts ?? []}
        currency={currency}
      />
    </>
  );
}

function SectionHeader({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="flex items-baseline justify-between">
      <h2 className="font-display text-xl font-semibold tracking-tight">{title}</h2>
      {hint && (
        <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          {hint}
        </span>
      )}
    </div>
  );
}
