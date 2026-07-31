import Link from "next/link";
import { ContractCard } from "@/components/ContractCard";
import { ConnectWalletButton } from "@/components/ConnectWalletButton";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary-700">
            Stellar Crop Supply Chain
          </h1>
          <ConnectWalletButton />
        </div>
      </header>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Transparent Crop Supply Contracts on Stellar
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Every crop order is tracked on-chain with full transparency. Buyers
            can see exactly where their funds go and how their produce is
            delivered.
          </p>
        </div>

        <div className="mb-8">
          <Link
            href="/contracts"
            className="inline-block bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Browse Contracts
          </Link>
          <Link
            href="/create"
            className="inline-block ml-4 bg-white hover:bg-gray-50 text-primary-600 border border-primary-200 px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Create Contract
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white p-6 rounded-xl shadow-sm text-center">
            <div className="text-3xl font-bold text-primary-600 mb-2">100%</div>
            <p className="text-gray-600">Transparent — every order is on-chain</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm text-center">
            <div className="text-3xl font-bold text-primary-600 mb-2">Fair</div>
            <p className="text-gray-600">Direct agreements — more value for farmers</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm text-center">
            <div className="text-3xl font-bold text-primary-600 mb-2">Real-time</div>
            <p className="text-gray-600">Track orders from farm to delivery</p>
          </div>
        </div>

        <ContractCard
          contract={{
            id: "1",
            title: "Organic Wheat Contract",
            description: "Purchase agreement for 500 kg of organic wheat.",
            farmer: "GA...",
            fundedAmount: 450,
            targetAmount: 1000,
            orderCount: 24,
            deadline: Date.now() + 86400 * 7 * 1000,
            createdAt: Date.now() - 86400 * 3 * 1000,
            status: "active",
          }}
        />
      </section>

      <footer className="bg-white border-t py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-500">
          <p>Built on Stellar Soroban. Open source under MIT license.</p>
        </div>
      </footer>
    </main>
  );
}
