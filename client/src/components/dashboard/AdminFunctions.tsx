import { useEffect, useState } from "react";
import MintCard from "./MintCard";
import BurnCard from "./BurnCard";
import BlocklistCard from "./BlocklistCard";
import PauseCard from "./PauseCard";
import RoleManagementCard from "./RoleManagementCard";
import RewardMultiplierCard from "./RewardMultiplierCard";
import { useWallet } from "@/lib/wallet";
import { useContract } from "@/lib/contract";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RoleInfo, BlocklistInfo } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { formatAddress } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Copy, CheckCircle2, AlertCircle } from "lucide-react";

export default function AdminFunctions() {
  const { connected, address } = useWallet();
  const { 
    hasMinterRole, 
    hasBurnerRole, 
    hasBlocklistRole, 
    hasPauseRole, 
    hasAdminRole,
    hasOracleRole,
    getRoleInfo,
    getBlocklistInfo,
    loadContractData,
    isPaused
  } = useContract();
  
  const [roles, setRoles] = useState({
    minter: false,
    burner: false,
    blocklist: false,
    pause: false,
    admin: false,
    oracle: false
  });
  
  const [roleAddresses, setRoleAddresses] = useState<RoleInfo[]>([]);
  const [blocklistAddresses, setBlocklistAddresses] = useState<BlocklistInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSection, setShowSection] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  
  const loadRoleData = async () => {
    if (!connected) return;
    
    setIsLoading(true);
    try {
      // Get user roles
      const [minter, burner, blocklist, pause, admin, oracle] = await Promise.all([
        hasMinterRole(),
        hasBurnerRole(),
        hasBlocklistRole(),
        hasPauseRole(),
        hasAdminRole(),
        hasOracleRole()
      ]);
      
      const newRoles = { minter, burner, blocklist, pause, admin, oracle };
      setRoles(newRoles);
      
      // Show section if user has any role or is owner
      setShowSection(Object.values(newRoles).some(role => role));
      
      // Get role assignments and blocklist info
      if (newRoles.admin || newRoles.blocklist) {
        const [roleInfo, blocklistInfo] = await Promise.all([
          getRoleInfo(),
          getBlocklistInfo()
        ]);
        
        setRoleAddresses(roleInfo);
        setBlocklistAddresses(blocklistInfo);
      }
    } catch (error) {
      console.error("Failed to load role data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRoleData();
  }, [connected, address]);

  const refreshData = async () => {
    await loadRoleData();
    await loadContractData();
  };

  if (!showSection) return null;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">Admin Functions</h2>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={refreshData}
          className="text-xs"
          disabled={isLoading}
        >
          Refresh Data
        </Button>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 border-4 border-t-black border-neutral-200 rounded-full animate-spin"></div>
        </div>
      ) : (
        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-5 mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="token">Token Operations</TabsTrigger>
            <TabsTrigger value="roles">Role Management</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="setup">Configuration</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            <div className="bg-white border border-neutral-300 rounded-md p-4">
              <h3 className="font-medium mb-3">Contract Status</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm mb-1">Paused:</p>
                  <Badge variant={isPaused ? "destructive" : "outline"}>
                    {isPaused ? "Yes" : "No"}
                  </Badge>
                </div>
                
                <div>
                  <p className="text-sm mb-1">Your Roles:</p>
                  <div className="flex flex-wrap gap-1">
                    {roles.admin && <Badge>Admin</Badge>}
                    {roles.minter && <Badge>Minter</Badge>}
                    {roles.burner && <Badge>Burner</Badge>}
                    {roles.blocklist && <Badge>Blocklist</Badge>}
                    {roles.pause && <Badge>Pause</Badge>}
                    {roles.oracle && <Badge>Oracle</Badge>}
                    {!Object.values(roles).some(r => r) && <Badge variant="outline">None</Badge>}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white border border-neutral-300 rounded-md p-4">
              <h3 className="font-medium mb-3">Role Assignments</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-300">
                      <th className="text-left pb-2 pr-2">Role</th>
                      <th className="text-left pb-2">Addresses</th>
                    </tr>
                  </thead>
                  <tbody>
                    {["ADMIN", "MINTER", "BURNER", "BLOCKLIST", "ORACLE", "PAUSE", "UPGRADE"].map(role => {
                      const addresses = roleAddresses
                        .filter(r => r.roleName === `${role}_ROLE`)
                        .filter(r => r.granted)
                        .map(r => r.address);
                        
                      return (
                        <tr key={role} className="border-b border-neutral-200">
                          <td className="py-2 pr-2 align-top">{role}</td>
                          <td className="py-2">
                            <div className="flex flex-col gap-1">
                              {addresses.length > 0 ? (
                                addresses.map((addr, idx) => (
                                  <div key={idx} className="flex items-center">
                                    <span className="font-mono">{formatAddress(addr)}</span>
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            className="h-6 w-6 p-0 ml-1"
                                            onClick={() => copyToClipboard(addr)}
                                          >
                                            <Copy className="h-3 w-3" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>Copy address</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  </div>
                                ))
                              ) : (
                                <span className="text-neutral-500">None assigned</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="bg-white border border-neutral-300 rounded-md p-4">
              <h3 className="font-medium mb-3">Blocklist</h3>
              {blocklistAddresses.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-neutral-300">
                        <th className="text-left pb-2">Address</th>
                        <th className="text-left pb-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {blocklistAddresses.map((item, idx) => (
                        <tr key={idx} className="border-b border-neutral-200">
                          <td className="py-2 font-mono">
                            {formatAddress(item.address)}
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-6 w-6 p-0 ml-1"
                                    onClick={() => copyToClipboard(item.address)}
                                  >
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Copy address</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </td>
                          <td className="py-2">
                            {item.isBlocked ? (
                              <div className="flex items-center text-red-600">
                                <AlertCircle className="h-4 w-4 mr-1" /> Blocked
                              </div>
                            ) : (
                              <div className="flex items-center text-green-600">
                                <CheckCircle2 className="h-4 w-4 mr-1" /> Active
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-neutral-500">No addresses currently blocklisted</p>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="token">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {roles.minter && <MintCard className="h-full" />}
              {roles.burner && <BurnCard className="h-full" />}
              <RewardMultiplierCard className="h-full" />
            </div>
          </TabsContent>
          
          <TabsContent value="roles">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {roles.admin && <RoleManagementCard className="h-full" />}
              
              <div className="bg-white border border-neutral-300 rounded p-4">
                <h3 className="text-sm font-bold uppercase mb-3">Current Role Assignments</h3>
                <div className="max-h-[350px] overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-neutral-300">
                        <th className="text-left pb-2">Role</th>
                        <th className="text-left pb-2">Address</th>
                      </tr>
                    </thead>
                    <tbody>
                      {roleAddresses
                        .filter(r => r.granted)
                        .map((item, idx) => (
                          <tr key={idx} className="border-b border-neutral-200">
                            <td className="py-2">{item.roleName.replace('_ROLE', '')}</td>
                            <td className="py-2 font-mono">
                              {formatAddress(item.address)}
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-6 w-6 p-0 ml-1"
                                onClick={() => copyToClipboard(item.address)}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </td>
                          </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="security">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {roles.pause && <PauseCard className="h-full" />}
              {roles.blocklist && <BlocklistCard className="h-full" />}
            </div>
          </TabsContent>
          
          <TabsContent value="setup">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <RewardMultiplierCard className="h-full" />
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
