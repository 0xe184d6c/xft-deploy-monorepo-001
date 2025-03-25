import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useContract } from "@/lib/contract";
import { isValidAddress } from "@/lib/utils";
import { useWallet } from "@/lib/wallet";
import { useToast } from "@/hooks/use-toast";

interface MintCardProps {
  className?: string;
}

export default function MintCard({ className = "" }: MintCardProps) {
  const { connected } = useWallet();
  const { mint, showTransactionModal } = useContract();
  const { toast } = useToast();
  
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!connected) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to mint tokens",
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
    
    setIsSubmitting(true);
    
    try {
      showTransactionModal("pending");
      await mint(recipient, amountValue);
      showTransactionModal("success");
      
      // Reset form
      setRecipient("");
      setAmount("");
      
      toast({
        title: "Tokens minted successfully",
        description: `${amountValue} USDX minted to ${recipient}`,
      });
    } catch (error) {
      console.error("Mint error:", error);
      showTransactionModal("error", error instanceof Error ? error.message : "Unknown error");
      
      toast({
        title: "Mint failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`bg-white border border-neutral-300 rounded p-4 ${className}`}>
      <h3 className="text-sm font-bold uppercase mb-3">Mint Tokens</h3>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <Label htmlFor="mint-recipient" className="block text-sm mb-1">Recipient Address</Label>
          <Input
            id="mint-recipient"
            type="text"
            className="w-full px-3 py-2 border border-neutral-300 rounded text-sm"
            placeholder="0x..."
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            disabled={isSubmitting}
          />
        </div>
        <div className="mb-4">
          <Label htmlFor="mint-amount" className="block text-sm mb-1">Amount (USDX)</Label>
          <Input
            id="mint-amount"
            type="number"
            className="w-full px-3 py-2 border border-neutral-300 rounded text-sm"
            placeholder="0.00"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={isSubmitting}
          />
        </div>
        <Button
          type="submit"
          className="w-full px-3 py-1.5 bg-black text-white text-sm rounded hover:bg-accent-700 transition-colors"
          disabled={isSubmitting || !connected}
        >
          {isSubmitting ? "Processing..." : "Mint Tokens"}
        </Button>
      </form>
    </div>
  );
}
