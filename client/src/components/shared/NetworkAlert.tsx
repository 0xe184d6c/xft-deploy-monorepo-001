import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Info, X } from "lucide-react";
import { useWallet } from "@/lib/wallet";

export default function NetworkAlert() {
  const { connected, network } = useWallet();
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed || !connected) return null;

  return (
    <div className="mb-6 bg-neutral-200 border border-neutral-300 rounded px-4 py-3 flex justify-between items-center">
      <div className="flex items-center">
        <Info className="w-5 h-5 mr-2" />
        <span>You are connected to <strong>Sepolia Test Network</strong></span>
      </div>
      <Button 
        variant="link" 
        className="text-sm underline" 
        onClick={() => setIsDismissed(true)}
      >
        Dismiss
      </Button>
    </div>
  );
}
