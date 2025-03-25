import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useContract } from "@/lib/contract";
import { isValidAddress } from "@/lib/utils";
import { useWallet } from "@/lib/wallet";
import { useToast } from "@/hooks/use-toast";

interface BlocklistCardProps {
  className?: string;
}

export default function BlocklistCard({ className = "" }: BlocklistCardProps) {
  const { connected } = useWallet();
  const { blockAccount, unblockAccount, showTransactionModal } = useContract();
  const { toast } = useToast();
  
  const [account, setAccount] = useState("");
  const [action, setAction] = useState<"block" | "unblock">("block");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!connected) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to update blocklist",
        variant: "destructive",
      });
      return;
    }
    
    if (!isValidAddress(account)) {
      toast({
        title: "Invalid address",
        description: "Please enter a valid Ethereum address",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      showTransactionModal("pending");
      
      if (action === "block") {
        await blockAccount(account);
      } else {
        await unblockAccount(account);
      }
      
      showTransactionModal("success");
      
      // Reset form
      setAccount("");
      
      toast({
        title: action === "block" ? "Account blocked" : "Account unblocked",
        description: `${account} has been ${action === "block" ? "added to" : "removed from"} the blocklist`,
      });
    } catch (error) {
      console.error("Blocklist update error:", error);
      showTransactionModal("error", error instanceof Error ? error.message : "Unknown error");
      
      toast({
        title: "Blocklist update failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`bg-white border border-neutral-300 rounded p-4 ${className}`}>
      <h3 className="text-sm font-bold uppercase mb-3">Blocklist Management</h3>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <Label htmlFor="blocklist-account" className="block text-sm mb-1">Account Address</Label>
          <Input
            id="blocklist-account"
            type="text"
            className="w-full px-3 py-2 border border-neutral-300 rounded text-sm"
            placeholder="0x..."
            value={account}
            onChange={(e) => setAccount(e.target.value)}
            disabled={isSubmitting}
          />
        </div>
        <div className="mb-4">
          <Label htmlFor="blocklist-action" className="block text-sm mb-1">Action</Label>
          <Select
            value={action}
            onValueChange={(value) => setAction(value as "block" | "unblock")}
            disabled={isSubmitting}
          >
            <SelectTrigger id="blocklist-action" className="w-full px-3 py-2 border border-neutral-300 rounded text-sm">
              <SelectValue placeholder="Select action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="block">Add to Blocklist</SelectItem>
              <SelectItem value="unblock">Remove from Blocklist</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button
          type="submit"
          className="w-full px-3 py-1.5 bg-black text-white text-sm rounded hover:bg-accent-700 transition-colors"
          disabled={isSubmitting || !connected}
        >
          {isSubmitting ? "Processing..." : "Update Blocklist"}
        </Button>
      </form>
    </div>
  );
}
