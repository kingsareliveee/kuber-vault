import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Plus, Trash2, Wallet, Landmark, Smartphone, PiggyBank, Coins, Sparkles } from "lucide-react";
import { db, uid, type AccountType } from "@/lib/db";
import { currencySymbol } from "@/lib/kuber";
import { KuberMark } from "@/components/kuber/KuberMark";

export const Route = createFileRoute("/setup")({
  component: Setup,
});

const CURRENCIES = ["INR", "USD", "EUR", "GBP", "AED", "JPY", "SGD", "AUD"];
const PALETTE = ["#22C55E", "#D4AF37", "#3B82F6", "#F97316", "#EC4899", "#8B5CF6", "#EF4444", "#14B8A6"];

const ACC_TYPES: { type: AccountType; label: string; icon: string }[] = [
  { type: "cash", label: "Cash", icon: "cash" },
  { type: "bank", label: "Bank", icon: "bank" },
  { type: "upi", label: "UPI", icon: "upi" },
  { type: "wallet", label: "Wallet", icon: "wallet" },
  { type: "savings", label: "Savings", icon: "savings" },
  { type: "custom", label: "Custom", icon: "custom" },
];

function IconFor({ icon, className }: { icon: string; className?: string }) {
  const map: Record<string, typeof Wallet> = {
    cash: Coins,
    bank: Landmark,
    upi: Smartphone,
    wallet: Wallet,
    savings: PiggyBank,
    custom: Sparkles,
  };
  const C = map[icon] ?? Wallet;
  return <C className={className} />;
}

interface Draft {
  id: string;
  name: string;
  type: AccountType;
  openingBalance: string;
  color: string;
  icon: string;
  includeInNetWorth: boolean;
}

function Setup() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [fullName, setFullName] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [budget, setBudget] = useState("");
  const [accounts, setAccounts] = useState<Draft[]>([
    { id: uid(), name: "Cash", type: "cash", openingBalance: "", color: PALETTE[0], icon: "cash", includeInNetWorth: true },
  ]);

  const total = 4;

  const addAcc = () =>
    setAccounts((a) => [
      ...a,
      {
        id: uid(),
        name: "",
        type: "bank",
        openingBalance: "",
        color: PALETTE[a.length % PALETTE.length],
        icon: "bank",
        includeInNetWorth: true,
      },
    ]);

  const finish = async () => {
    const now = Date.now();
    await db.profile.put({
      id: "me",
      fullName: fullName.trim() || "You",
      currency,
      monthlyBudget: parseFloat(budget) || 0,
      createdAt: now,
    });
    await db.accounts.bulkPut(
      accounts
        .filter((a) => a.name.trim())
        .map((a) => ({
          id: a.id,
          name: a.name.trim(),
          type: a.type,
          openingBalance: parseFloat(a.openingBalance) || 0,
          balance: parseFloat(a.openingBalance) || 0,
          color: a.color,
          icon: a.icon,
          includeInNetWorth: a.includeInNetWorth ? 1 : 0,
          createdAt: now,
        })),
    );
    navigate({ to: "/dashboard" });
  };

  const canNext =
    (step === 0 && fullName.trim().length > 0) ||
    (step === 1 && currency) ||
    (step === 2 && budget !== "") ||
    (step === 3 && accounts.some((a) => a.name.trim().length > 0));

  return (
    <div className="relative min-h-screen">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-[oklch(0.72_0.19_145/0.25)] blur-[120px]" />

      <div className="relative mx-auto flex min-h-screen max-w-2xl flex-col px-6 py-8">
        <header className="flex items-center justify-between">
          <button
            onClick={() => (step > 0 ? setStep(step - 1) : navigate({ to: "/" }))}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.04] hover:bg-white/[0.08]"
            aria-label="Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <KuberMark className="h-9 w-9" />
          <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            Step {step + 1} of {total}
          </div>
        </header>

        {/* Progress */}
        <div className="mt-6 h-1 w-full overflow-hidden rounded-full bg-white/[0.05]">
          <motion.div
            initial={false}
            animate={{ width: `${((step + 1) / total) * 100}%` }}
            transition={{ type: "spring", damping: 24, stiffness: 220 }}
            className="h-full bg-gradient-to-r from-primary to-gold"
          />
        </div>

        <div className="flex-1 py-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3 }}
              className="glass-strong rounded-3xl p-6 sm:p-8"
            >
              {step === 0 && (
                <>
                  <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                    First, what shall we call you?
                  </h1>
                  <p className="mt-2 text-sm text-muted-foreground">
                    This stays on your device. Always.
                  </p>
                  <input
                    autoFocus
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your name"
                    className="mt-8 w-full rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 text-lg font-medium outline-none focus:border-primary/60"
                  />
                </>
              )}

              {step === 1 && (
                <>
                  <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                    Choose your currency.
                  </h1>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Every number in your vault will be denominated here.
                  </p>
                  <div className="mt-6 grid grid-cols-4 gap-2">
                    {CURRENCIES.map((c) => (
                      <button
                        key={c}
                        onClick={() => setCurrency(c)}
                        className={
                          "rounded-2xl border p-4 text-center transition " +
                          (currency === c
                            ? "border-primary/60 bg-primary/10"
                            : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]")
                        }
                      >
                        <div className="num text-xl font-semibold">{currencySymbol(c)}</div>
                        <div className="mt-1 text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                          {c}
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                    Set your monthly budget.
                  </h1>
                  <p className="mt-2 text-sm text-muted-foreground">
                    We'll help you stay elegantly within it.
                  </p>
                  <div className="mt-8 flex items-baseline gap-3">
                    <span className="num text-3xl text-muted-foreground">
                      {currencySymbol(currency)}
                    </span>
                    <input
                      autoFocus
                      inputMode="decimal"
                      value={budget}
                      onChange={(e) => setBudget(e.target.value.replace(/[^0-9.]/g, ""))}
                      placeholder="0"
                      className="num w-full bg-transparent text-5xl font-semibold tracking-tighter outline-none placeholder:text-white/20 sm:text-6xl"
                    />
                  </div>
                </>
              )}

              {step === 3 && (
                <>
                  <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                    Add your accounts.
                  </h1>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Cash, bank, UPI, savings — however your wealth lives.
                  </p>

                  <div className="mt-6 space-y-3">
                    {accounts.map((a, i) => (
                      <div
                        key={a.id}
                        className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="flex h-10 w-10 items-center justify-center rounded-xl"
                            style={{ background: a.color + "26", color: a.color }}
                          >
                            <IconFor icon={a.icon} className="h-5 w-5" />
                          </div>
                          <input
                            value={a.name}
                            onChange={(e) =>
                              setAccounts((p) =>
                                p.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)),
                              )
                            }
                            placeholder="Account name"
                            className="flex-1 bg-transparent text-base font-medium outline-none"
                          />
                          <button
                            onClick={() =>
                              setAccounts((p) => p.filter((_, j) => j !== i))
                            }
                            className="text-muted-foreground hover:text-destructive"
                            aria-label="Remove"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {ACC_TYPES.map((t) => (
                            <button
                              key={t.type}
                              onClick={() =>
                                setAccounts((p) =>
                                  p.map((x, j) =>
                                    j === i ? { ...x, type: t.type, icon: t.icon } : x,
                                  ),
                                )
                              }
                              className={
                                "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition " +
                                (a.type === t.type
                                  ? "border-primary/50 bg-primary/10 text-primary"
                                  : "border-white/10 bg-white/[0.03] text-muted-foreground")
                              }
                            >
                              <IconFor icon={t.icon} className="h-3 w-3" /> {t.label}
                            </button>
                          ))}
                        </div>

                        <div className="mt-3 flex items-center gap-3">
                          <div className="flex-1">
                            <label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                              Opening balance
                            </label>
                            <div className="mt-1 flex items-baseline gap-1">
                              <span className="num text-sm text-muted-foreground">
                                {currencySymbol(currency)}
                              </span>
                              <input
                                inputMode="decimal"
                                value={a.openingBalance}
                                onChange={(e) =>
                                  setAccounts((p) =>
                                    p.map((x, j) =>
                                      j === i
                                        ? { ...x, openingBalance: e.target.value.replace(/[^0-9.]/g, "") }
                                        : x,
                                    ),
                                  )
                                }
                                placeholder="0"
                                className="num w-full bg-transparent text-lg font-semibold outline-none"
                              />
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                              Color
                            </label>
                            <div className="flex gap-1">
                              {PALETTE.slice(0, 5).map((c) => (
                                <button
                                  key={c}
                                  onClick={() =>
                                    setAccounts((p) =>
                                      p.map((x, j) => (j === i ? { ...x, color: c } : x)),
                                    )
                                  }
                                  aria-label={c}
                                  style={{ background: c }}
                                  className={
                                    "h-5 w-5 rounded-full transition " +
                                    (a.color === c ? "ring-2 ring-white/60" : "opacity-70")
                                  }
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    <button
                      onClick={addAcc}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-white/15 py-3.5 text-sm font-medium text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
                    >
                      <Plus className="h-4 w-4" /> Add another account
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <button
          onClick={() => (step === total - 1 ? finish() : setStep(step + 1))}
          disabled={!canNext}
          className="mt-2 flex h-14 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[oklch(0.78_0.20_150)] to-[oklch(0.66_0.18_140)] text-base font-semibold text-[oklch(0.14_0.02_145)] shadow-[0_15px_40px_-10px_oklch(0.72_0.19_145/0.6)] transition hover:brightness-110 active:scale-[0.98] disabled:opacity-40"
        >
          {step === total - 1 ? (
            <>
              <Check className="h-4 w-4" /> Open my vault
            </>
          ) : (
            <>
              Continue <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
