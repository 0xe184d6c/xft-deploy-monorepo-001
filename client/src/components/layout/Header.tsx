import { useWallet } from "@/lib/wallet";
import { Button } from "@/components/ui/button";
import { useContract } from "@/lib/contract";
import { formatAddress } from "@/lib/utils";

export default function Header() {
  const { connected, connect, address } = useWallet();
  const { networkConfig } = useContract();

  return (
    <header className="bg-white border-b border-neutral-300 py-3 px-4 flex justify-between items-center">
      <div className="flex items-center">
        <h1 className="text-lg font-bold">XFT Digital Dollar</h1>
        <span className="ml-4 px-2 py-1 text-xs bg-neutral-200 rounded text-accent-500">
          Sepolia Testnet
        </span>
      </div>
      
      <div className="flex items-center">
        {connected && (
          <div className="hidden md:flex items-center mr-3">
            <span className="w-2 h-2 rounded-full bg-success mr-2"></span>
            <span className="text-sm mr-1">Sepolia</span>
          </div>
        )}
        
        {!connected ? (
          <Button 
            className="px-4 py-1.5 bg-black text-white text-sm rounded hover:bg-accent-700 transition-colors"
            onClick={connect}
          >
            Connect Wallet
          </Button>
        ) : (
          <div className="flex items-center">
            <span className="text-sm px-3 py-1.5 bg-neutral-200 rounded-md truncate max-w-[150px]">
              {formatAddress(address)}
            </span>
          </div>
        )}
      </div>
    </header>
  );
}
