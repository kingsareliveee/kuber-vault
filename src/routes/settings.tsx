import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AlertTriangle, Download, Trash2 } from "lucide-react";
import { AppShell } from "@/components/kuber/AppShell";
import { db } from "@/lib/db";
import { formatMoney, useAccounts, useProfile, useTransactions } from "@/lib/kuber";

export const Route = createFileRoute("/settings")({
  component: Settings,
  head: () => ({ meta: [{ title: "Settings · Kuber Vault" }] }),
});

const CURRENCIES = ["INR", "USD", "EUR", "GBP", "AED", "JPY", "SGD", "AUD"];

function Settings() {
  const profile = useProfile();
  const accounts = useAccounts();
  const txns = useTransactions();
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState(false);

  const update = async (patch: Partial<NonNullable<typeof profile>>) => {
    if (!profile) return;
    await db.profile.put({ ...profile, ...patch });
  };

  const exportCsv = () => {
    const rows = [
      ["date", "account", "category", "merchant", "note", "amount"],
      ...(txns ?? []).map((t) => {
        const a = accounts?.find((x) => x.id === t.accountId);
        return [
          new Date(t.date).toISOString(),
          a?.name ?? "",
          t.category,
          t.merchant,
          t.note,
          String(t.amount),
        ];
      }),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kuber-vault-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const resetAll = async () => {
    await db.transaction("rw", db.profile, db.accounts, db.transactions, async () => {
      await db.profile.clear();
      await db.accounts.clear();
      await db.transactions.clear();
    });
    navigate({ to: "/" });
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-5 pb-32 pt-4 lg:px-10 lg:pt-10">
        <div className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
          Preferences
        </div>
        <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          Settings
        </h1>

        <section className="mt-8 glass rounded-3xl p-6">
          <h2 className="font-display text-lg font-semibold">Profile</h2>
          <div className="mt-4 space-y-3">
            <Field label="Full name">
              <input
                value={profile?.fullName ?? ""}
                onChange={(e) => update({ fullName: e.target.value })}
                className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm outline-none focus:border-primary/50"
              />
            </Field>
            <Field label="Monthly budget">
              <input
                inputMode="decimal"
                value={profile?.monthlyBudget ?? 0}
                onChange={(e) =>
                  update({ monthlyBudget: parseFloat(e.target.value.replace(/[^0-9.]/g, "")) || 0 })
                }
                className="num w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm outline-none focus:border-primary/50"
              />
            </Field>
            <Field label="Currency">
              <div className="flex flex-wrap gap-2">
                {CURRENCIES.map((c) => (
                  <button
                    key={c}
                    onClick={() => update({ currency: c })}
                    className={
                      "rounded-full border px-3 py-1.5 text-xs font-medium transition " +
                      (profile?.currency === c
                        ? "border-primary/60 bg-primary/10 text-primary"
                        : "border-white/10 bg-white/[0.03] text-muted-foreground")
                    }
                  >
                    {c}
                  </button>
                ))}
              </div>
            </Field>
          </div>
        </section>

        <section className="mt-6 glass rounded-3xl p-6">
          <h2 className="font-display text-lg font-semibold">Vault at a glance</h2>
          <div className="mt-4 grid grid-cols-3 gap-3">
            <Stat label="Accounts" value={String(accounts?.length ?? 0)} />
            <Stat label="Transactions" value={String(txns?.length ?? 0)} />
            <Stat
              label="Net worth"
              value={formatMoney(
                (accounts ?? [])
                  .filter((a) => a.includeInNetWorth)
                  .reduce((s, a) => s + a.balance, 0),
                profile?.currency ?? "INR",
              )}
            />
          </div>
        </section>

        <section className="mt-6 glass rounded-3xl p-6">
          <h2 className="font-display text-lg font-semibold">Data</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Your vault lives on this device. Export anytime.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={exportCsv}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm font-semibold transition hover:bg-white/[0.08]"
            >
              <Download className="h-4 w-4" /> Export CSV
            </button>
          </div>
        </section>

        <section className="mt-6 rounded-3xl border border-destructive/30 bg-destructive/5 p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <div className="flex-1">
              <h2 className="font-display text-lg font-semibold">Danger zone</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Erase every account, transaction, and profile detail from this device.
              </p>
              {!confirming ? (
                <button
                  onClick={() => setConfirming(true)}
                  className="mt-4 inline-flex items-center gap-2 rounded-full border border-destructive/50 bg-destructive/10 px-5 py-2.5 text-sm font-semibold text-destructive transition hover:bg-destructive/20"
                >
                  <Trash2 className="h-4 w-4" /> Reset vault
                </button>
              ) : (
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={resetAll}
                    className="rounded-full bg-destructive px-5 py-2.5 text-sm font-semibold text-destructive-foreground"
                  >
                    Yes, erase everything
                  </button>
                  <button
                    onClick={() => setConfirming(false)}
                    className="rounded-full border border-white/10 bg-white/[0.03] px-5 py-2.5 text-sm font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </div>
      {children}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/[0.03] p-4">
      <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{label}</div>
      <div className="num mt-1 text-lg font-semibold">{value}</div>
    </div>
  );
}
