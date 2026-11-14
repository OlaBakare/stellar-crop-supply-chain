import { AmountUtils } from "@stellar-crop-supply/sdk";

export const WALLET_STORAGE_KEY = "stellar_wallet";
export const WALLET_CHANGE_EVENT = "stellar_wallet_change";

export type TransactionStatus = "idle" | "pending" | "success" | "failed";

export interface SignedOrderPayload {
  buyer: string;
  contractId: string;
  amountXlm: string;
  amountStroops: string;
  signedPayload?: string;
  provider: "freighter" | "xbull" | "local";
}

export function getStoredWallet(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return localStorage.getItem(WALLET_STORAGE_KEY);
}

function notifyWalletChange(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(WALLET_CHANGE_EVENT));
  }
}

export async function connectStellarWallet(): Promise<string | null> {
  if (typeof window === "undefined") {
    return null;
  }

  let address: string | null = null;

  if (window.xBull && window.xBull.isConnected) {
    address = await window.xBull.getAccount();
  } else if (window.freighter) {
    address = await window.freighter.getPublicKey();
  } else {
    address = "GCFXHS4GXL6BVUCXBWXGTITROWLVYXQKQLF4YH5O5JT3YZXCYPAFBJZB";
  }

  if (address) {
    localStorage.setItem(WALLET_STORAGE_KEY, address);
    notifyWalletChange();
    try {
      await fetch("/api/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
      });
    } catch {
      // Non-fatal if the local API connect notification fails.
    }
  }

  return address;
}

export function disconnectStellarWallet(): void {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.removeItem(WALLET_STORAGE_KEY);
  notifyWalletChange();
}

/**
 * Prepare and sign a Soroban `place_order` invocation payload with the active
 * Stellar wallet adapter (Freighter or xBull) before submitting to the RPC/API.
 */
export async function signOrderWithWallet(
  buyer: string,
  contractId: string,
  amountXlm: string
): Promise<SignedOrderPayload> {
  const amountStroops = AmountUtils.toStroops(amountXlm);
  const networkPassphrase =
    process.env.NEXT_PUBLIC_NETWORK_PASSPHRASE ??
    "Test SDF Network ; September 2015";

  if (typeof window !== "undefined") {
    if (window.freighter?.signTransaction) {
      const signed = await window.freighter.signTransaction(
        `place_order:${contractId}:${buyer}:${amountStroops}`,
        { networkPassphrase, accountToSign: buyer }
      );
      return {
        buyer,
        contractId,
        amountXlm,
        amountStroops,
        signedPayload: signed,
        provider: "freighter",
      };
    }

    if (window.xBull?.signTransaction) {
      const signed = await window.xBull.signTransaction(
        `place_order:${contractId}:${buyer}:${amountStroops}`
      );
      return {
        buyer,
        contractId,
        amountXlm,
        amountStroops,
        signedPayload: signed,
        provider: "xbull",
      };
    }
  }

  return {
    buyer,
    contractId,
    amountXlm,
    amountStroops,
    provider: "local",
  };
}
