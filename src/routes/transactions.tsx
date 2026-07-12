import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowUpRight, ArrowDownLeft, Search, Trash2 } from "lucide-react";
import { AppShell } from "@/components/kuber/AppShell";
import { AddTransactionSheet } from "@/components/kuber/AddTransactionSheet";
import { db } from "@/lib/db";
import { formatMoney, useAccounts, useProfile, useTransactions } from "@/lib/kuber";

export const Route = createFileRoute("/transactions")({
  component: TransactionsPage,
  head: () => ({ meta: [{ title: "Transactions · Kuber Vault" }] }),
});

function TransactionsPage() {
  const profile = useProfile();
  const accounts = useAccounts();
  const txns = useTransactions();
  const [q, setQ] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const currency = profile?.currency ?? "INR";

  const filtered = useMemo(() => {
    const list = txns ?? [];
    const query = q.trim().toLowerCase();
    if (!query) return list;
    return list.filter(
      (t) =>
        t.merchant.toLowerCase().includes(query) ||
        t.category.toLowerCase().includes(query) ||
        t.note.toLowerCase().includes(query),
    );
  }, [txns, q]);

  const groups = useMemo(() => {
    const g = new Map<string, typeof filtered>();
    for (const t of filtered) {
      const d = new Date(t.date);
      const key = d.toLocaleDateString(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
      });
      const arr = g.get(key) ?? [];
      arr.push(t);
      g.set(key, arr);
    }
    return Array.from(g.entries());
  }, [filtered]);

  const remove = async (id: string, accountId: string, amount: number) => {
    await db.transaction("rw", db.transactions, db.accounts, async () => {
      await db.transactions.delete(id);
      const a = await db.accounts.get(accountId);
      if (a) await db.accounts.update(accountId, { balance: a.balance - amount });
    });
  };

  return (
    <>
      <AppShell onAdd={() => setAddOpen(true)}>
        <div className="mx-auto max-w-4xl px-5 pb-32 pt-4 lg:px-10 lg:pt-10">
          <div className="flex items-baseline justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
                All movements
              </div>
              <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                Transactions
              </h1>
            </div>
            <div className="hidden text-right sm:block">
              <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Count
              </div>
              <div className="num text-2xl font-semibold">{filtered.length}</div>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-3 focus-within:border-primary/50">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search merchant, category, note…"
              className="w-full bg-transparent text-sm outline-none"
            />
          </div>

          <div className="mt-6 space-y-6">
            {groups.length === 0 && (
              <div className="glass rounded-3xl p-14 text-center text-sm text-muted-foreground">
                Nothing to show yet.
              </div>
            )}
            {groups.map(([date, list]) => (
              <div key={date}>
                <div className="mb-2 flex items-baseline justify-between px-1">
                  <div className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
                    {date}
                  </div>
                  <div className="num text-xs text-muted-foreground">
                    {formatMoney(
                      list.reduce((s, t) => s + t.amount, 0),
                      currency,
                    )}
                  </div>
                </div>
                <ul className="glass overflow-hidden rounded-3xl divide-y divide-white/5">
                  {list.map((t) => {
                    const acc = accounts?.find((a) => a.id === t.accountId);
                    const income = t.amount > 0;
                    return (
                      <li
                        key={t.id}
                        className="group flex items-center gap-4 px-5 py-4 transition hover:bg-white/[0.03]"
                      >
                        <div
                          className={
                            "flex h-11 w-11 items-center justify-center rounded-2xl " +
                            (income
                              ? "bg-primary/15 text-primary"
                              : "bg-white/5 text-foreground")
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
                            {t.note && ` · ${t.note}`}
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
                            {formatMoney(Math.abs(t.amount), currency)}
                          </div>
                        </div>
                        <button
                          onClick={() => remove(t.id, t.accountId, t.amount)}
                          className="opacity-0 transition group-hover:opacity-100"
                          aria-label="Delete"
                        >
                          <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
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
