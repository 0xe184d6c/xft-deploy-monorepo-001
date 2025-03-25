import { useEffect, useState } from "react";
import MintCard from "./MintCard";
import BurnCard from "./BurnCard";
import BlocklistCard from "./BlocklistCard";
import PauseCard from "./PauseCard";
import RoleManagementCard from "./RoleManagementCard";
import { useWallet } from "@/lib/wallet";
import { useContract } from "@/lib/contract";

export default function AdminFunctions() {
  const { connected } = useWallet();
  const { 
    hasMinterRole, 
    hasBurnerRole, 
    hasBlocklistRole, 
    hasPauseRole, 
    hasAdminRole 
  } = useContract();
  
  const [roles, setRoles] = useState({
    minter: false,
    burner: false,
    blocklist: false,
    pause: false,
    admin: false
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [showSection, setShowSection] = useState(false);

  useEffect(() => {
    if (connected) {
      setIsLoading(true);
      
      Promise.all([
        hasMinterRole(),
        hasBurnerRole(),
        hasBlocklistRole(),
        hasPauseRole(),
        hasAdminRole()
      ])
        .then(([minter, burner, blocklist, pause, admin]) => {
          const newRoles = { minter, burner, blocklist, pause, admin };
          setRoles(newRoles);
          
          // Show section if user has any role
          setShowSection(Object.values(newRoles).some(role => role));
        })
        .catch(console.error)
        .finally(() => setIsLoading(false));
    } else {
      setShowSection(false);
    }
  }, [connected, hasMinterRole, hasBurnerRole, hasBlocklistRole, hasPauseRole, hasAdminRole]);

  if (!showSection) return null;

  return (
    <div className="mb-8">
      <h2 className="text-lg font-bold mb-4">Admin Functions</h2>
      
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 border-4 border-t-black border-neutral-200 rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {roles.minter && <MintCard />}
          {roles.burner && <BurnCard />}
          {roles.blocklist && <BlocklistCard />}
          {roles.pause && <PauseCard />}
          {roles.admin && <RoleManagementCard />}
        </div>
      )}
    </div>
  );
}
