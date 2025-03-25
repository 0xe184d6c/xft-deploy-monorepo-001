import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/lib/wallet";
import { useContract } from "@/lib/contract";
import { useToast } from "@/hooks/use-toast";
import { NetworkConfig } from "@/lib/types";

export default function Settings() {
  const { connected, connect, disconnect } = useWallet();
  const { networkConfig } = useContract();
  const { toast } = useToast();
  const [customRpcUrl, setCustomRpcUrl] = useState("");
  
  useEffect(() => {
    // Initialize with existing RPC URL if available
    if (networkConfig?.rpcUrl) {
      setCustomRpcUrl(networkConfig.rpcUrl);
    }
  }, [networkConfig]);

  const handleSaveRpcUrl = () => {
    if (!customRpcUrl) {
      toast({
        title: "Invalid RPC URL",
        description: "Please enter a valid RPC URL",
        variant: "destructive",
      });
      return;
    }

    // Save the custom RPC URL to localStorage
    try {
      localStorage.setItem("usdx-custom-rpc", customRpcUrl);
      toast({
        title: "RPC URL Updated",
        description: "The RPC URL has been updated. Please reconnect your wallet.",
      });
      
      // Force reconnect to apply the new RPC URL
      if (connected) {
        disconnect();
        setTimeout(() => connect(), 1000);
      }
    } catch (error) {
      toast({
        title: "Error Saving RPC URL",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Network Settings</CardTitle>
            <CardDescription>Configure network connection settings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Label htmlFor="network">Network</Label>
              <Input
                id="network"
                value="Sepolia Testnet"
                disabled
                className="mt-1"
              />
            </div>
            
            <div className="mb-4">
              <Label htmlFor="chainId">Chain ID</Label>
              <Input
                id="chainId"
                value={networkConfig?.chainId || 11155111}
                disabled
                className="mt-1"
              />
            </div>
            
            <div className="mb-4">
              <Label htmlFor="rpcUrl">Custom RPC URL (Optional)</Label>
              <Input
                id="rpcUrl"
                placeholder="https://sepolia.infura.io/v3/your-api-key"
                value={customRpcUrl}
                onChange={(e) => setCustomRpcUrl(e.target.value)}
                className="mt-1"
              />
              <p className="text-xs text-accent-500 mt-1">
                Enter a custom RPC URL if you want to use your own provider.
              </p>
            </div>
            
            <Button
              className="bg-black text-white hover:bg-accent-700"
              onClick={handleSaveRpcUrl}
            >
              Save RPC Settings
            </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Wallet Connection</CardTitle>
            <CardDescription>Manage your wallet connection</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Label>Connection Status</Label>
              <div className="flex items-center mt-2">
                <div className={`w-2 h-2 rounded-full ${connected ? 'bg-success' : 'bg-error'} mr-2`}></div>
                <span>{connected ? 'Connected' : 'Disconnected'}</span>
              </div>
            </div>
            
            {connected && (
              <div className="mb-4">
                <Label>Connected Address</Label>
                <Input
                  value={networkConfig?.userAddress || ''}
                  disabled
                  className="mt-1"
                />
              </div>
            )}
            
            <Button
              className="w-full bg-black text-white hover:bg-accent-700"
              onClick={connected ? disconnect : connect}
            >
              {connected ? 'Disconnect Wallet' : 'Connect Wallet'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
