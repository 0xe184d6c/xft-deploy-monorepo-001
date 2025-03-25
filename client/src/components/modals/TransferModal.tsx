import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";
import { useWallet } from "@/lib/wallet";
import { useContract } from "@/lib/contract";
import { useToast } from "@/hooks/use-toast";
import { isValidAddress } from "@/lib/utils";

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TransferModal({ isOpen, onClose }: TransferModalProps) {
  const { connected } = useWallet();
  const { transfer, userBalance, showTransactionModal } = useContract();
  const { toast } = useToast();
  
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setRecipient("");
      setAmount("");
    }
  }, [isOpen]);

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!connected) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to transfer tokens",
        variant: "destructive",
      });
      return;
    }
    
    if (!isValidAddress(recipient)) {
      toast({
        title: "Invalid address",
        description: "Please enter a valid Ethereum address",
        variant: "destructive",
      });
      return;
    }
    
    const amountValue = parseFloat(amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid amount greater than 0",
        variant: "destructive",
      });
      return;
    }
    
    const balance = parseFloat(userBalance);
    if (amountValue > balance) {
      toast({
        title: "Insufficient balance",
        description: `You only have ${balance} USDX available`,
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      showTransactionModal("pending");
      await transfer(recipient, amountValue);
      showTransactionModal("success");
      
      // Close modal and reset form
      onClose();
      
      toast({
        title: "Transfer successful",
        description: `${amountValue} USDX transferred to ${recipient}`,
      });
    } catch (error) {
      console.error("Transfer error:", error);
      showTransactionModal("error", error instanceof Error ? error.message : "Unknown error");
      
      toast({
        title: "Transfer failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSetMaxAmount = () => {
    if (userBalance) {
      setAmount(userBalance);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-white rounded-lg shadow-lg w-full max-w-md">
        <DialogHeader className="flex justify-between items-center p-4 border-b border-neutral-300">
          <DialogTitle className="font-bold">Transfer USDX</DialogTitle>
          <DialogClose asChild>
            <Button variant="ghost" size="icon" className="p-1 hover:bg-neutral-100 rounded">
              <X className="w-5 h-5" />
            </Button>
          </DialogClose>
        </DialogHeader>
        
        <form className="p-4" onSubmit={handleTransfer}>
          <div className="mb-3">
            <Label htmlFor="transfer-recipient" className="block text-sm mb-1">Recipient Address</Label>
            <Input
              id="transfer-recipient"
              type="text"
              className="w-full px-3 py-2 border border-neutral-300 rounded text-sm"
              placeholder="0x..."
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
          
          <div className="mb-4">
            <Label htmlFor="transfer-amount" className="block text-sm mb-1">Amount (USDX)</Label>
            <div className="flex items-center">
              <Input
                id="transfer-amount"
                type="number"
                className="w-full px-3 py-2 border border-neutral-300 rounded-l text-sm"
                placeholder="0.00"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={isSubmitting}
              />
              <Button
                type="button"
                variant="outline"
                className="px-3 py-2 bg-neutral-100 border border-neutral-300 border-l-0 rounded-r text-sm"
                onClick={handleSetMaxAmount}
                disabled={isSubmitting}
              >
                Max
              </Button>
            </div>
            <div className="text-xs text-accent-500 mt-1">
              Available: <span>{userBalance || '0.00'}</span> USDX
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
              {isSubmitting ? "Processing..." : "Transfer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
