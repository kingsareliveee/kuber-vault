import Dexie, { type EntityTable } from "dexie";

export type AccountType = "cash" | "bank" | "upi" | "wallet" | "savings" | "custom";

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number; // opening balance + net txns
  openingBalance: number;
  color: string;
  icon: string;
  includeInNetWorth: number; // 0/1
  createdAt: number;
}

export interface Transaction {
  id: string;
  accountId: string;
  amount: number; // positive = income, negative = expense
  category: string;
  merchant: string;
  note: string;
  date: number; // epoch ms
  createdAt: number;
}

export interface Profile {
  id: "me";
  fullName: string;
  currency: string;
  monthlyBudget: number;
  createdAt: number;
}

class KuberDB extends Dexie {
  accounts!: EntityTable<Account, "id">;
  transactions!: EntityTable<Transaction, "id">;
  profile!: EntityTable<Profile, "id">;

  constructor() {
    super("kuber_vault");
    this.version(1).stores({
      accounts: "id, name, type, createdAt",
      transactions: "id, accountId, date, category, createdAt",
      profile: "id",
    });
  }
}

export const db = new KuberDB();

export const uid = () =>
  (crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2) + Date.now().toString(36));
