import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useContract } from "@/lib/contract";
import { isValidAddress } from "@/lib/utils";
import { useWallet } from "@/lib/wallet";
import { useToast } from "@/hooks/use-toast";

interface RoleManagementCardProps {
  className?: string;
}

export default function RoleManagementCard({ className = "" }: RoleManagementCardProps) {
  const { connected } = useWallet();
  const { grantRole, revokeRole, showTransactionModal } = useContract();
  const { toast } = useToast();
  
  const [account, setAccount] = useState("");
  const [role, setRole] = useState<string>("MINTER_ROLE");
  const [action, setAction] = useState<"grant" | "revoke">("grant");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!connected) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to manage roles",
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
      
      if (action === "grant") {
        await grantRole(account, role);
      } else {
        await revokeRole(account, role);
      }
      
      showTransactionModal("success");
      
      // Reset form
      setAccount("");
      
      toast({
        title: action === "grant" ? "Role granted" : "Role revoked",
        description: `${role} has been ${action === "grant" ? "granted to" : "revoked from"} ${account}`,
      });
    } catch (error) {
      console.error("Role management error:", error);
      showTransactionModal("error", error instanceof Error ? error.message : "Unknown error");
      
      toast({
        title: "Role management failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`bg-white border border-neutral-300 rounded p-4 ${className}`}>
      <h3 className="text-sm font-bold uppercase mb-3">Role Management</h3>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <Label htmlFor="role-account" className="block text-sm mb-1">Account Address</Label>
          <Input
            id="role-account"
            type="text"
            className="w-full px-3 py-2 border border-neutral-300 rounded text-sm"
            placeholder="0x..."
            value={account}
            onChange={(e) => setAccount(e.target.value)}
            disabled={isSubmitting}
          />
        </div>
        <div className="mb-3">
          <Label htmlFor="role-type" className="block text-sm mb-1">Role</Label>
          <Select
            value={role}
            onValueChange={(value) => setRole(value)}
            disabled={isSubmitting}
          >
            <SelectTrigger id="role-type" className="w-full px-3 py-2 border border-neutral-300 rounded text-sm">
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MINTER_ROLE">MINTER_ROLE</SelectItem>
              <SelectItem value="BURNER_ROLE">BURNER_ROLE</SelectItem>
              <SelectItem value="BLOCKLIST_ROLE">BLOCKLIST_ROLE</SelectItem>
              <SelectItem value="ORACLE_ROLE">ORACLE_ROLE</SelectItem>
              <SelectItem value="UPGRADE_ROLE">UPGRADE_ROLE</SelectItem>
              <SelectItem value="PAUSE_ROLE">PAUSE_ROLE</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="mb-4">
          <Label htmlFor="role-action" className="block text-sm mb-1">Action</Label>
          <Select
            value={action}
            onValueChange={(value) => setAction(value as "grant" | "revoke")}
            disabled={isSubmitting}
          >
            <SelectTrigger id="role-action" className="w-full px-3 py-2 border border-neutral-300 rounded text-sm">
              <SelectValue placeholder="Select action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="grant">Grant Role</SelectItem>
              <SelectItem value="revoke">Revoke Role</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button
          type="submit"
          className="w-full px-3 py-1.5 bg-black text-white text-sm rounded hover:bg-accent-700 transition-colors"
          disabled={isSubmitting || !connected}
        >
          {isSubmitting ? "Processing..." : "Update Role"}
        </Button>
      </form>
    </div>
  );
}
