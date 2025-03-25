import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import BlocklistCard from "@/components/dashboard/BlocklistCard";
import { useWallet } from "@/lib/wallet";
import { useContract } from "@/lib/contract";
import { useToast } from "@/hooks/use-toast";
import { formatAddress } from "@/lib/utils";
import { BlocklistInfo } from "@/lib/types";

export default function Blocklist() {
  const { connected, address } = useWallet();
  const { getBlocklistInfo, hasBlocklistRole } = useContract();
  const { toast } = useToast();
  const [blocklistInfo, setBlocklistInfo] = useState<BlocklistInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasRole, setHasRole] = useState(false);

  useEffect(() => {
    if (connected) {
      setIsLoading(true);
      
      Promise.all([
        getBlocklistInfo(),
        hasBlocklistRole(address)
      ])
        .then(([blocklist, role]) => {
          setBlocklistInfo(blocklist);
          setHasRole(role);
        })
        .catch(error => {
          toast({
            title: "Failed to load blocklist information",
            description: error.message,
            variant: "destructive",
          });
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [connected, address, getBlocklistInfo, hasBlocklistRole, toast]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Blocklist Management</h1>
      
      {hasRole && <BlocklistCard className="mb-8" />}
      
      <Card>
        <CardHeader>
          <CardTitle>Blocked Accounts</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-8">
              <div className="w-8 h-8 border-4 border-t-black border-neutral-200 rounded-full animate-spin"></div>
            </div>
          ) : blocklistInfo.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-neutral-100 text-sm font-bold">
                    <th className="text-left py-3 px-4">Address</th>
                    <th className="text-right py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {blocklistInfo.map((item, index) => (
                    <tr key={index} className="border-t border-neutral-300">
                      <td className="py-3 px-4 text-accent-500">
                        <a 
                          href={`https://sepolia.etherscan.io/address/${item.address}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="hover:underline"
                        >
                          {formatAddress(item.address)}
                        </a>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className={`inline-block px-2 py-0.5 ${item.isBlocked ? 'bg-error' : 'bg-success'} text-white text-xs rounded`}>
                          {item.isBlocked ? 'Blocked' : 'Not Blocked'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-accent-500">
              No blocked accounts found. Connect your wallet to view the blocklist.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
