import { Menu, X } from "lucide-react";
import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  ReceiptText, 
  UserCog, 
  Shield, 
  Settings,
  DollarSign,
  ShieldAlert
} from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useWallet } from "@/lib/wallet";
import { useContract } from "@/lib/contract";

interface MobileMenuProps {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}

export default function MobileMenu({ isOpen, onOpen, onClose }: MobileMenuProps) {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
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
  
  // Sync the open state with the parent's isOpen state
  useEffect(() => {
    setOpen(isOpen);
  }, [isOpen]);

  // Close the sheet when the location changes
  useEffect(() => {
    setOpen(false);
    onClose();
  }, [location, onClose]);

  const handleOpenChange = (open: boolean) => {
    setOpen(open);
    if (open) {
      onOpen();
    } else {
      onClose();
    }
  };

  const isActive = (path: string) => {
    return location === path;
  };

  return (
    <div className="md:hidden w-full bg-white border-b border-neutral-300 px-4 py-2">
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetTrigger asChild>
          <Button variant="ghost" className="p-0 hover:bg-transparent">
            <div className="flex items-center">
              <Menu className="w-5 h-5 mr-2" />
              <span>Menu</span>
            </div>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-[250px]">
          <div className="bg-white h-full flex flex-col">
            <div className="p-4 border-b border-neutral-300 flex justify-between items-center">
              <div className="flex items-center">
                <DollarSign className="w-5 h-5 mr-2" />
                <span className="font-bold">USDX Dashboard</span>
              </div>
              <Button variant="ghost" className="p-1 h-auto" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <nav className="flex-1 py-2">
              <ul>
                <li>
                  <Link href="/">
                    <a className={`flex items-center px-6 py-3 ${isActive("/") ? "bg-neutral-100 border-l-4 border-black" : ""}`}>
                      <LayoutDashboard className="w-5 h-5 mr-2" />
                      <span>Dashboard</span>
                    </a>
                  </Link>
                </li>
                <li>
                  <Link href="/transactions">
                    <a className={`flex items-center px-6 py-3 ${isActive("/transactions") ? "bg-neutral-100 border-l-4 border-black" : ""}`}>
                      <ReceiptText className="w-5 h-5 mr-2" />
                      <span>Transactions</span>
                    </a>
                  </Link>
                </li>
                <li>
                  <Link href="/roles">
                    <a className={`flex items-center px-6 py-3 ${isActive("/roles") ? "bg-neutral-100 border-l-4 border-black" : ""}`}>
                      <UserCog className="w-5 h-5 mr-2" />
                      <span>Role Management</span>
                    </a>
                  </Link>
                </li>
                <li>
                  <Link href="/blocklist">
                    <a className={`flex items-center px-6 py-3 ${isActive("/blocklist") ? "bg-neutral-100 border-l-4 border-black" : ""}`}>
                      <Shield className="w-5 h-5 mr-2" />
                      <span>Blocklist</span>
                    </a>
                  </Link>
                </li>
                <li>
                  <Link href="/settings">
                    <a className={`flex items-center px-6 py-3 ${isActive("/settings") ? "bg-neutral-100 border-l-4 border-black" : ""}`}>
                      <Settings className="w-5 h-5 mr-2" />
                      <span>Settings</span>
                    </a>
                  </Link>
                </li>
                
                {/* Admin Panel - Only visible to users with DEFAULT_ADMIN_ROLE */}
                {isAdmin && (
                  <li className="mt-4">
                    <Link href="/admin">
                      <a className={`flex items-center px-6 py-3 ${isActive("/admin") ? "bg-neutral-100 border-l-4 border-black" : "bg-black text-white"}`}>
                        <ShieldAlert className="w-5 h-5 mr-2" />
                        <span>Admin Panel</span>
                      </a>
                    </Link>
                  </li>
                )}
              </ul>
            </nav>
            
            <div className="p-4 border-t border-neutral-300 text-xs text-accent-500">
              <div>USDX • Sepolia Testnet</div>
              <div>Contract: 0x421C...4995</div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}