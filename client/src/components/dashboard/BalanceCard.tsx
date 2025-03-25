import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/lib/wallet";
import { useContract } from "@/lib/contract";
import TransferModal from "@/components/modals/TransferModal";

export default function BalanceCard() {
  const { connected } = useWallet();
  const { userBalance, userShares, loadUserBalance } = useContract();
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (connected) {
      setIsLoading(true);
      loadUserBalance()
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  }, [connected, loadUserBalance]);

  const handleOpenTransfer = () => {
    setIsTransferModalOpen(true);
  };

  const handleCloseTransfer = () => {
    setIsTransferModalOpen(false);
  };

  const handleOpenHistory = () => {
    // Navigate to transactions page
    window.location.href = "/transactions";
  };

  return (
    <>
      <div className="bg-white border border-neutral-300 rounded p-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm font-bold uppercase">Your Balance</h3>
          <span className="text-xs px-2 py-0.5 bg-neutral-200 rounded">USDX</span>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center py-4">
            <div className="w-6 h-6 border-2 border-t-black border-neutral-200 rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            <div className="flex items-baseline mb-4">
              <span className="text-2xl font-bold mr-2">{connected ? userBalance : '0.00'}</span>
              <span className="text-sm text-accent-500">USDX</span>
            </div>
            <div className="text-xs text-accent-500 mb-3">
              <span>Shares: </span>
              <span>{connected ? userShares : '0'}</span>
            </div>
          </>
        )}
        
        <div className="flex space-x-2">
          <Button 
            className="px-3 py-1.5 bg-black text-white text-sm rounded hover:bg-accent-700 transition-colors flex-1"
            disabled={!connected}
            onClick={handleOpenTransfer}
          >
            Transfer
          </Button>
          <Button 
            className="px-3 py-1.5 bg-white border border-black text-black text-sm rounded hover:bg-neutral-100 transition-colors flex-1"
            disabled={!connected}
            onClick={handleOpenHistory}
            variant="outline"
          >
            History
          </Button>
        </div>
      </div>

      {isTransferModalOpen && (
        <TransferModal isOpen={isTransferModalOpen} onClose={handleCloseTransfer} />
      )}
    </>
  );
}
