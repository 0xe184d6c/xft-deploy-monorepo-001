import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useWallet } from "@/lib/wallet";
import { useContract } from "@/lib/contract";
import { formatDateTime } from "@/lib/utils";

export default function TotalSupplyCard() {
  const { connected } = useWallet();
  const { totalSupply, totalShares, loadTotalSupply } = useContract();
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    if (connected) {
      refreshTotalSupply();
    }
  }, [connected]);

  const refreshTotalSupply = async () => {
    setIsLoading(true);
    try {
      await loadTotalSupply();
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Failed to load total supply:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white border border-neutral-300 rounded p-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-bold uppercase">Total Supply</h3>
        <Button
          variant="ghost"
          size="icon"
          className="p-1 hover:bg-neutral-100 rounded"
          onClick={refreshTotalSupply}
          disabled={isLoading || !connected}
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center py-4">
          <div className="w-6 h-6 border-2 border-t-black border-neutral-200 rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          <div className="flex items-baseline mb-4">
            <span className="text-2xl font-bold mr-2">{connected ? totalSupply : '0.00'}</span>
            <span className="text-sm text-accent-500">USDX</span>
          </div>
          <div className="text-xs text-accent-500 mb-3">
            <span>Total Shares: </span>
            <span>{connected ? totalShares : '0'}</span>
          </div>
        </>
      )}
      
      <div className="flex items-center text-xs text-accent-500">
        <RefreshCw className="w-4 h-4 mr-1" />
        <span>Last updated: </span>
        <span className="ml-1">
          {lastUpdated ? formatDateTime(lastUpdated) : 'Never'}
        </span>
      </div>
    </div>
  );
}
