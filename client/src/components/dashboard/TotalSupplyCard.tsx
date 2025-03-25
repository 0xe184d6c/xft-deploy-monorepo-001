import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useWallet } from "@/lib/wallet";
import { formatDateTime } from "@/lib/utils";
import { useTokenInfo } from "@/lib/api";

export default function TotalSupplyCard() {
  const { connected } = useWallet();
  const { data, isLoading, refetch } = useTokenInfo();
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const totalSupply = data?.totalSupply ? Number(data.totalSupply) / 10**Number(data.decimals) : 0;
  const totalShares = data?.totalShares || '0';

  const refreshTotalSupply = async () => {
    try {
      await refetch();
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Failed to load total supply:", error);
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
          disabled={isLoading}
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
            <span className="text-2xl font-bold mr-2">{totalSupply.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            <span className="text-sm text-accent-500">{data?.symbol || 'USDX'}</span>
          </div>
          <div className="text-xs text-accent-500 mb-3">
            <span>Total Shares: </span>
            <span>{totalShares}</span>
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
