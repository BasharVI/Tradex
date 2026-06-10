import { Brain, FileText, LineChart, MessageSquareText, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { formatINR } from "@/lib/format";
import { behaviorMetrics, recentTrades } from "@/lib/market-data";

export default function CoachPage() {
  return (
    <div className="grid gap-4">
      <section className="rounded-lg border border-border bg-card p-4 shadow-subtle">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <Badge variant="primary">Premium AI feature</Badge>
            <h1 className="mt-3 text-2xl font-semibold sm:text-3xl">AI Trading Coach</h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Review trades, detect behavior patterns, and turn weekly activity into specific execution improvements.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline">
              <FileText className="h-4 w-4" />
              Weekly report
            </Button>
            <Button>
              <Sparkles className="h-4 w-4" />
              Run analysis
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-4">
        {[
          { icon: MessageSquareText, title: "AI Trade Review", value: "B+", copy: "Entry quality improved; exits remain early." },
          { icon: LineChart, title: "Portfolio Analysis", value: "82", copy: "Diversification and cash buffer are strong." },
          { icon: Brain, title: "Behavior Analysis", value: "4", copy: "Four recurring behaviors detected this month." },
          { icon: FileText, title: "Weekly Reports", value: "12", copy: "Consistent review habit across 12 weeks." },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.title}>
              <CardContent className="p-4">
                <span className="grid h-9 w-9 place-items-center rounded-md bg-muted">
                  <Icon className="h-4 w-4" />
                </span>
                <div className="mt-4 text-3xl font-semibold numeric">{item.value}</div>
                <h2 className="mt-1 font-semibold">{item.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{item.copy}</p>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Latest Trade Review</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="rounded-md bg-muted p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="font-semibold">TATAMOTORS long momentum entry</h2>
                  <p className="text-xs text-muted-foreground">20 qty @ {formatINR(982)} · reviewed 14 minutes ago</p>
                </div>
                <Badge variant="success">Grade A-</Badge>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                The entry aligned with volume expansion and sector strength. The stop placement was disciplined, but partial exit rules should be defined before entry.
              </p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-md border border-border p-3">
                <h3 className="font-semibold text-success">What worked</h3>
                <ul className="mt-2 grid gap-2 text-sm text-muted-foreground">
                  <li>Waited for confirmation instead of chasing the first move.</li>
                  <li>Position size stayed inside the 2% risk rule.</li>
                </ul>
              </div>
              <div className="rounded-md border border-border p-3">
                <h3 className="font-semibold text-warning">Improve next</h3>
                <ul className="mt-2 grid gap-2 text-sm text-muted-foreground">
                  <li>Pre-commit the first target and trailing rule.</li>
                  <li>Journal emotional state immediately after exit.</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Behavior Profile</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            {behaviorMetrics.map((metric) => (
              <div key={metric.label}>
                <div className="mb-1 flex justify-between text-xs">
                  <span className="font-medium">{metric.label}</span>
                  <span className="numeric text-muted-foreground">{metric.value}%</span>
                </div>
                <Progress value={metric.value} />
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Trades Awaiting Review</CardTitle>
        </CardHeader>
        <div className="data-scroll overflow-x-auto">
          <Table>
            <THead>
              <TR>
                <TH>Time</TH>
                <TH>Symbol</TH>
                <TH>Side</TH>
                <TH className="text-right">Qty</TH>
                <TH className="text-right">Price</TH>
                <TH>Status</TH>
                <TH className="text-right">Action</TH>
              </TR>
            </THead>
            <TBody>
              {recentTrades.map((trade) => (
                <TR key={`${trade.time}-${trade.symbol}`}>
                  <TD>{trade.time}</TD>
                  <TD className="font-semibold">{trade.symbol}</TD>
                  <TD><Badge variant={trade.side === "BUY" ? "success" : "danger"}>{trade.side}</Badge></TD>
                  <TD className="text-right">{trade.qty}</TD>
                  <TD className="text-right">{formatINR(trade.price)}</TD>
                  <TD>{trade.status}</TD>
                  <TD className="text-right"><Button size="sm" variant="outline">Review</Button></TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
