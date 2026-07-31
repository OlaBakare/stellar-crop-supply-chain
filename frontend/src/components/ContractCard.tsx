import { CropContract } from "@/lib/types";
import { Card, CardContent, CardFooter } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface ContractCardProps {
  contract: CropContract;
}

export function ContractCard({ contract }: ContractCardProps) {
  const progress = (contract.fundedAmount / contract.targetAmount) * 100;
  const daysLeft = Math.max(
    0,
    Math.ceil((contract.deadline - Date.now()) / (1000 * 60 * 60 * 24))
  );

  const statusColor: Record<string, string> = {
    active: "bg-blue-100 text-blue-800",
    completed: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-xl font-semibold text-gray-900">
            {contract.title}
          </h3>
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor[contract.status]}`}
          >
            {contract.status}
          </span>
        </div>

        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
          {contract.description}
        </p>

        <div className="mb-4">
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-primary-600 h-3 rounded-full transition-all"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-sm text-gray-600 mt-1">
            <span>{contract.fundedAmount.toLocaleString()} XLM funded</span>
            <span>{contract.targetAmount.toLocaleString()} XLM goal</span>
          </div>
        </div>

        <div className="flex justify-between text-sm text-gray-500">
          <span>{contract.orderCount} buyers</span>
          <span>
            {contract.status === "active"
              ? `${daysLeft} days left`
              : "Ended"}
          </span>
        </div>
      </CardContent>

      <CardFooter>
        <Button className="w-full" size="md">
          Place Order
        </Button>
      </CardFooter>
    </Card>
  );
}
