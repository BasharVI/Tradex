import { Plus, Search, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatINR, formatPct } from "@/lib/format";
import { watchlist } from "@/lib/market-data";
import { cn } from "@/lib/utils";

export function WatchlistPanel({ compact = false }: { compact?: boolean }) {
  return (
    <aside className="rounded-lg border border-border bg-card shadow-subtle">
      <div className="border-b border-border p-3">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold">Watchlist</h2>
            <p className="text-xs text-muted-foreground">NSE cash watch</p>
          </div>
          <Button variant="outline" size="icon" aria-label="Add watchlist item">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search symbol" aria-label="Search watchlist" />
        </div>
      </div>
      <div className={cn("data-scroll divide-y divide-border overflow-auto", compact ? "max-h-[360px]" : "max-h-[720px]")}>
        {watchlist.map((item) => {
          const positive = item.change >= 0;
          return (
            <button key={item.symbol} className="grid w-full grid-cols-[1fr_auto_auto] items-center gap-3 px-3 py-3 text-left transition-colors hover:bg-muted/55">
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold">{item.symbol}</span>
                <span className="block truncate text-xs text-muted-foreground">{item.name}</span>
              </span>
              <span className="text-right">
                <span className="block text-sm font-semibold numeric">{formatINR(item.price)}</span>
                <span className="block text-xs text-muted-foreground">{item.volume}</span>
              </span>
              <Badge variant={positive ? "success" : "danger"}>{formatPct(item.change)}</Badge>
            </button>
          );
        })}
      </div>
      <div className="flex items-center justify-between border-t border-border px-3 py-2 text-xs text-muted-foreground">
        <span>7 instruments</span>
        <Button variant="ghost" size="sm" className="h-7 px-2">
          <X className="h-3.5 w-3.5" />
          Clear
        </Button>
      </div>
    </aside>
  );
}
