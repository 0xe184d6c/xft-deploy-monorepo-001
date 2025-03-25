import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import RoleManagementCard from "@/components/dashboard/RoleManagementCard";
import { useWallet } from "@/lib/wallet";
import { useContract } from "@/lib/contract";
import { useToast } from "@/hooks/use-toast";
import { formatAddress } from "@/lib/utils";
import { RoleInfo } from "@/lib/types";

export default function RoleManagement() {
  const { connected, address } = useWallet();
  const { getRoleInfo, hasAdminRole } = useContract();
  const { toast } = useToast();
  const [roleInfo, setRoleInfo] = useState<RoleInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (connected) {
      setIsLoading(true);
      
      Promise.all([
        getRoleInfo(),
        hasAdminRole(address)
      ])
        .then(([roles, admin]) => {
          setRoleInfo(roles);
          setIsAdmin(admin);
        })
        .catch(error => {
          toast({
            title: "Failed to load role information",
            description: error.message,
            variant: "destructive",
          });
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [connected, address, getRoleInfo, hasAdminRole, toast]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Role Management</h1>
      
      {isAdmin && <RoleManagementCard className="mb-8" />}
      
      <Card>
        <CardHeader>
          <CardTitle>Current Role Assignments</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-8">
              <div className="w-8 h-8 border-4 border-t-black border-neutral-200 rounded-full animate-spin"></div>
            </div>
          ) : roleInfo.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-neutral-100 text-sm font-bold">
                    <th className="text-left py-3 px-4">Role</th>
                    <th className="text-left py-3 px-4">Address</th>
                    <th className="text-right py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {roleInfo.map((role, index) => (
                    <tr key={index} className="border-t border-neutral-300">
                      <td className="py-3 px-4">{role.roleName}</td>
                      <td className="py-3 px-4 text-accent-500">
                        <a 
                          href={`https://sepolia.etherscan.io/address/${role.address}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="hover:underline"
                        >
                          {formatAddress(role.address)}
                        </a>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className={`inline-block px-2 py-0.5 ${role.granted ? 'bg-success' : 'bg-accent-500'} text-white text-xs rounded`}>
                          {role.granted ? 'Granted' : 'Not Granted'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-accent-500">
              No role information available. Connect your wallet to view role assignments.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
