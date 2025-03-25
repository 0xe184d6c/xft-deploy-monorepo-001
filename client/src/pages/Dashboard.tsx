import { useEffect, useState } from "react";
import NetworkAlert from "@/components/shared/NetworkAlert";
import BalanceCard from "@/components/dashboard/BalanceCard";
import TotalSupplyCard from "@/components/dashboard/TotalSupplyCard";
import RewardMultiplierCard from "@/components/dashboard/RewardMultiplierCard";
import AdminFunctions from "@/components/dashboard/AdminFunctions";
import TransactionsTable from "@/components/dashboard/TransactionsTable";
import ContractInfo from "@/components/dashboard/ContractInfo";
import TransferModal from "@/components/modals/TransferModal";
import RewardMultiplierModal from "@/components/modals/RewardMultiplierModal";
import TransactionStatusModal from "@/components/modals/TransactionStatusModal";
import { useWallet } from "@/lib/wallet";
import { useContract } from "@/lib/contract";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, Wallet, RefreshCw } from "lucide-react";

export default function Dashboard() {
  const { connected, connect, address } = useWallet();
  const { loadContractData, networkConfig } = useContract();
  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showRewardModal, setShowRewardModal] = useState(false);

  useEffect(() => {
    if (connected) {
      loadContractData().catch(error => {
        toast({
          title: "Failed to load contract data",
          description: error.message,
          variant: "destructive",
        });
      });
    }
  }, [connected, loadContractData, toast]);

  const refreshData = async () => {
    if (!connected) return;
    
    setIsRefreshing(true);
    try {
      await loadContractData();
      toast({
        title: "Data refreshed",
        description: "Contract data has been updated"
      });
    } catch (error) {
      toast({
        title: "Refresh failed",
        description: error instanceof Error ? error.message : "Failed to refresh data",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <>
      <NetworkAlert />
      
      <div className="flex flex-col space-y-6 mb-8">
        {/* Connect Wallet Card */}
        {!connected && (
          <Card className="border-2 border-black bg-white">
            <CardHeader className="pb-2">
              <CardTitle>Connect your wallet</CardTitle>
              <CardDescription>
                Connect your wallet to interact with the XFT Digital Dollar (USDX) contract
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={connect} 
                className="bg-black text-white hover:bg-neutral-800 mt-2"
              >
                <Wallet className="mr-2 h-4 w-4" /> Connect Wallet
              </Button>
            </CardContent>
          </Card>
        )}
        
        {/* Quick Actions */}
        {connected && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-white border border-neutral-300">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Contract Address</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <span className="font-mono text-sm truncate">{networkConfig.addresses.proxy}</span>
                  <a 
                    href={`https://sepolia.etherscan.io/address/${networkConfig.addresses.proxy}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="ml-1"
                  >
                    <ArrowUpRight className="h-4 w-4" />
                  </a>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white border border-neutral-300">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Connected As</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <span className="font-mono text-sm truncate">{address}</span>
                  <a 
                    href={`https://sepolia.etherscan.io/address/${address}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="ml-1"
                  >
                    <ArrowUpRight className="h-4 w-4" />
                  </a>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white border border-neutral-300">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex space-x-2">
                  <Button 
                    size="sm" 
                    onClick={() => setShowTransferModal(true)}
                    className="bg-black text-white hover:bg-neutral-800 text-xs"
                  >
                    Transfer
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={refreshData} 
                    className="text-xs"
                    disabled={isRefreshing}
                  >
                    {isRefreshing ? (
                      <RefreshCw className="h-3 w-3 animate-spin" />
                    ) : (
                      "Refresh"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white border border-neutral-300">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Network</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
                  <span className="text-sm">Sepolia Testnet</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
      
      {connected && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <BalanceCard />
            <TotalSupplyCard />
            <RewardMultiplierCard />
          </div>
      
          <AdminFunctions />
          
          <TransactionsTable />
          
          <ContractInfo />
        </>
      )}
      
      <TransactionStatusModal />
      <TransferModal isOpen={showTransferModal} onClose={() => setShowTransferModal(false)} />
      <RewardMultiplierModal isOpen={showRewardModal} onClose={() => setShowRewardModal(false)} />
    </>
  );
}
