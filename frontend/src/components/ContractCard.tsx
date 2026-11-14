"use client";

import { useState, useEffect } from "react";
import { CropContract, Order } from "@/lib/types";
import { fetchContractOrders, placeOrder } from "@/lib/api";
import {
  connectStellarWallet,
  getStoredWallet,
  signOrderWithWallet,
  TransactionStatus,
  WALLET_CHANGE_EVENT,
} from "@/lib/wallet";
import { Card, CardContent, CardFooter } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface ContractCardProps {
  contract: CropContract;
  onOrderPlaced?: (updatedContract: CropContract, order: Order) => void;
}

export function ContractCard({ contract, onOrderPlaced }: ContractCardProps) {
  const [localContract, setLocalContract] = useState<CropContract>(contract);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isOrderFormOpen, setIsOrderFormOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [wallet, setWallet] = useState<string | null>(null);
  const [txStatus, setTxStatus] = useState<TransactionStatus>("idle");
  const [txError, setTxError] = useState<string | null>(null);
  const [lastOrderId, setLastOrderId] = useState<string | null>(null);

  useEffect(() => {
    setLocalContract(contract);
  }, [contract]);

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

  useEffect(() => {
    let active = true;
    fetchContractOrders(localContract.id)
      .then((fetched) => {
        if (active && Array.isArray(fetched) && fetched.length > 0) {
          setOrders(fetched);
        }
      })
      .catch(() => {
        // Keep local orders list when backend is not configured.
      });
    return () => {
      active = false;
    };
  }, [localContract.id]);

  const progress =
    localContract.targetAmount > 0
      ? (localContract.fundedAmount / localContract.targetAmount) * 100
      : 0;
  const remainingAmount = Math.max(
    0,
    localContract.targetAmount - localContract.fundedAmount
  );
  const daysLeft = Math.max(
    0,
    Math.ceil((localContract.deadline - Date.now()) / (1000 * 60 * 60 * 24))
  );

  const statusColor: Record<string, string> = {
    active: "bg-blue-100 text-blue-800",
    completed: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
  };

  const handleConnectAndOpen = async () => {
    if (!wallet) {
      const connected = await connectStellarWallet();
      setWallet(connected);
    }
    setIsOrderFormOpen(true);
    setTxStatus("idle");
    setTxError(null);
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setTxError(null);

    let activeWallet = wallet;
    if (!activeWallet) {
      activeWallet = await connectStellarWallet();
      setWallet(activeWallet);
    }
    if (!activeWallet) {
      setTxStatus("failed");
      setTxError("Please connect a Stellar wallet before placing an order.");
      return;
    }

    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount < 0.1) {
      setTxStatus("failed");
      setTxError("Minimum order amount is 0.1 XLM.");
      return;
    }
    if (remainingAmount > 0 && numericAmount > remainingAmount) {
      setTxStatus("failed");
      setTxError(
        `Order amount exceeds remaining contract target (${remainingAmount.toLocaleString()} XLM).`
      );
      return;
    }

    setTxStatus("pending");

    try {
      const signed = await signOrderWithWallet(
        activeWallet,
        localContract.id,
        amount
      );
      const result = await placeOrder(
        localContract.id,
        amount,
        activeWallet,
        signed.signedPayload
      );

      const newFunded = localContract.fundedAmount + numericAmount;
      const updatedContract: CropContract = {
        ...localContract,
        fundedAmount: newFunded,
        orderCount: localContract.orderCount + 1,
        status:
          newFunded >= localContract.targetAmount
            ? "completed"
            : localContract.status,
      };

      const newOrder: Order = {
        id: result.orderId,
        contractId: localContract.id,
        buyer: activeWallet,
        amount: numericAmount,
        orderedAt: Date.now(),
        status: "pending",
      };

      setLocalContract(updatedContract);
      setOrders((prev) => [newOrder, ...prev]);
      setLastOrderId(result.orderId);
      setTxStatus("success");
      setAmount("");

      if (onOrderPlaced) {
        onOrderPlaced(updatedContract, newOrder);
      }
    } catch (err) {
      setTxStatus("failed");
      setTxError(
        err instanceof Error ? err.message : "Failed to submit order transaction"
      );
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-xl font-semibold text-gray-900">
            {localContract.title}
          </h3>
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor[localContract.status]}`}
          >
            {localContract.status}
          </span>
        </div>

        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
          {localContract.description}
        </p>

        <div className="mb-4">
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-primary-600 h-3 rounded-full transition-all"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-sm text-gray-600 mt-1">
            <span>{localContract.fundedAmount.toLocaleString()} XLM funded</span>
            <span>{localContract.targetAmount.toLocaleString()} XLM goal</span>
          </div>
        </div>

        <div className="flex justify-between text-sm text-gray-500">
          <span>{localContract.orderCount} buyers</span>
          <span>
            {localContract.status === "active"
              ? `${daysLeft} days left`
              : "Ended"}
          </span>
        </div>

        {orders.length > 0 && (
          <div className="mt-4 pt-3 border-t border-gray-100">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
              Recent Orders ({orders.length})
            </h4>
            <ul className="space-y-1.5 max-h-32 overflow-y-auto text-xs">
              {orders.map((order) => (
                <li
                  key={order.id}
                  className="flex items-center justify-between bg-gray-50 px-2.5 py-1.5 rounded"
                >
                  <span className="font-mono text-gray-700">
                    #{order.id} ({order.buyer.slice(0, 4)}...
                    {order.buyer.slice(-4)})
                  </span>
                  <span className="font-medium text-primary-700">
                    {order.amount.toLocaleString()} XLM ({order.status})
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {isOrderFormOpen && (
          <form
            onSubmit={handleSubmitOrder}
            className="mt-4 pt-4 border-t border-gray-100 space-y-3"
          >
            <div className="flex items-center justify-between text-xs text-gray-600">
              <span>
                Wallet:{" "}
                {wallet
                  ? `${wallet.slice(0, 6)}...${wallet.slice(-4)}`
                  : "Not connected"}
              </span>
              <span>Remaining: {remainingAmount.toLocaleString()} XLM</span>
            </div>

            <Input
              type="number"
              min="0.1"
              step="0.1"
              max={remainingAmount > 0 ? String(remainingAmount) : undefined}
              placeholder="Enter order amount in XLM (min 0.1)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={txStatus === "pending"}
              required
            />

            {txStatus === "pending" && (
              <div
                role="status"
                className="p-2.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-medium"
              >
                Signing &amp; submitting Soroban order transaction...
              </div>
            )}

            {txStatus === "success" && (
              <div
                role="status"
                className="p-2.5 rounded-lg bg-green-50 text-green-700 text-xs font-medium"
              >
                Order #{lastOrderId} confirmed on-chain!
              </div>
            )}

            {txStatus === "failed" && txError && (
              <div
                role="alert"
                className="p-2.5 rounded-lg bg-red-50 text-red-700 text-xs font-medium"
              >
                {txError}
              </div>
            )}

            <div className="flex gap-2">
              <Button
                type="submit"
                size="sm"
                className="flex-1"
                disabled={
                  txStatus === "pending" || localContract.status !== "active"
                }
              >
                {txStatus === "pending" ? "Submitting..." : "Confirm Order"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsOrderFormOpen(false)}
                disabled={txStatus === "pending"}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}
      </CardContent>

      <CardFooter>
        {!isOrderFormOpen ? (
          <Button
            className="w-full"
            size="md"
            disabled={localContract.status !== "active"}
            onClick={handleConnectAndOpen}
          >
            {localContract.status === "active"
              ? wallet
                ? "Place Order"
                : "Connect Wallet & Place Order"
              : "Contract Closed"}
          </Button>
        ) : (
          <p className="w-full text-center text-xs text-gray-500">
            Funds are escrowed on Stellar Soroban until delivery confirmation.
          </p>
        )}
      </CardFooter>
    </Card>
  );
}
