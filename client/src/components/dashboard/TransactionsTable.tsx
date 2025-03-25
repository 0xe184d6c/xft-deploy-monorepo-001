import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/lib/wallet";
import { useContract } from "@/lib/contract";
import { Transaction } from "@/lib/types";
import { formatAddress } from "@/lib/utils";
import { Link } from "wouter";

export default function TransactionsTable() {
  const { connected } = useWallet();
  const { getTransactionHistory } = useContract();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (connected) {
      loadTransactions();
    }
  }, [connected]);

  const loadTransactions = async () => {
    setIsLoading(true);
    try {
      const txs = await getTransactionHistory(5); // Get only 5 recent transactions
      setTransactions(txs);
    } catch (error) {
      console.error("Failed to load transactions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">Recent Transactions</h2>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="text-xs px-3"
            onClick={loadTransactions}
            disabled={isLoading}
          >
            {isLoading ? "Loading..." : "Refresh"}
          </Button>
          <Link href="/transactions">
            <Button variant="link" className="text-sm underline">View All</Button>
          </Link>
        </div>
      </div>
      
      <div className="bg-white border border-neutral-300 rounded overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center p-8">
            <div className="w-8 h-8 border-4 border-t-black border-neutral-200 rounded-full animate-spin"></div>
          </div>
        ) : transactions.length > 0 ? (
          <table className="min-w-full">
            <thead>
              <tr className="bg-neutral-100 text-sm font-bold">
                <th className="text-left py-3 px-4">Type</th>
                <th className="text-left py-3 px-4">From</th>
                <th className="text-left py-3 px-4">To</th>
                <th className="text-right py-3 px-4">Amount</th>
                <th className="text-right py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {transactions.map((tx) => (
                <tr key={tx.hash} className="border-t border-neutral-300">
                  <td className="py-3 px-4">
                    <div className="flex flex-col">
                      <span>{tx.type}</span>
                      {tx.hash && (
                        <a 
                          href={`https://sepolia.etherscan.io/tx/${tx.hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-accent-500 hover:underline mt-1"
                        >
                          {formatAddress(tx.hash, false)}
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-accent-500">
                    <a 
                      href={`https://sepolia.etherscan.io/address/${tx.from}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      {formatAddress(tx.from)}
                    </a>
                  </td>
                  <td className="py-3 px-4 text-accent-500">
                    <a 
                      href={`https://sepolia.etherscan.io/address/${tx.to}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      {formatAddress(tx.to)}
                    </a>
                  </td>
                  <td className="py-3 px-4 text-right">{tx.amount} USDX</td>
                  <td className="py-3 px-4 text-right">
                    <span className={`inline-block px-2 py-0.5 ${tx.status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'} text-xs rounded`}>
                      {tx.status === 'confirmed' ? 'Confirmed' : 'Pending'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-8 text-accent-500">
            {connected ? 'No recent transactions found.' : 'Connect your wallet to view your transaction history.'}
          </div>
        )}
      </div>
    </div>
  );
}
