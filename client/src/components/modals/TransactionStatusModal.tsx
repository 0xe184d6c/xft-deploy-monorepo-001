import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useContract } from "@/lib/contract";
import { Check, AlertCircle, X, Loader } from "lucide-react";

export default function TransactionStatusModal() {
  const { 
    transactionModalState: { 
      isOpen, 
      status, 
      errorMessage, 
      transactionHash 
    }, 
    hideTransactionModal 
  } = useContract();

  // Generate Etherscan URL for transactions
  const getEtherscanUrl = () => {
    if (!transactionHash) return "#";
    return `https://sepolia.etherscan.io/tx/${transactionHash}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && hideTransactionModal()}>
      <DialogContent className="bg-white rounded-lg shadow-lg w-full max-w-md">
        <div className="p-6 text-center">
          {status === "pending" && (
            <div className="mb-4">
              <div className="w-16 h-16 border-4 border-t-black border-neutral-200 rounded-full animate-spin mx-auto mb-4"></div>
              <h3 className="text-lg font-bold mb-2">Transaction Pending</h3>
              <p className="text-sm text-accent-500">Please wait while your transaction is being processed...</p>
            </div>
          )}
          
          {status === "success" && (
            <div className="mb-4">
              <div className="w-16 h-16 rounded-full bg-success flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-bold mb-2">Transaction Successful</h3>
              <p className="text-sm text-accent-500">Your transaction has been confirmed!</p>
              {transactionHash && (
                <div className="mt-2 text-sm">
                  <a 
                    href={getEtherscanUrl()} 
                    className="text-accent-500 hover:underline" 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    View on Etherscan
                  </a>
                </div>
              )}
            </div>
          )}
          
          {status === "error" && (
            <div className="mb-4">
              <div className="w-16 h-16 rounded-full bg-error flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-bold mb-2">Transaction Failed</h3>
              <p className="text-sm text-accent-500">
                {errorMessage || "Something went wrong with your transaction."}
              </p>
            </div>
          )}
          
          <Button
            className="mt-4 px-4 py-2 bg-black text-white text-sm rounded hover:bg-accent-700 transition-colors"
            onClick={hideTransactionModal}
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
