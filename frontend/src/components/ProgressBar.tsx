import { clsx } from "clsx";

export interface ProgressBarProps {
  funded: number;
  target: number;
  label?: string;
  showAmounts?: boolean;
  unit?: string;
  className?: string;
}

export function getProgressColorClass(percentage: number): string {
  if (percentage < 25) {
    return "bg-red-500";
  }
  if (percentage < 50) {
    return "bg-yellow-500";
  }
  return "bg-green-500";
}

export function ProgressBar({
  funded,
  target,
  label,
  showAmounts = true,
  unit = "XLM",
  className,
}: ProgressBarProps) {
  const safeTarget = target > 0 ? target : 0;
  const safeFunded = Math.max(0, funded);
  const rawPercentage = safeTarget > 0 ? (safeFunded / safeTarget) * 100 : 0;
  const clampedPercentage = Math.min(Math.max(rawPercentage, 0), 100);
  const displayPercentage = Math.round(rawPercentage * 10) / 10;
  const barColorClass = getProgressColorClass(rawPercentage);
  const ariaLabel =
    label ??
    `Contract funding progress: ${displayPercentage}% (${safeFunded.toLocaleString()} of ${safeTarget.toLocaleString()} ${unit})`;

  return (
    <div className={clsx("w-full", className)}>
      <div className="mb-1 flex items-center justify-between text-xs font-medium text-gray-700">
        <span>Funding Progress</span>
        <span>{displayPercentage}%</span>
      </div>
      <div
        role="progressbar"
        aria-label={ariaLabel}
        aria-valuenow={Math.round(clampedPercentage)}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-3 w-full overflow-hidden rounded-full bg-gray-200"
      >
        <div
          className={clsx("h-3 rounded-full transition-all", barColorClass)}
          style={{ width: `${clampedPercentage}%` }}
        />
      </div>
      {showAmounts && (
        <div className="mt-1 flex justify-between text-sm text-gray-600">
          <span>
            {safeFunded.toLocaleString()} {unit} funded
          </span>
          <span>
            {safeTarget.toLocaleString()} {unit} goal
          </span>
        </div>
      )}
    </div>
  );
}
