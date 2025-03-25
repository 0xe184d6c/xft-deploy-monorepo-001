import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { useState, useEffect } from "react";
import Dashboard from "@/pages/Dashboard";
import Transactions from "@/pages/Transactions";
import RoleManagement from "@/pages/RoleManagement";
import Blocklist from "@/pages/Blocklist";
import Settings from "@/pages/Settings";
import Admin from "@/pages/Admin";
import NotFound from "@/pages/not-found";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import MobileMenu from "@/components/layout/MobileMenu";
import Footer from "@/components/layout/Footer";
import { WalletProvider } from "@/lib/wallet";
import { ContractProvider } from "@/lib/contract";
import TransactionStatusModal from "@/components/modals/TransactionStatusModal";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/transactions" component={Transactions} />
      <Route path="/roles" component={RoleManagement} />
      <Route path="/blocklist" component={Blocklist} />
      <Route path="/settings" component={Settings} />
      <Route path="/admin" component={Admin} />
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Close sidebar when window resizes to desktop view
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) { // md breakpoint
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <WalletProvider>
        <ContractProvider>
          <div className="min-h-screen flex flex-col">
            <Header />
            <div className="flex flex-1">
              <Sidebar />
              <MobileMenu 
                isOpen={isSidebarOpen} 
                onClose={() => setIsSidebarOpen(false)}
                onOpen={() => setIsSidebarOpen(true)}
              />
              <main className="flex-1 p-6 overflow-auto">
                <Router />
              </main>
            </div>
            <Footer />
          </div>
          <TransactionStatusModal />
          <Toaster />
        </ContractProvider>
      </WalletProvider>
    </QueryClientProvider>
  );
}

export default App;
