import { ArrowDownRight, ArrowUpRight, Clock3, Wallet } from "lucide-react";
import { DonutChart } from "@/components/charts/donut";
import { Sparkline } from "@/components/charts/sparkline";
import { WatchlistPanel } from "@/components/sections/watchlist-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { formatINR, formatPct } from "@/lib/format";
import { holdings, performance, recentTrades, sectorAllocation } from "@/lib/market-data";

const stats = [
  { label: "Portfolio value", value: formatINR(284872), delta: "+1.14%", icon: Wallet, tone: "success" },
  { label: "Daily P&L", value: "+₹3,184", delta: "+0.98%", icon: ArrowUpRight, tone: "success" },
  { label: "Available cash", value: formatINR(482900), delta: "64.2%", icon: Clock3, tone: "neutral" },
  { label: "Open risk", value: "2.7%", delta: "-0.4%", icon: ArrowDownRight, tone: "warning" },
] as const;

export default function DashboardPage() {
  return (
    <div className="grid gap-4 xl:grid-cols-[320px_1fr]">
      <WatchlistPanel compact />
      <div className="grid min-w-0 gap-4">
        <section className="grid gap-3 rounded-lg border border-border bg-card p-4 shadow-subtle lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="text-xs font-semibold uppercase text-muted-foreground">Market session</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-normal sm:text-3xl">Good morning, Bashar</h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Your portfolio is net positive today. Auto and IT are carrying most of the move while financials remain flat.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">Review risk</Button>
            <Button>Open terminal</Button>
          </div>
        </section>

        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <span className="text-xs font-medium text-muted-foreground">{stat.label}</span>
                    <span className="grid h-8 w-8 place-items-center rounded-md bg-muted">
                      <Icon className="h-4 w-4" />
                    </span>
                  </div>
                  <div className="mt-4 text-2xl font-semibold numeric">{stat.value}</div>
                  <Badge className="mt-2" variant={stat.tone}>{stat.delta}</Badge>
                </CardContent>
              </Card>
            );
          })}
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.45fr_0.9fr]">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Performance</CardTitle>
                <p className="text-xs text-muted-foreground">12-session equity curve</p>
              </div>
              <Badge variant="success">+7.6% MTD</Badge>
            </CardHeader>
            <CardContent>
              <Sparkline data={performance} className="h-56" />
              <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
                {[
                  ["Win rate", "58%"],
                  ["Profit factor", "1.82"],
                  ["Avg hold", "2d 4h"],
                  ["Max DD", "-3.4%"],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-md bg-muted p-3">
                    <div className="text-xs text-muted-foreground">{label}</div>
                    <div className="mt-1 text-lg font-semibold numeric">{value}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sector Allocation</CardTitle>
            </CardHeader>
            <CardContent>
              <DonutChart segments={sectorAllocation} />
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>Holdings Snapshot</CardTitle>
            </CardHeader>
            <div className="data-scroll overflow-x-auto">
              <Table>
                <THead>
                  <TR>
                    <TH>Symbol</TH>
                    <TH>Sector</TH>
                    <TH className="text-right">Qty</TH>
                    <TH className="text-right">LTP</TH>
                    <TH className="text-right">P&L</TH>
                    <TH className="text-right">P&L %</TH>
                  </TR>
                </THead>
                <TBody>
                  {holdings.map((holding) => (
                    <TR key={holding.symbol}>
                      <TD className="font-semibold">{holding.symbol}</TD>
                      <TD className="text-muted-foreground">{holding.sector}</TD>
                      <TD className="text-right">{holding.qty}</TD>
                      <TD className="text-right">{formatINR(holding.ltp)}</TD>
                      <TD className={holding.pnl >= 0 ? "text-right text-success" : "text-right text-destructive"}>{formatINR(holding.pnl)}</TD>
                      <TD className={holding.pnlPct >= 0 ? "text-right text-success" : "text-right text-destructive"}>{formatPct(holding.pnlPct)}</TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </div>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Trades</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              {recentTrades.map((trade) => (
                <div key={`${trade.time}-${trade.symbol}`} className="flex items-center justify-between gap-3 rounded-md bg-muted p-3">
                  <div>
                    <div className="font-semibold">{trade.symbol}</div>
                    <div className="text-xs text-muted-foreground">{trade.time} · {trade.qty} qty · {formatINR(trade.price)}</div>
                  </div>
                  <Badge variant={trade.side === "BUY" ? "success" : "danger"}>{trade.side}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
