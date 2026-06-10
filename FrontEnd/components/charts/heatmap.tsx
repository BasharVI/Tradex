import { cn } from "@/lib/utils";
import { formatPct } from "@/lib/format";

type HeatItem = {
  symbol: string;
  sector: string;
  change: number;
  weight: number;
};

export function Heatmap({ items, className }: { items: HeatItem[]; className?: string }) {
  return (
    <div className={cn("grid grid-cols-2 gap-2 md:grid-cols-4", className)}>
      {items.map((item) => {
        const positive = item.change >= 0;
        return (
          <div
            key={item.symbol}
            className={cn(
              "flex min-h-20 flex-col justify-between rounded-md border p-3",
              positive
                ? "border-success/25 bg-success/10 text-success"
                : "border-destructive/25 bg-destructive/10 text-destructive",
            )}
            style={{ gridColumn: item.weight >= 18 ? "span 2" : undefined }}
          >
            <div>
              <div className="font-semibold">{item.symbol}</div>
              <div className="text-xs opacity-75">{item.sector}</div>
            </div>
            <div className="text-right text-lg font-semibold numeric">{formatPct(item.change)}</div>
          </div>
        );
      })}
    </div>
  );
}
