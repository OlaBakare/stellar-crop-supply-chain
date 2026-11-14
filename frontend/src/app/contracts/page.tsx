"use client";
import { useState, useEffect } from "react";
import { CropContract } from "@/lib/types";
import { fetchContracts } from "@/lib/api";
import { ContractCard } from "@/components/ContractCard";
import { ConnectWalletButton } from "@/components/ConnectWalletButton";

export default function ContractsPage() {
  const [contracts, setContracts] = useState<CropContract[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContracts();
  }, []);

  async function loadContracts() {
    setLoading(true);
    try {
      const data = await fetchContracts();
      setContracts(data);
    } catch (err) {
      console.error("Failed to load contracts:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary-700">
            All Crop Contracts
          </h1>
          <ConnectWalletButton />
        </div>
      </header>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading contracts...</p>
          </div>
        ) : contracts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No contracts found.</p>
            <button
              onClick={() => (window.location.href = "/create")}
              className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-medium"
            >
              Create the first contract
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {contracts.map((contract) => (
              <ContractCard
                key={contract.id}
                contract={contract}
                onOrderPlaced={(updated) => {
                  setContracts((prev) =>
                    prev.map((item) =>
                      item.id === updated.id ? updated : item
                    )
                  );
                }}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
