import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/kuber/AppShell";
import { AddTransactionSheet } from "@/components/kuber/AddTransactionSheet";
import { formatMoney, useAccounts, useProfile, useTransactions } from "@/lib/kuber";

export const Route = createFileRoute("/analytics")({
  component: Analytics,
  head: () => ({ meta: [{ title: "Analytics · Kuber Vault" }] }),
});

const PALETTE = ["#22C55E", "#D4AF37", "#3B82F6", "#F97316", "#EC4899", "#8B5CF6", "#EF4444", "#14B8A6"];

function Analytics() {
  const profile = useProfile();
  const accounts = useAccounts();
  const txns = useTransactions();
  const [addOpen, setAddOpen] = useState(false);
  const currency = profile?.currency ?? "INR";

  const monthTx = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    return (txns ?? []).filter((t) => t.date >= start);
  }, [txns]);

  const totals = useMemo(() => {
    let inc = 0, exp = 0;
    for (const t of monthTx) t.amount > 0 ? (inc += t.amount) : (exp += -t.amount);
    return { inc, exp };
  }, [monthTx]);

  const byCategory = useMemo(() => {
    const m = new Map<string, number>();
    for (const t of monthTx) if (t.amount < 0) m.set(t.category, (m.get(t.category) ?? 0) + -t.amount);
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]);
  }, [monthTx]);

  const total = byCategory.reduce((s, [, v]) => s + v, 0);

  // donut segments
  let acc = 0;
  const R = 70, C = 2 * Math.PI * R;
  const segments = byCategory.map(([cat, val], i) => {
    const frac = total > 0 ? val / total : 0;
    const dash = frac * C;
    const seg = { cat, val, color: PALETTE[i % PALETTE.length], dash, offset: acc };
    acc += dash;
    return seg;
  });

  // last 6 months bar
  const monthly = useMemo(() => {
    const out: { label: string; inc: number; exp: number }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1).getTime();
      const start = d.getTime();
      let inc = 0, exp = 0;
      for (const t of txns ?? []) {
        if (t.date >= start && t.date < end) t.amount > 0 ? (inc += t.amount) : (exp += -t.amount);
      }
      out.push({ label: d.toLocaleString(undefined, { month: "short" }), inc, exp });
    }
    return out;
  }, [txns]);
  const maxBar = Math.max(1, ...monthly.map((m) => Math.max(m.inc, m.exp)));

  return (
    <>
      <AppShell onAdd={() => setAddOpen(true)}>
        <div className="mx-auto max-w-5xl px-5 pb-32 pt-4 lg:px-10 lg:pt-10">
          <div className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
            This month
          </div>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Analytics
          </h1>

          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="glass rounded-3xl p-6">
              <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Income</div>
              <div className="num mt-2 text-3xl font-semibold text-gradient-emerald">
                {formatMoney(totals.inc, currency)}
              </div>
            </div>
            <div className="glass rounded-3xl p-6">
              <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Expense</div>
              <div className="num mt-2 text-3xl font-semibold">
                {formatMoney(totals.exp, currency)}
              </div>
            </div>
            <div className="glass rounded-3xl p-6">
              <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Net</div>
              <div
                className={
                  "num mt-2 text-3xl font-semibold " +
                  (totals.inc - totals.exp >= 0 ? "text-gradient-emerald" : "text-destructive")
                }
              >
                {formatMoney(totals.inc - totals.exp, currency)}
              </div>
            </div>
          </div>

          {/* Donut */}
          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="glass rounded-3xl p-6">
              <h2 className="font-display text-lg font-semibold">Spending by category</h2>
              <div className="mt-6 flex flex-col items-center gap-8 sm:flex-row">
                <svg width="200" height="200" viewBox="0 0 200 200" className="shrink-0">
                  <circle cx="100" cy="100" r={R} stroke="oklch(1 0 0 / 0.06)" strokeWidth="24" fill="none" />
                  {segments.map((s) => (
                    <circle
                      key={s.cat}
                      cx="100"
                      cy="100"
                      r={R}
                      stroke={s.color}
                      strokeWidth="24"
                      fill="none"
                      strokeDasharray={`${s.dash} ${C - s.dash}`}
                      strokeDashoffset={-s.offset}
                      transform="rotate(-90 100 100)"
                      strokeLinecap="butt"
                    />
                  ))}
                  <text x="100" y="96" textAnchor="middle" className="fill-muted-foreground text-[10px] uppercase tracking-[0.2em]">Spent</text>
                  <text x="100" y="118" textAnchor="middle" className="num fill-foreground text-lg font-semibold">
                    {formatMoney(total, currency)}
                  </text>
                </svg>
                <div className="flex-1 space-y-2">
                  {segments.length === 0 && (
                    <div className="text-sm text-muted-foreground">No expenses this month.</div>
                  )}
                  {segments.map((s) => (
                    <div key={s.cat} className="flex items-center gap-3">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
                      <div className="flex-1 text-sm">{s.cat}</div>
                      <div className="num text-sm font-semibold">
                        {formatMoney(s.val, currency)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="glass rounded-3xl p-6">
              <h2 className="font-display text-lg font-semibold">Last 6 months</h2>
              <div className="mt-6 flex h-56 items-end gap-3">
                {monthly.map((m) => (
                  <div key={m.label} className="flex flex-1 flex-col items-center gap-2">
                    <div className="flex h-full w-full items-end gap-1">
                      <div
                        className="flex-1 rounded-t-lg bg-gradient-to-t from-[oklch(0.55_0.18_145)] to-[oklch(0.78_0.20_150)]"
                        style={{ height: `${(m.inc / maxBar) * 100}%` }}
                        title={`Income ${formatMoney(m.inc, currency)}`}
                      />
                      <div
                        className="flex-1 rounded-t-lg bg-gradient-to-t from-[oklch(0.35_0.10_25)] to-[oklch(0.65_0.20_25)]"
                        style={{ height: `${(m.exp / maxBar) * 100}%` }}
                        title={`Expense ${formatMoney(m.exp, currency)}`}
                      />
                    </div>
                    <div className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                      {m.label}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex justify-center gap-6 text-xs text-muted-foreground">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-primary" /> Income
                </span>
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-destructive" /> Expense
                </span>
              </div>
            </div>
          </div>

          {/* Accounts share */}
          <div className="mt-6 glass rounded-3xl p-6">
            <h2 className="font-display text-lg font-semibold">Account allocation</h2>
            <div className="mt-4 space-y-3">
              {(accounts ?? []).map((a) => {
                const totalNet = (accounts ?? []).reduce((s, x) => s + Math.max(0, x.balance), 0);
                const pct = totalNet > 0 ? (Math.max(0, a.balance) / totalNet) * 100 : 0;
                return (
                  <div key={a.id}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{a.name}</span>
                      <span className="num text-muted-foreground">
                        {formatMoney(a.balance, currency)}
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/[0.05]">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: a.color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
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
