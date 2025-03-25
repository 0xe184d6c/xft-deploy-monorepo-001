import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useContract } from "@/lib/contract";
import { useWallet } from "@/lib/wallet";
import { useToast } from "@/hooks/use-toast";

interface PauseCardProps {
  className?: string;
}

export default function PauseCard({ className = "" }: PauseCardProps) {
  const { connected } = useWallet();
  const { isPaused, pauseContract, unpauseContract, loadPauseState, showTransactionModal } = useContract();
  const { toast } = useToast();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (connected) {
      setLoading(true);
      loadPauseState()
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [connected, loadPauseState]);

  const handlePause = async () => {
    if (!connected) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to pause the contract",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      showTransactionModal("pending");
      await pauseContract();
      showTransactionModal("success");
      
      toast({
        title: "Contract paused",
        description: "The contract has been paused successfully",
      });
    } catch (error) {
      console.error("Pause error:", error);
      showTransactionModal("error", error instanceof Error ? error.message : "Unknown error");
      
      toast({
        title: "Pause failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnpause = async () => {
    if (!connected) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to unpause the contract",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      showTransactionModal("pending");
      await unpauseContract();
      showTransactionModal("success");
      
      toast({
        title: "Contract unpaused",
        description: "The contract has been unpaused successfully",
      });
    } catch (error) {
      console.error("Unpause error:", error);
      showTransactionModal("error", error instanceof Error ? error.message : "Unknown error");
      
      toast({
        title: "Unpause failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`bg-white border border-neutral-300 rounded p-4 ${className}`}>
      <h3 className="text-sm font-bold uppercase mb-3">Contract Status</h3>
      
      {loading ? (
        <div className="flex justify-center py-4">
          <div className="w-6 h-6 border-2 border-t-black border-neutral-200 rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="flex items-center mb-4">
          <span className="text-sm mr-2">Current Status:</span>
          <span className="px-2 py-0.5 text-xs rounded">
            <span className={`${isPaused ? 'bg-error' : 'bg-success'} text-white px-2 py-0.5 rounded text-xs`}>
              {isPaused ? 'Paused' : 'Active'}
            </span>
          </span>
        </div>
      )}
      
      <div className="flex space-x-2">
        <Button
          className="flex-1 px-3 py-1.5 bg-black text-white text-sm rounded hover:bg-accent-700 transition-colors"
          disabled={isSubmitting || loading || isPaused || !connected}
          onClick={handlePause}
        >
          Pause
        </Button>
        <Button
          className="flex-1 px-3 py-1.5 bg-white border border-black text-black text-sm rounded hover:bg-neutral-100 transition-colors"
          disabled={isSubmitting || loading || !isPaused || !connected}
          variant="outline"
          onClick={handleUnpause}
        >
          Unpause
        </Button>
      </div>
    </div>
  );
}
