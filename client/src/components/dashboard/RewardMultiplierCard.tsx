import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/lib/wallet";
import { useContract } from "@/lib/contract";
import RewardMultiplierModal from "@/components/modals/RewardMultiplierModal";

interface RewardMultiplierCardProps {
  className?: string;
}

export default function RewardMultiplierCard({ className = "" }: RewardMultiplierCardProps) {
  const { connected } = useWallet();
  const { rewardMultiplier, hasOracleRole, loadRewardMultiplier } = useContract();
  const [isRewardModalOpen, setIsRewardModalOpen] = useState(false);
  const [canUpdateMultiplier, setCanUpdateMultiplier] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (connected) {
      setIsLoading(true);
      Promise.all([
        loadRewardMultiplier(),
        hasOracleRole()
      ])
        .then(([_, hasRole]) => {
          setCanUpdateMultiplier(hasRole);
        })
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  }, [connected, loadRewardMultiplier, hasOracleRole]);

  const handleOpenRewardModal = () => {
    setIsRewardModalOpen(true);
  };

  const handleCloseRewardModal = () => {
    setIsRewardModalOpen(false);
  };

  // Format reward multiplier to display nicely
  const formattedRewardMultiplier = () => {
    if (!rewardMultiplier) return '1.0';
    
    // The reward multiplier is represented with 18 decimal places
    const multiplierValue = parseFloat(rewardMultiplier) / 1e18;
    return multiplierValue.toFixed(4);
  };

  return (
    <>
      <div className={`bg-white border border-neutral-300 rounded p-4 ${className}`}>
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm font-bold uppercase">Reward Multiplier</h3>
          <span className="text-xs px-2 py-0.5 bg-neutral-200 rounded">BASE: 1e18</span>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center py-4">
            <div className="w-6 h-6 border-2 border-t-black border-neutral-200 rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            <div className="flex items-baseline mb-4">
              <span className="text-2xl font-bold mr-2">{formattedRewardMultiplier()}</span>
              <span className="text-sm text-accent-500">x</span>
            </div>
            <div className="text-xs text-accent-500 mb-3">
              <span>Controls token/share ratio</span>
            </div>
          </>
        )}
        
        <Button
          className="w-full px-3 py-1.5 bg-black text-white text-sm rounded hover:bg-accent-700 transition-colors"
          disabled={!connected || !canUpdateMultiplier}
          onClick={handleOpenRewardModal}
        >
          Update Multiplier
        </Button>
      </div>

      <RewardMultiplierModal isOpen={isRewardModalOpen} onClose={handleCloseRewardModal} />
    </>
  );
}
