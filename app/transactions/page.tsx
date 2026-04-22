import { TransactionsPanel } from "@/components/transactions/TransactionsPanel";

export default function TransactionsPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Transactions</h1>
      <TransactionsPanel />
    </div>
  );
}
