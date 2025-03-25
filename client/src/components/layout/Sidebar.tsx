import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  ReceiptText, 
  UserCog, 
  Shield, 
  Settings,
  ShieldAlert
} from "lucide-react";
import { useWallet } from "@/lib/wallet";
import { useContract } from "@/lib/contract";
import { useEffect, useState } from "react";

export default function Sidebar() {
  const [location] = useLocation();
  const { address, connected } = useWallet();
  const { hasAdminRole } = useContract();
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Check if user has admin role
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (connected && address) {
        try {
          const adminStatus = await hasAdminRole(address);
          setIsAdmin(adminStatus);
        } catch (error) {
          console.error("Error checking admin status:", error);
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
    };

    checkAdminStatus();
  }, [connected, address, hasAdminRole]);
  
  const isActive = (path: string) => {
    return location === path;
  };

  return (
    <aside className="w-64 bg-white border-r border-neutral-300 hidden md:block">
      <nav className="py-6">
        <div className="px-6 mb-6">
          <div className="flex items-center mb-1">
            <h2 className="font-bold">XFT Digital Dollar</h2>
          </div>
          <div className="text-sm text-accent-500">
            <span>USDX</span> • 
            <span className="truncate"> 0x421C...4995</span>
          </div>
        </div>
        
        <ul>
          <li>
            <Link href="/" className={`flex items-center px-6 py-3 ${isActive("/") ? "bg-neutral-100 border-l-4 border-black" : "hover:bg-neutral-100 transition-colors"}`}>
                <LayoutDashboard className="w-5 h-5 mr-2" />
                <span>Dashboard</span>
            </Link>
          </li>
          <li>
            <Link href="/transactions" className={`flex items-center px-6 py-3 ${isActive("/transactions") ? "bg-neutral-100 border-l-4 border-black" : "hover:bg-neutral-100 transition-colors"}`}>
                <ReceiptText className="w-5 h-5 mr-2" />
                <span>Transactions</span>
            </Link>
          </li>
          <li>
            <Link href="/roles" className={`flex items-center px-6 py-3 ${isActive("/roles") ? "bg-neutral-100 border-l-4 border-black" : "hover:bg-neutral-100 transition-colors"}`}>
                <UserCog className="w-5 h-5 mr-2" />
                <span>Role Management</span>
            </Link>
          </li>
          <li>
            <Link href="/blocklist" className={`flex items-center px-6 py-3 ${isActive("/blocklist") ? "bg-neutral-100 border-l-4 border-black" : "hover:bg-neutral-100 transition-colors"}`}>
                <Shield className="w-5 h-5 mr-2" />
                <span>Blocklist</span>
            </Link>
          </li>
          <li>
            <Link href="/settings" className={`flex items-center px-6 py-3 ${isActive("/settings") ? "bg-neutral-100 border-l-4 border-black" : "hover:bg-neutral-100 transition-colors"}`}>
                <Settings className="w-5 h-5 mr-2" />
                <span>Settings</span>
            </Link>
          </li>
          
          {/* Admin Panel - Only visible to users with DEFAULT_ADMIN_ROLE */}
          {isAdmin && (
            <li className="mt-4">
              <Link href="/admin" className={`flex items-center px-6 py-3 ${isActive("/admin") ? "bg-neutral-100 border-l-4 border-black" : "bg-black text-white hover:bg-neutral-800 transition-colors"}`}>
                  <ShieldAlert className="w-5 h-5 mr-2" />
                  <span>Admin Panel</span>
              </Link>
            </li>
          )}
        </ul>
      </nav>
    </aside>
  );
}
