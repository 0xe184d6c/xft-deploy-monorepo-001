import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useWallet } from "@/lib/wallet";
import { useContract } from "@/lib/contract";
import { useToast } from "@/hooks/use-toast";
import { Transaction } from "@/lib/types";
import { formatAddress } from "@/lib/utils";

export default function Transactions() {
  const { connected } = useWallet();
  const { getTransactionHistory } = useContract();
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (connected) {
      setIsLoading(true);
      getTransactionHistory()
        .then(txs => {
          setTransactions(txs);
        })
        .catch(error => {
          toast({
            title: "Failed to load transactions",
            description: error.message,
            variant: "destructive",
          });
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [connected, getTransactionHistory, toast]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Transaction History</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>All Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-8">
              <div className="w-8 h-8 border-4 border-t-black border-neutral-200 rounded-full animate-spin"></div>
            </div>
          ) : transactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-neutral-100 text-sm font-bold">
                    <th className="text-left py-3 px-4">Type</th>
                    <th className="text-left py-3 px-4">Tx Hash</th>
                    <th className="text-left py-3 px-4">From</th>
                    <th className="text-left py-3 px-4">To</th>
                    <th className="text-right py-3 px-4">Amount</th>
                    <th className="text-right py-3 px-4">Block</th>
                    <th className="text-right py-3 px-4">Time</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {transactions.map((tx) => (
                    <tr key={tx.hash} className="border-t border-neutral-300">
                      <td className="py-3 px-4">{tx.type}</td>
                      <td className="py-3 px-4 text-accent-500">
                        <a 
                          href={`https://sepolia.etherscan.io/tx/${tx.hash}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="hover:underline"
                        >
                          {formatAddress(tx.hash)}
                        </a>
                      </td>
                      <td className="py-3 px-4 text-accent-500">{formatAddress(tx.from)}</td>
                      <td className="py-3 px-4 text-accent-500">{formatAddress(tx.to)}</td>
                      <td className="py-3 px-4 text-right">{tx.amount} USDX</td>
                      <td className="py-3 px-4 text-right">{tx.blockNumber}</td>
                      <td className="py-3 px-4 text-right">{new Date(tx.timestamp).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-accent-500">
              No transactions found. Connect your wallet to view your transaction history.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
