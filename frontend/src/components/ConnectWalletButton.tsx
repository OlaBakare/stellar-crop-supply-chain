"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";

export function ConnectWalletButton() {
  const [wallet, setWallet] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("stellar_wallet");
    if (stored) {
      setWallet(stored);
    }
  }, []);

  const connectWallet = async () => {
    try {
      if (typeof window === "undefined") return;

      if (window.xBull && window.xBull.isConnected) {
        const address = await window.xBull.getAccount();
        setWallet(address);
        localStorage.setItem("stellar_wallet", address);
        return;
      }

      if (window.freighter) {
        const address = await window.freighter.getPublicKey();
        setWallet(address);
        localStorage.setItem("stellar_wallet", address);
        return;
      }

      setWallet("GA...");
      localStorage.setItem("stellar_wallet", "GA...");
    } catch (err) {
      console.error("Failed to connect wallet:", err);
    }
  };

  const disconnectWallet = () => {
    setWallet(null);
    localStorage.removeItem("stellar_wallet");
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
    };
    freighter?: {
      getPublicKey: () => Promise<string>;
    };
  }
}
