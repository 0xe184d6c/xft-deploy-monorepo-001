import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { useWallet } from "@/lib/wallet";
import { useContract } from "@/lib/contract";
import { useToast } from "@/hooks/use-toast";
import { formatAddress } from "@/lib/utils";

export default function ContractInfo() {
  const { connected } = useWallet();
  const { networkConfig } = useContract();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        toast({
          title: "Copied to clipboard",
          description: `${label} copied to clipboard`,
        });
      },
      (err) => {
        console.error('Failed to copy: ', err);
        toast({
          title: "Failed to copy",
          description: "Please try again",
          variant: "destructive",
        });
      }
    );
  };

  return (
    <div>
      <h2 className="text-lg font-bold mb-4">Contract Information</h2>
      
      <div className="bg-white border border-neutral-300 rounded p-4">
        {isLoading ? (
          <div className="flex justify-center p-8">
            <div className="w-8 h-8 border-4 border-t-black border-neutral-200 rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <div className="mb-3">
                <div className="font-bold mb-1">Token Name</div>
                <div className="text-accent-500">
                  {networkConfig?.token?.name || "XFT Digital Dollar"}
                </div>
              </div>
              <div className="mb-3">
                <div className="font-bold mb-1">Token Symbol</div>
                <div className="text-accent-500">
                  {networkConfig?.token?.symbol || "USDX"}
                </div>
              </div>
              <div className="mb-3">
                <div className="font-bold mb-1">Proxy Address</div>
                <div className="flex items-center">
                  <a 
                    href={`https://sepolia.etherscan.io/address/${networkConfig?.addresses?.proxy}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-accent-500 hover:underline truncate"
                  >
                    {networkConfig?.addresses?.proxy 
                      ? formatAddress(networkConfig.addresses.proxy, true) 
                      : "0x421C76cd7C1550c4fcc974F4d74c870150c45995"}
                  </a>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="ml-2 p-1 hover:bg-neutral-100 rounded"
                    onClick={() => copyToClipboard(
                      networkConfig?.addresses?.proxy || "0x421C76cd7C1550c4fcc974F4d74c870150c45995",
                      "Proxy address"
                    )}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
            <div>
              <div className="mb-3">
                <div className="font-bold mb-1">Implementation Address</div>
                <div className="flex items-center">
                  <a 
                    href={`https://sepolia.etherscan.io/address/${networkConfig?.addresses?.implementation}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-accent-500 hover:underline truncate"
                  >
                    {networkConfig?.addresses?.implementation 
                      ? formatAddress(networkConfig.addresses.implementation, true) 
                      : "0xf6080682dFCa67A25F294343a03C8cd8675cc41E"}
                  </a>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="ml-2 p-1 hover:bg-neutral-100 rounded"
                    onClick={() => copyToClipboard(
                      networkConfig?.addresses?.implementation || "0xf6080682dFCa67A25F294343a03C8cd8675cc41E",
                      "Implementation address"
                    )}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="mb-3">
                <div className="font-bold mb-1">Owner</div>
                <div className="flex items-center">
                  <a 
                    href={`https://sepolia.etherscan.io/address/${networkConfig?.token?.owner}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-accent-500 hover:underline truncate"
                  >
                    {networkConfig?.token?.owner 
                      ? formatAddress(networkConfig.token.owner, true) 
                      : "0x2f572059DbC598C8acfeA4AF06FE4f7669D1b3b1"}
                  </a>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="ml-2 p-1 hover:bg-neutral-100 rounded"
                    onClick={() => copyToClipboard(
                      networkConfig?.token?.owner || "0x2f572059DbC598C8acfeA4AF06FE4f7669D1b3b1",
                      "Owner address"
                    )}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="mb-3">
                <div className="font-bold mb-1">Network</div>
                <div className="text-accent-500">
                  <span>{networkConfig?.network || "Sepolia"}</span> (Chain ID: <span>{networkConfig?.chainId || "11155111"}</span>)
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
