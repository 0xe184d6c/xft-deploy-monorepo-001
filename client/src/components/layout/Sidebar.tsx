import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  ReceiptText, 
  UserCog, 
  Shield, 
  Settings,
  DollarSign
} from "lucide-react";

export default function Sidebar() {
  const [location] = useLocation();
  
  const isActive = (path: string) => {
    return location === path;
  };

  return (
    <aside className="w-64 bg-white border-r border-neutral-300 hidden md:block">
      <nav className="py-6">
        <div className="px-6 mb-6">
          <div className="flex items-center mb-1">
            <DollarSign className="w-6 h-6 mr-2" />
            <h2 className="font-bold">XFT Digital Dollar</h2>
          </div>
          <div className="text-sm text-accent-500">
            <span>USDX</span> • 
            <span className="truncate"> 0x421C...4995</span>
          </div>
        </div>
        
        <ul>
          <li>
            <Link href="/">
              <a className={`flex items-center px-6 py-3 ${isActive("/") ? "bg-neutral-100 border-l-4 border-black" : "hover:bg-neutral-100 transition-colors"}`}>
                <LayoutDashboard className="w-5 h-5 mr-2" />
                <span>Dashboard</span>
              </a>
            </Link>
          </li>
          <li>
            <Link href="/transactions">
              <a className={`flex items-center px-6 py-3 ${isActive("/transactions") ? "bg-neutral-100 border-l-4 border-black" : "hover:bg-neutral-100 transition-colors"}`}>
                <ReceiptText className="w-5 h-5 mr-2" />
                <span>Transactions</span>
              </a>
            </Link>
          </li>
          <li>
            <Link href="/roles">
              <a className={`flex items-center px-6 py-3 ${isActive("/roles") ? "bg-neutral-100 border-l-4 border-black" : "hover:bg-neutral-100 transition-colors"}`}>
                <UserCog className="w-5 h-5 mr-2" />
                <span>Role Management</span>
              </a>
            </Link>
          </li>
          <li>
            <Link href="/blocklist">
              <a className={`flex items-center px-6 py-3 ${isActive("/blocklist") ? "bg-neutral-100 border-l-4 border-black" : "hover:bg-neutral-100 transition-colors"}`}>
                <Shield className="w-5 h-5 mr-2" />
                <span>Blocklist</span>
              </a>
            </Link>
          </li>
          <li>
            <Link href="/settings">
              <a className={`flex items-center px-6 py-3 ${isActive("/settings") ? "bg-neutral-100 border-l-4 border-black" : "hover:bg-neutral-100 transition-colors"}`}>
                <Settings className="w-5 h-5 mr-2" />
                <span>Settings</span>
              </a>
            </Link>
          </li>
        </ul>
      </nav>
    </aside>
  );
}
