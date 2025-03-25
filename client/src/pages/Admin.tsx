import { useEffect, useState } from "react";
import { useWallet } from "@/lib/wallet";
import { useContract } from "@/lib/contract";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatAddress } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { useLocation } from "wouter";

export default function Admin() {
  const { address, connected } = useWallet();
  const { 
    hasAdminRole, 
    mint, 
    burn, 
    transfer, 
    blockAccount,
    unblockAccount,
    pauseContract,
    unpauseContract,
    grantRole,
    revokeRole,
    updateRewardMultiplier,
    isPaused,
    loadPauseState
  } = useContract();
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [, setLocation] = useLocation();

  // Form states
  const [mintForm, setMintForm] = useState({ recipient: "", amount: "" });
  const [burnForm, setBurnForm] = useState({ from: "", amount: "" });
  const [transferForm, setTransferForm] = useState({ recipient: "", amount: "" });
  const [blocklistForm, setBlocklistForm] = useState({ account: "", action: "block" });
  const [roleForm, setRoleForm] = useState({ account: "", role: "MINTER_ROLE", action: "grant" });
  const [rewardForm, setRewardForm] = useState({ value: "" });

  useEffect(() => {
    const checkAdminStatus = async () => {
      setLoading(true);
      if (connected && address) {
        try {
          const adminStatus = await hasAdminRole(address);
          setIsAdmin(adminStatus);
          await loadPauseState();
        } catch (error) {
          console.error("Error checking admin status:", error);
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    };

    checkAdminStatus();
  }, [connected, address, hasAdminRole, loadPauseState]);

  // If user is not connected or not an admin, redirect to dashboard
  useEffect(() => {
    if (!loading && (!connected || !isAdmin)) {
      setLocation("/");
    }
  }, [loading, connected, isAdmin, setLocation]);

  // Handle form submissions
  const handleMint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mintForm.recipient || !mintForm.amount) return;
    
    try {
      await mint(mintForm.recipient, parseFloat(mintForm.amount));
      setMintForm({ recipient: "", amount: "" });
    } catch (error) {
      console.error("Mint error:", error);
    }
  };

  const handleBurn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!burnForm.from || !burnForm.amount) return;
    
    try {
      await burn(burnForm.from, parseFloat(burnForm.amount));
      setBurnForm({ from: "", amount: "" });
    } catch (error) {
      console.error("Burn error:", error);
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferForm.recipient || !transferForm.amount) return;
    
    try {
      await transfer(transferForm.recipient, parseFloat(transferForm.amount));
      setTransferForm({ recipient: "", amount: "" });
    } catch (error) {
      console.error("Transfer error:", error);
    }
  };

  const handleBlocklist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blocklistForm.account) return;
    
    try {
      if (blocklistForm.action === "block") {
        await blockAccount(blocklistForm.account);
      } else {
        await unblockAccount(blocklistForm.account);
      }
      setBlocklistForm({ account: "", action: "block" });
    } catch (error) {
      console.error("Blocklist error:", error);
    }
  };

  const handleRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleForm.account || !roleForm.role) return;
    
    try {
      if (roleForm.action === "grant") {
        await grantRole(roleForm.account, roleForm.role);
      } else {
        await revokeRole(roleForm.account, roleForm.role);
      }
      setRoleForm({ account: "", role: "MINTER_ROLE", action: "grant" });
    } catch (error) {
      console.error("Role management error:", error);
    }
  };

  const handleRewardMultiplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rewardForm.value) return;
    
    try {
      await updateRewardMultiplier(rewardForm.value);
      setRewardForm({ value: "" });
    } catch (error) {
      console.error("Reward multiplier error:", error);
    }
  };

  const handlePauseToggle = async () => {
    try {
      if (isPaused) {
        await unpauseContract();
      } else {
        await pauseContract();
      }
    } catch (error) {
      console.error("Pause toggle error:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-black border-t-transparent"></div>
      </div>
    );
  }

  if (!connected || !isAdmin) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="container mx-auto p-4 mb-16">
      <h1 className="text-2xl font-bold mb-6">USDX Admin Panel</h1>
      
      <div className="bg-neutral-100 p-3 rounded-md mb-6">
        <p className="text-sm">
          Connected as <span className="font-semibold">{formatAddress(address)}</span> with DEFAULT_ADMIN_ROLE
        </p>
      </div>

      <Alert className="mb-6">
        <AlertDescription>
          This panel is only accessible to accounts with the DEFAULT_ADMIN_ROLE. You can manage all token functions here.
        </AlertDescription>
      </Alert>

      <div className="mb-6">
        <Button 
          onClick={handlePauseToggle}
          variant={isPaused ? "outline" : "default"}
          className="w-full"
        >
          {isPaused ? "Unpause Contract" : "Pause Contract"}
        </Button>
        <p className="text-sm text-neutral-500 mt-2">
          Contract status: {isPaused ? "Paused" : "Active"}
        </p>
      </div>
      
      <Tabs defaultValue="token">
        <TabsList className="grid w-full grid-cols-4 mb-8">
          <TabsTrigger value="token">Token Operations</TabsTrigger>
          <TabsTrigger value="roles">Role Management</TabsTrigger>
          <TabsTrigger value="blocklist">Blocklist</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        
        {/* Token Operations Tab */}
        <TabsContent value="token">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Mint Card */}
            <Card>
              <CardHeader>
                <CardTitle>Mint Tokens</CardTitle>
                <CardDescription>Create new tokens and assign them to an address</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleMint} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="mint-recipient">Recipient Address</Label>
                    <Input 
                      id="mint-recipient" 
                      placeholder="0x..." 
                      value={mintForm.recipient}
                      onChange={(e) => setMintForm({...mintForm, recipient: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mint-amount">Amount</Label>
                    <Input 
                      id="mint-amount" 
                      type="number" 
                      placeholder="1000" 
                      value={mintForm.amount}
                      onChange={(e) => setMintForm({...mintForm, amount: e.target.value})}
                    />
                  </div>
                  <Button type="submit" className="w-full mt-2">Mint</Button>
                </form>
              </CardContent>
            </Card>
            
            {/* Burn Card */}
            <Card>
              <CardHeader>
                <CardTitle>Burn Tokens</CardTitle>
                <CardDescription>Destroy tokens from an address</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleBurn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="burn-from">From Address</Label>
                    <Input 
                      id="burn-from" 
                      placeholder="0x..." 
                      value={burnForm.from}
                      onChange={(e) => setBurnForm({...burnForm, from: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="burn-amount">Amount</Label>
                    <Input 
                      id="burn-amount" 
                      type="number" 
                      placeholder="1000" 
                      value={burnForm.amount}
                      onChange={(e) => setBurnForm({...burnForm, amount: e.target.value})}
                    />
                  </div>
                  <Button type="submit" className="w-full mt-2">Burn</Button>
                </form>
              </CardContent>
            </Card>
            
            {/* Transfer Card */}
            <Card>
              <CardHeader>
                <CardTitle>Transfer Tokens</CardTitle>
                <CardDescription>Transfer tokens from admin to an address</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleTransfer} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="transfer-recipient">Recipient Address</Label>
                    <Input 
                      id="transfer-recipient" 
                      placeholder="0x..." 
                      value={transferForm.recipient}
                      onChange={(e) => setTransferForm({...transferForm, recipient: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="transfer-amount">Amount</Label>
                    <Input 
                      id="transfer-amount" 
                      type="number" 
                      placeholder="1000" 
                      value={transferForm.amount}
                      onChange={(e) => setTransferForm({...transferForm, amount: e.target.value})}
                    />
                  </div>
                  <Button type="submit" className="w-full mt-2">Transfer</Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Role Management Tab */}
        <TabsContent value="roles">
          <Card>
            <CardHeader>
              <CardTitle>Role Management</CardTitle>
              <CardDescription>Grant or revoke roles from accounts</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleRole} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="role-account">Account Address</Label>
                  <Input 
                    id="role-account" 
                    placeholder="0x..." 
                    value={roleForm.account}
                    onChange={(e) => setRoleForm({...roleForm, account: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role-select">Role</Label>
                  <Select 
                    value={roleForm.role} 
                    onValueChange={(value) => setRoleForm({...roleForm, role: value})}
                  >
                    <SelectTrigger id="role-select">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MINTER_ROLE">MINTER_ROLE</SelectItem>
                      <SelectItem value="BURNER_ROLE">BURNER_ROLE</SelectItem>
                      <SelectItem value="BLOCKLIST_ROLE">BLOCKLIST_ROLE</SelectItem>
                      <SelectItem value="ORACLE_ROLE">ORACLE_ROLE</SelectItem>
                      <SelectItem value="PAUSE_ROLE">PAUSE_ROLE</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role-action">Action</Label>
                  <Select 
                    value={roleForm.action} 
                    onValueChange={(value) => setRoleForm({...roleForm, action: value as "grant" | "revoke"})}
                  >
                    <SelectTrigger id="role-action">
                      <SelectValue placeholder="Select action" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="grant">Grant</SelectItem>
                      <SelectItem value="revoke">Revoke</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full mt-2">Apply Role Change</Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Blocklist Tab */}
        <TabsContent value="blocklist">
          <Card>
            <CardHeader>
              <CardTitle>Blocklist Management</CardTitle>
              <CardDescription>Block or unblock accounts from using the token</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleBlocklist} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="blocklist-account">Account Address</Label>
                  <Input 
                    id="blocklist-account" 
                    placeholder="0x..." 
                    value={blocklistForm.account}
                    onChange={(e) => setBlocklistForm({...blocklistForm, account: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="blocklist-action">Action</Label>
                  <Select 
                    value={blocklistForm.action} 
                    onValueChange={(value) => setBlocklistForm({...blocklistForm, action: value as "block" | "unblock"})}
                  >
                    <SelectTrigger id="blocklist-action">
                      <SelectValue placeholder="Select action" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="block">Block</SelectItem>
                      <SelectItem value="unblock">Unblock</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full mt-2">Apply Blocklist Change</Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Settings Tab */}
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Contract Settings</CardTitle>
              <CardDescription>Adjust contract parameters</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleRewardMultiplier} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reward-multiplier">Reward Multiplier</Label>
                  <Input 
                    id="reward-multiplier" 
                    placeholder="1.0" 
                    value={rewardForm.value}
                    onChange={(e) => setRewardForm({...rewardForm, value: e.target.value})}
                  />
                  <p className="text-sm text-neutral-500">
                    Sets the reward multiplier for share rewards. Values are scaled in 18 decimals (1.0 = 1 * 10^18).
                  </p>
                </div>
                <Button type="submit" className="w-full mt-2">Update Reward Multiplier</Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}