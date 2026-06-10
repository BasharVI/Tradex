import { AlertTriangle, ShieldCheck, Target } from "lucide-react";
import { DonutChart } from "@/components/charts/donut";
import { Heatmap } from "@/components/charts/heatmap";
import { Sparkline } from "@/components/charts/sparkline";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { formatINR, formatPct } from "@/lib/format";
import { heatmap, holdings, performance, sectorAllocation } from "@/lib/market-data";

export default function PortfolioPage() {
  return (
    <div className="grid gap-4">
      <section className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader>
            <div>
              <CardTitle className="text-lg">Portfolio</CardTitle>
              <p className="text-xs text-muted-foreground">Holdings, risk, allocation, and P&L behavior</p>
            </div>
            <Badge variant="success">Healthy</Badge>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              {[
                ["Total value", formatINR(284872)],
                ["Invested", formatINR(274836)],
                ["Unrealized P&L", "+₹10,036"],
                ["Cash", formatINR(482900)],
              ].map(([label, value]) => (
                <div key={label} className="rounded-md bg-muted p-3">
                  <div className="text-xs text-muted-foreground">{label}</div>
                  <div className="mt-1 text-xl font-semibold numeric">{value}</div>
                </div>
              ))}
            </div>
            <Sparkline data={performance} className="mt-6 h-48" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Risk Metrics</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            {[
              ["Concentration", 62, "Moderate"],
              ["Drawdown usage", 34, "Low"],
              ["Cash buffer", 74, "Strong"],
              ["Volatility", 48, "Balanced"],
            ].map(([label, value, note]) => (
              <div key={label as string}>
                <div className="mb-1 flex justify-between text-xs">
                  <span className="font-medium">{label}</span>
                  <span className="text-muted-foreground">{note}</span>
                </div>
                <Progress value={value as number} />
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <CardHeader>
            <CardTitle>Sector Allocation</CardTitle>
          </CardHeader>
          <CardContent>
            <DonutChart segments={sectorAllocation} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Portfolio Heatmap</CardTitle>
          </CardHeader>
          <CardContent>
            <Heatmap items={heatmap} />
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Holdings</CardTitle>
          </CardHeader>
          <div className="data-scroll overflow-x-auto">
            <Table>
              <THead>
                <TR>
                  <TH>Symbol</TH>
                  <TH>Sector</TH>
                  <TH className="text-right">Qty</TH>
                  <TH className="text-right">Avg</TH>
                  <TH className="text-right">LTP</TH>
                  <TH className="text-right">Invested</TH>
                  <TH className="text-right">Value</TH>
                  <TH className="text-right">Day</TH>
                  <TH className="text-right">P&L</TH>
                  <TH>Risk</TH>
                </TR>
              </THead>
              <TBody>
                {holdings.map((holding) => (
                  <TR key={holding.symbol}>
                    <TD className="font-semibold">{holding.symbol}</TD>
                    <TD className="text-muted-foreground">{holding.sector}</TD>
                    <TD className="text-right">{holding.qty}</TD>
                    <TD className="text-right">{formatINR(holding.avg)}</TD>
                    <TD className="text-right">{formatINR(holding.ltp)}</TD>
                    <TD className="text-right">{formatINR(holding.invested)}</TD>
                    <TD className="text-right">{formatINR(holding.value)}</TD>
                    <TD className={holding.day >= 0 ? "text-right text-success" : "text-right text-destructive"}>{formatPct(holding.day)}</TD>
                    <TD className={holding.pnl >= 0 ? "text-right text-success" : "text-right text-destructive"}>{formatINR(holding.pnl)}</TD>
                    <TD>
                      <Badge variant={holding.risk === "Elevated" ? "warning" : "neutral"}>{holding.risk}</Badge>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </div>
        </Card>

        <div className="grid content-start gap-4">
          {[
            { icon: ShieldCheck, title: "Diversification", body: "No single sector exceeds 24%. Portfolio is within policy band.", tone: "success" },
            { icon: AlertTriangle, title: "Risk Alert", body: "Auto exposure has high beta. Keep fresh entries below 6% of capital.", tone: "warning" },
            { icon: Target, title: "Rebalance", body: "Financials are underperforming; review thesis before averaging.", tone: "neutral" },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.title}>
                <CardContent className="flex gap-3 p-4">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-muted">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{item.title}</h3>
                      <Badge variant={item.tone as "success" | "warning" | "neutral"}>{item.tone}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{item.body}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}
