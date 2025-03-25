import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { ethers } from "ethers";
import { useToast } from "@/hooks/use-toast";

interface WalletContextType {
  provider: ethers.BrowserProvider | null;
  signer: ethers.JsonRpcSigner | null;
  address: string;
  network: string;
  chainId: number;
  balance: string;
  connected: boolean;
  connecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
}

const WalletContext = createContext<WalletContextType>({
  provider: null,
  signer: null,
  address: "",
  network: "",
  chainId: 0,
  balance: "0",
  connected: false,
  connecting: false,
  connect: async () => {},
  disconnect: () => {},
});

export const useWallet = () => useContext(WalletContext);

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider = ({ children }: WalletProviderProps) => {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const [address, setAddress] = useState<string>("");
  const [network, setNetwork] = useState<string>("");
  const [chainId, setChainId] = useState<number>(0);
  const [balance, setBalance] = useState<string>("0");
  const [connected, setConnected] = useState<boolean>(false);
  const [connecting, setConnecting] = useState<boolean>(false);
  const { toast } = useToast();

  // Try to restore connection on page load
  useEffect(() => {
    const tryReconnect = async () => {
      if (window.ethereum && localStorage.getItem("wallet-connected") === "true") {
        try {
          await connect();
        } catch (error) {
          console.error("Auto-reconnect failed:", error);
        }
      }
    };
    
    tryReconnect();
  }, []);

  // Handle network changes
  useEffect(() => {
    if (!window.ethereum) return;

    const handleChainChanged = () => {
      window.location.reload();
    };

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnect();
      } else if (connected) {
        setAddress(accounts[0]);
        updateBalance(accounts[0]);
      }
    };

    // Safely add event listeners with proper null checks
    const ethereum = window.ethereum;
    if (ethereum) {
      ethereum.on("chainChanged", handleChainChanged);
      ethereum.on("accountsChanged", handleAccountsChanged);
      
      return () => {
        if (ethereum) {
          ethereum.removeListener("chainChanged", handleChainChanged);
          ethereum.removeListener("accountsChanged", handleAccountsChanged);
        }
      };
    }
    
    return undefined;
  }, [connected]);

  const updateBalance = async (addr: string) => {
    if (!provider) return;
    
    try {
      const ethBalance = await provider.getBalance(addr);
      const formattedBalance = ethers.formatEther(ethBalance);
      setBalance(formattedBalance);
    } catch (error) {
      console.error("Failed to get balance:", error);
    }
  };

  const connect = async () => {
    if (!window.ethereum) {
      toast({
        title: "No Ethereum Wallet Detected",
        description: "Please install MetaMask or another Ethereum wallet extension",
        variant: "destructive",
      });
      return;
    }

    setConnecting(true);

    try {
      // Get custom RPC URL if set
      const customRpc = localStorage.getItem("usdx-custom-rpc");
      
      // Create provider
      let ethProvider: ethers.BrowserProvider;
      
      // Always default to BrowserProvider for setProvider compatibility
      if (!customRpc) {
        // Use MetaMask provider directly
        ethProvider = new ethers.BrowserProvider(window.ethereum);
      } else {
        // When using a custom RPC, we still set up BrowserProvider for the UI
        // but we'll use the custom RPC for specific contract calls
        console.log("Custom RPC detected, using it for specific operations only");
        localStorage.setItem("usdx-custom-rpc-url", customRpc);
        ethProvider = new ethers.BrowserProvider(window.ethereum);
      }
      
      const network = await ethProvider.getNetwork();
      setNetwork(network.name === "unknown" ? "Sepolia" : network.name);
      setChainId(Number(network.chainId));
      
      // Check if we're on Sepolia
      if (Number(network.chainId) !== 11155111) {
        try {
          // Try to switch to Sepolia
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: "0xaa36a7" }], // Sepolia chain ID in hex
          });
        } catch (switchError: any) {
          // If Sepolia is not added, add it
          if (switchError.code === 4902) {
            try {
              await window.ethereum.request({
                method: "wallet_addEthereumChain",
                params: [
                  {
                    chainId: "0xaa36a7",
                    chainName: "Sepolia Testnet",
                    nativeCurrency: {
                      name: "Sepolia ETH",
                      symbol: "ETH",
                      decimals: 18,
                    },
                    rpcUrls: ["https://sepolia.infura.io/v3/"],
                    blockExplorerUrls: ["https://sepolia.etherscan.io"],
                  },
                ],
              });
            } catch (addError) {
              console.error("Failed to add Sepolia network:", addError);
              toast({
                title: "Network Error",
                description: "Could not switch to Sepolia network. Please add it manually.",
                variant: "destructive",
              });
              setConnecting(false);
              return;
            }
          } else {
            console.error("Failed to switch to Sepolia network:", switchError);
            toast({
              title: "Network Error",
              description: "Could not switch to Sepolia network. Please try again.",
              variant: "destructive",
            });
            setConnecting(false);
            return;
          }
        }
        
        // Re-create provider after switching network
        ethProvider = new ethers.BrowserProvider(window.ethereum);
      }
      
      if (window.ethereum) {
        await window.ethereum.request({ method: "eth_requestAccounts" });
      }
      
      const ethSigner = await ethProvider.getSigner();
      const userAddress = await ethSigner.getAddress();
      
      setProvider(ethProvider);
      setSigner(ethSigner);
      setAddress(userAddress);
      setConnected(true);
      
      updateBalance(userAddress);
      
      // Save connection state
      localStorage.setItem("wallet-connected", "true");
      
      toast({
        title: "Wallet Connected",
        description: `Connected to ${userAddress.substring(0, 6)}...${userAddress.substring(userAddress.length - 4)}`,
      });
    } catch (error) {
      console.error("Connection error:", error);
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Failed to connect to wallet",
        variant: "destructive",
      });
    } finally {
      setConnecting(false);
    }
  };

  const disconnect = () => {
    setProvider(null);
    setSigner(null);
    setAddress("");
    setNetwork("");
    setChainId(0);
    setBalance("0");
    setConnected(false);
    
    // Clear saved connection state
    localStorage.removeItem("wallet-connected");
    
    toast({
      title: "Wallet Disconnected",
      description: "Your wallet has been disconnected",
    });
  };

  const value = {
    provider,
    signer,
    address,
    network,
    chainId,
    balance,
    connected,
    connecting,
    connect,
    disconnect,
  };

  return React.createElement(
    WalletContext.Provider,
    { value },
    children
  );
};
