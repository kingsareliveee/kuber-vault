import { Wallet, Landmark, Smartphone, PiggyBank, Coins, Sparkles } from "lucide-react";

export function AccountIcon({ icon, className }: { icon: string; className?: string }) {
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
