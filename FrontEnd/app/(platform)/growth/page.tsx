import { Award, Flame, Medal, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { leaderboard } from "@/lib/market-data";

export default function GrowthPage() {
  return (
    <div className="grid gap-4">
      <section className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader>
            <div>
              <CardTitle className="text-lg">Growth Hub</CardTitle>
              <p className="text-xs text-muted-foreground">Professional habit loops without game-like clutter</p>
            </div>
            <Badge variant="secondary">Level 8</Badge>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-4">
            {[
              { icon: Flame, label: "Trading streak", value: "11 days" },
              { icon: Trophy, label: "Challenges", value: "4 active" },
              { icon: Award, label: "Achievements", value: "18" },
              { icon: Medal, label: "Rank", value: "#4" },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="rounded-md bg-muted p-3">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <div className="mt-3 text-xl font-semibold numeric">{item.value}</div>
                  <div className="text-xs text-muted-foreground">{item.label}</div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Weekly Discipline</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            {[
              ["Journal completion", 86],
              ["Risk rule adherence", 78],
              ["Review cadence", 92],
            ].map(([label, value]) => (
              <div key={label as string}>
                <div className="mb-1 flex justify-between text-xs">
                  <span className="font-medium">{label}</span>
                  <span className="text-muted-foreground numeric">{value}%</span>
                </div>
                <Progress value={value as number} />
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Challenges</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {[
              ["Journal every executed trade", "3 of 4 complete", 75, "200 pts"],
              ["No revenge trades this week", "5 of 5 sessions", 100, "350 pts"],
              ["Keep position risk under 2%", "7 of 8 orders", 88, "250 pts"],
              ["Review losing trades", "2 of 3 complete", 67, "180 pts"],
            ].map(([title, detail, value, points]) => (
              <div key={title as string} className="rounded-md border border-border p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-semibold">{title}</h2>
                    <p className="text-xs text-muted-foreground">{detail}</p>
                  </div>
                  <Badge variant="outline">{points}</Badge>
                </div>
                <Progress value={value as number} className="mt-3" />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Leaderboard</CardTitle>
          </CardHeader>
          <div className="data-scroll overflow-x-auto">
            <Table>
              <THead>
                <TR>
                  <TH>Rank</TH>
                  <TH>Trader</TH>
                  <TH className="text-right">Return</TH>
                  <TH className="text-right">Consistency</TH>
                </TR>
              </THead>
              <TBody>
                {leaderboard.map((row) => (
                  <TR key={row.rank} className={row.name === "You" ? "bg-primary/8" : undefined}>
                    <TD>#{row.rank}</TD>
                    <TD className="font-semibold">{row.name}</TD>
                    <TD className="text-right text-success">{row.metric}</TD>
                    <TD className="text-right">{row.consistency}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </div>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Achievements</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          {[
            ["Risk Steward", "30 orders inside risk policy", "Unlocked"],
            ["Consistent Reviewer", "10 weekly reports generated", "Unlocked"],
            ["Calm Executor", "7 sessions with no impulsive trades", "In progress"],
          ].map(([title, detail, status]) => (
            <div key={title} className="rounded-md border border-border p-4">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-semibold">{title}</h2>
                <Badge variant={status === "Unlocked" ? "success" : "neutral"}>{status}</Badge>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{detail}</p>
              <Button variant="outline" size="sm" className="mt-4">View criteria</Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
