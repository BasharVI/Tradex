import { CandlestickChart, Maximize2, MoveHorizontal, Settings2 } from "lucide-react";
import { Sparkline } from "@/components/charts/sparkline";
import { OrderEntry } from "@/components/sections/order-entry";
import { WatchlistPanel } from "@/components/sections/watchlist-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { formatINR, formatPct } from "@/lib/format";
import { holdings, performance, recentTrades } from "@/lib/market-data";

export default function TerminalPage() {
  return (
    <div className="grid gap-4 xl:grid-cols-[300px_minmax(0,1fr)_340px]">
      <WatchlistPanel />

      <section className="grid min-w-0 gap-4">
        <Card>
          <CardHeader className="items-center">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="text-lg">RELIANCE</CardTitle>
                <Badge variant="outline">NSE</Badge>
                <Badge variant="success">{formatPct(0.84)}</Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Reliance Industries · Energy · Lot 1</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-right">
                <div className="text-2xl font-semibold numeric">{formatINR(2864)}</div>
                <div className="text-xs text-success numeric">+₹23.85 today</div>
              </div>
              <Button variant="ghost" size="icon" aria-label="Chart settings">
                <Settings2 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" aria-label="Expand chart">
                <Maximize2 className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="market-grid relative min-h-[380px] overflow-hidden rounded-md border border-border bg-background p-4">
              <div className="absolute left-4 top-4 flex gap-2">
                {["1D", "5D", "1M", "6M", "1Y"].map((range) => (
                  <Button key={range} variant={range === "1D" ? "secondary" : "outline"} size="sm" className="h-7 px-2">
                    {range}
                  </Button>
                ))}
              </div>
              <Sparkline data={[71, 73, 70, 76, 74, 79, 81, 78, 83, 86, 84, 90, 88, 94]} className="mt-20 h-64" stroke="hsl(var(--success))" />
              <div className="absolute bottom-4 left-4 right-4 grid grid-cols-4 gap-2 text-xs">
                {[
                  ["Open", "₹2,838"],
                  ["High", "₹2,879"],
                  ["Low", "₹2,821"],
                  ["Volume", "28.4L"],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-md bg-card/90 p-2 shadow-subtle">
                    <div className="text-muted-foreground">{label}</div>
                    <div className="font-semibold numeric">{value}</div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>Positions</CardTitle>
            </CardHeader>
            <div className="data-scroll overflow-x-auto">
              <Table>
                <THead>
                  <TR>
                    <TH>Symbol</TH>
                    <TH className="text-right">Qty</TH>
                    <TH className="text-right">Avg</TH>
                    <TH className="text-right">LTP</TH>
                    <TH className="text-right">P&L</TH>
                  </TR>
                </THead>
                <TBody>
                  {holdings.slice(0, 4).map((position) => (
                    <TR key={position.symbol}>
                      <TD className="font-semibold">{position.symbol}</TD>
                      <TD className="text-right">{position.qty}</TD>
                      <TD className="text-right">{formatINR(position.avg)}</TD>
                      <TD className="text-right">{formatINR(position.ltp)}</TD>
                      <TD className={position.pnl >= 0 ? "text-right text-success" : "text-right text-destructive"}>{formatINR(position.pnl)}</TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </div>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Trade History</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              {recentTrades.map((trade) => (
                <div key={`${trade.time}-${trade.symbol}`} className="flex items-center justify-between rounded-md bg-muted p-3">
                  <div className="flex items-center gap-3">
                    <span className="grid h-8 w-8 place-items-center rounded-md bg-card">
                      <MoveHorizontal className="h-4 w-4" />
                    </span>
                    <div>
                      <div className="font-semibold">{trade.symbol}</div>
                      <div className="text-xs text-muted-foreground">{trade.time} · {trade.qty} @ {formatINR(trade.price)}</div>
                    </div>
                  </div>
                  <Badge variant={trade.status === "Pending" ? "warning" : "neutral"}>{trade.status}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>

      <aside className="grid content-start gap-4">
        <OrderEntry />
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CandlestickChart className="h-4 w-4" />
              Depth
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <div className="mb-2 font-semibold text-success">Bids</div>
              {[2863.5, 2862.8, 2861.4, 2860.9].map((price, index) => (
                <div key={price} className="flex justify-between border-b border-border py-1">
                  <span>{formatINR(price)}</span>
                  <span>{(index + 2) * 75}</span>
                </div>
              ))}
            </div>
            <div>
              <div className="mb-2 font-semibold text-destructive">Asks</div>
              {[2864.8, 2865.2, 2866.1, 2867.4].map((price, index) => (
                <div key={price} className="flex justify-between border-b border-border py-1">
                  <span>{formatINR(price)}</span>
                  <span>{(index + 1) * 95}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}
