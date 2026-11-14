"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import {
  connectStellarWallet,
  disconnectStellarWallet,
  getStoredWallet,
  WALLET_CHANGE_EVENT,
} from "@/lib/wallet";

export function ConnectWalletButton() {
  const [wallet, setWallet] = useState<string | null>(null);

  useEffect(() => {
    setWallet(getStoredWallet());

    const handleWalletChange = () => {
      setWallet(getStoredWallet());
    };

    window.addEventListener(WALLET_CHANGE_EVENT, handleWalletChange);
    return () => {
      window.removeEventListener(WALLET_CHANGE_EVENT, handleWalletChange);
    };
  }, []);

  const connectWallet = async () => {
    try {
      const address = await connectStellarWallet();
      if (address) {
        setWallet(address);
      }
    } catch (err) {
      console.error("Failed to connect wallet:", err);
    }
  };

  const disconnectWallet = () => {
    disconnectStellarWallet();
    setWallet(null);
  };

  if (wallet) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-600">
          {wallet.slice(0, 6)}...{wallet.slice(-4)}
        </span>
        <Button variant="outline" size="sm" onClick={disconnectWallet}>
          Disconnect
        </Button>
      </div>
    );
  }

  return <Button size="sm" onClick={connectWallet}>Connect Wallet</Button>;
}

declare global {
  interface Window {
    xBull?: {
      isConnected: boolean;
      getAccount: () => Promise<string>;
      signTransaction?: (xdr: string) => Promise<string>;
    };
    freighter?: {
      getPublicKey: () => Promise<string>;
      signTransaction?: (
        xdr: string,
        opts?: { networkPassphrase?: string; accountToSign?: string }
      ) => Promise<string>;
    };
  }
}
