import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { db, uid, type Account } from "@/lib/db";
import { currencySymbol } from "@/lib/kuber";

const CATEGORIES = [
  "Food", "Transport", "Shopping", "Bills", "Rent", "Entertainment",
  "Health", "Groceries", "Salary", "Investment", "Transfer", "Other",
];

export function AddTransactionSheet({
  open,
  onClose,
  accounts,
  currency,
}: {
  open: boolean;
  onClose: () => void;
  accounts: Account[];
  currency: string;
}) {
  const [kind, setKind] = useState<"expense" | "income">("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");
  const [accountId, setAccountId] = useState<string>(accounts[0]?.id ?? "");
  const [merchant, setMerchant] = useState("");
  const [note, setNote] = useState("");
  const symbol = useMemo(() => currencySymbol(currency), [currency]);

  useEffect(() => {
    if (open && accounts[0] && !accountId) setAccountId(accounts[0].id);
  }, [open, accounts, accountId]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const submit = async () => {
    const n = parseFloat(amount);
    if (!n || !accountId) return;
    const signed = kind === "expense" ? -Math.abs(n) : Math.abs(n);
    const now = Date.now();
    await db.transaction("rw", db.transactions, db.accounts, async () => {
      await db.transactions.add({
        id: uid(),
        accountId,
        amount: signed,
        category,
        merchant: merchant.trim(),
        note: note.trim(),
        date: now,
        createdAt: now,
      });
      const acc = await db.accounts.get(accountId);
      if (acc) await db.accounts.update(accountId, { balance: acc.balance + signed });
    });
    setAmount(""); setMerchant(""); setNote("");
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-md"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 320 }}
            className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-lg"
          >
            <div className="glass-strong m-3 rounded-[32px] p-6 pb-8">
              <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-white/20" />
              <div className="flex items-center justify-between">
                <h2 className="font-display text-2xl font-semibold tracking-tight">
                  New transaction
                </h2>
                <button
                  onClick={onClose}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 hover:bg-white/10"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Kind toggle */}
              <div className="mt-5 grid grid-cols-2 gap-2 rounded-full bg-white/[0.04] p-1">
                <button
                  onClick={() => setKind("expense")}
                  className={
                    "flex items-center justify-center gap-2 rounded-full py-2.5 text-sm font-semibold transition " +
                    (kind === "expense"
                      ? "bg-white/10 text-foreground shadow-inner"
                      : "text-muted-foreground")
                  }
                >
                  <ArrowUpRight className="h-4 w-4" /> Expense
                </button>
                <button
                  onClick={() => setKind("income")}
                  className={
                    "flex items-center justify-center gap-2 rounded-full py-2.5 text-sm font-semibold transition " +
                    (kind === "income"
                      ? "bg-white/10 text-foreground shadow-inner"
                      : "text-muted-foreground")
                  }
                >
                  <ArrowDownLeft className="h-4 w-4" /> Income
                </button>
              </div>

              {/* Amount */}
              <div className="mt-6 flex items-baseline justify-center gap-2">
                <span className="num text-3xl text-muted-foreground">{symbol}</span>
                <input
                  autoFocus
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
                  placeholder="0"
                  className="num w-full max-w-[280px] bg-transparent text-center text-6xl font-semibold tracking-tighter text-foreground placeholder:text-white/20 outline-none"
                />
              </div>

              {/* Categories */}
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {CATEGORIES.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCategory(c)}
                    className={
                      "rounded-full border px-3.5 py-1.5 text-xs font-medium transition " +
                      (category === c
                        ? "border-primary/60 bg-primary/15 text-primary"
                        : "border-white/10 bg-white/[0.03] text-muted-foreground hover:text-foreground")
                    }
                  >
                    {c}
                  </button>
                ))}
              </div>

              {/* Account */}
              <div className="mt-5 space-y-2">
                <label className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                  Account
                </label>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {accounts.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => setAccountId(a.id)}
                      className={
                        "shrink-0 rounded-2xl border px-3 py-2 text-left transition " +
                        (accountId === a.id
                          ? "border-primary/60 bg-primary/10"
                          : "border-white/10 bg-white/[0.03]")
                      }
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ background: a.color }}
                        />
                        <span className="text-sm font-medium">{a.name}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <input
                  value={merchant}
                  onChange={(e) => setMerchant(e.target.value)}
                  placeholder="Merchant"
                  className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm outline-none focus:border-primary/50"
                />
                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Note"
                  className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm outline-none focus:border-primary/50"
                />
              </div>

              <button
                onClick={submit}
                disabled={!amount || !accountId}
                className="mt-6 h-14 w-full rounded-full bg-gradient-to-r from-[oklch(0.78_0.20_150)] to-[oklch(0.66_0.18_140)] text-base font-semibold text-[oklch(0.14_0.02_145)] shadow-[0_15px_40px_-10px_oklch(0.72_0.19_145/0.7)] transition hover:brightness-110 active:scale-[0.98] disabled:opacity-40"
              >
                Save transaction
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
