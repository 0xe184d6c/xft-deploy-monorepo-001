import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";
import { useWallet } from "@/lib/wallet";
import { useContract } from "@/lib/contract";
import { useToast } from "@/hooks/use-toast";

interface RewardMultiplierModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function RewardMultiplierModal({ isOpen, onClose }: RewardMultiplierModalProps) {
  const { connected } = useWallet();
  const { rewardMultiplier, updateRewardMultiplier, showTransactionModal } = useContract();
  const { toast } = useToast();
  
  const [value, setValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update form value when reward multiplier changes
  useEffect(() => {
    if (isOpen && rewardMultiplier) {
      // Convert from big decimal to float
      const multiplierValue = parseFloat(rewardMultiplier) / 1e18;
      setValue(multiplierValue.toString());
    }
  }, [isOpen, rewardMultiplier]);

  const handleUpdateMultiplier = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!connected) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to update the reward multiplier",
        variant: "destructive",
      });
      return;
    }
    
    const multiplierValue = parseFloat(value);
    if (isNaN(multiplierValue) || multiplierValue <= 0) {
      toast({
        title: "Invalid value",
        description: "Please enter a valid positive number",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      showTransactionModal("pending");
      
      // Convert to big decimal format (multiply by 10^18)
      const bigDecimalValue = (multiplierValue * 1e18).toString();
      await updateRewardMultiplier(bigDecimalValue);
      
      showTransactionModal("success");
      
      // Close modal
      onClose();
      
      toast({
        title: "Reward multiplier updated",
        description: `Reward multiplier has been set to ${value}`,
      });
    } catch (error) {
      console.error("Update reward multiplier error:", error);
      showTransactionModal("error", error instanceof Error ? error.message : "Unknown error");
      
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-white rounded-lg shadow-lg w-full max-w-md">
        <DialogHeader className="flex justify-between items-center p-4 border-b border-neutral-300">
          <DialogTitle className="font-bold">Update Reward Multiplier</DialogTitle>
          <DialogClose asChild>
            <Button variant="ghost" size="icon" className="p-1 hover:bg-neutral-100 rounded">
              <X className="w-5 h-5" />
            </Button>
          </DialogClose>
        </DialogHeader>
        
        <div className="p-4">
          <div className="mb-4 bg-neutral-100 p-3 rounded text-sm">
            <p>The reward multiplier controls the conversion between tokens and shares. Changing this value will affect all token balances.</p>
            <p className="mt-2">Current multiplier: <strong>{rewardMultiplier ? (parseFloat(rewardMultiplier) / 1e18).toFixed(4) : '1.0'}</strong> x</p>
          </div>
          
          <form onSubmit={handleUpdateMultiplier}>
            <div className="mb-4">
              <Label htmlFor="multiplier-value" className="block text-sm mb-1">New Multiplier</Label>
              <Input
                id="multiplier-value"
                type="number"
                className="w-full px-3 py-2 border border-neutral-300 rounded text-sm"
                placeholder="1.0"
                min="0"
                step="0.000000000000000001"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                disabled={isSubmitting}
              />
              <div className="text-xs text-accent-500 mt-1">
                BASE value: 1e18 (1,000,000,000,000,000,000)
              </div>
            </div>
            
            <div className="flex space-x-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1 px-4 py-2 border border-black text-black text-sm rounded hover:bg-neutral-100 transition-colors"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 px-4 py-2 bg-black text-white text-sm rounded hover:bg-accent-700 transition-colors"
                disabled={isSubmitting || !connected}
              >
                {isSubmitting ? "Processing..." : "Update"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
