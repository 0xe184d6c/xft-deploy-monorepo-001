import { useEffect } from "react";
import NetworkAlert from "@/components/shared/NetworkAlert";
import BalanceCard from "@/components/dashboard/BalanceCard";
import TotalSupplyCard from "@/components/dashboard/TotalSupplyCard";
import RewardMultiplierCard from "@/components/dashboard/RewardMultiplierCard";
import AdminFunctions from "@/components/dashboard/AdminFunctions";
import TransactionsTable from "@/components/dashboard/TransactionsTable";
import ContractInfo from "@/components/dashboard/ContractInfo";
import TransferModal from "@/components/modals/TransferModal";
import RewardMultiplierModal from "@/components/modals/RewardMultiplierModal";
import { useWallet } from "@/lib/wallet";
import { useContract } from "@/lib/contract";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const { connected, connect } = useWallet();
  const { loadContractData } = useContract();
  const { toast } = useToast();

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

  return (
    <>
      <NetworkAlert />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <BalanceCard />
        <TotalSupplyCard />
        <RewardMultiplierCard />
      </div>
      
      <AdminFunctions />
      
      <TransactionsTable />
      
      <ContractInfo />
      
      <TransferModal />
      <RewardMultiplierModal />
    </>
  );
}
