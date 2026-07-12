import { db } from "./db";
import { useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";

export function formatMoney(value: number, currency = "INR") {
  try {
    return new Intl.NumberFormat(currency === "INR" ? "en-IN" : "en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}

export function currencySymbol(currency = "INR") {
  try {
    const parts = new Intl.NumberFormat(currency === "INR" ? "en-IN" : "en-US", {
      style: "currency",
      currency,
    }).formatToParts(0);
    return parts.find((p) => p.type === "currency")?.value ?? currency;
  } catch {
    return currency;
  }
}

export function useProfile() {
  return useLiveQuery(() => db.profile.get("me"), []);
}

export function useAccounts() {
  return useLiveQuery(() => db.accounts.orderBy("createdAt").toArray(), []);
}

export function useTransactions(limit?: number) {
  return useLiveQuery(async () => {
    const all = await db.transactions.orderBy("date").reverse().toArray();
    return limit ? all.slice(0, limit) : all;
  }, [limit]);
}

export function useIsClient() {
  const [c, setC] = useState(false);
  useEffect(() => setC(true), []);
  return c;
}
