import { CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";

const colors = [
  ["Primary", "Teal Reserve", "bg-primary text-primary-foreground", "HSL 185 96% 23%"],
  ["Secondary", "Brass Rupee", "bg-secondary text-secondary-foreground", "HSL 40 72% 42%"],
  ["Accent", "Analyst Violet", "bg-accent text-accent-foreground", "HSL 250 34% 46%"],
  ["Success", "Profit Green", "bg-success text-success-foreground", "HSL 158 80% 30%"],
  ["Warning", "Amber Risk", "bg-warning text-warning-foreground", "HSL 35 100% 38%"],
  ["Danger", "Loss Rose", "bg-destructive text-destructive-foreground", "HSL 348 63% 49%"],
];

export default function DesignSystemPage() {
  return (
    <div className="grid gap-4">
      <section className="rounded-lg border border-border bg-card p-4 shadow-subtle">
        <Badge variant="primary">Complete design system</Badge>
        <h1 className="mt-3 text-2xl font-semibold sm:text-3xl">TradeX Design System</h1>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
          A premium Indian FinTech interface system focused on speed, density, accessibility, and professional trading decisions.
        </p>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Color Palette</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {colors.map(([label, name, className, value]) => (
              <div key={label} className="grid grid-cols-[88px_1fr_auto] items-center gap-3">
                <div className={`h-10 rounded-md ${className}`} />
                <div>
                  <div className="font-semibold">{name}</div>
                  <div className="text-xs text-muted-foreground">{label}</div>
                </div>
                <code className="text-xs text-muted-foreground">{value}</code>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Typography Scale</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div>
              <div className="text-3xl font-semibold">Display 32/40</div>
              <div className="text-xs text-muted-foreground">Page titles and major account values</div>
            </div>
            <div>
              <div className="text-2xl font-semibold">Heading 24/32</div>
              <div className="text-xs text-muted-foreground">Screen sections and dense dashboards</div>
            </div>
            <div>
              <div className="text-base font-semibold">Body Strong 16/24</div>
              <div className="text-xs text-muted-foreground">Labels, holdings, order headers</div>
            </div>
            <div>
              <div className="text-sm">Body 14/20</div>
              <div className="text-xs text-muted-foreground">Default UI copy and data tables</div>
            </div>
            <div>
              <div className="text-xs uppercase text-muted-foreground">Micro 12/16</div>
              <div className="text-xs text-muted-foreground">Metadata, badges, helper text</div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {[
          ["Spacing", "4px base. Screen gutters 12/16px mobile to desktop. Component rhythm 8, 12, 16, 24, 32."],
          ["Grid", "Trading terminal uses 300px watchlist, fluid chart, 340px order panel. Analytics use 12-column responsive grids."],
          ["Radius", "8px maximum card radius, 6px controls, 4px badges and heatmap cells for a precise professional feel."],
          ["Elevation", "Mostly borders. Subtle shadow for floating panels, panel shadow only for overlays and drawers."],
          ["Motion", "120-180ms state changes, reduced-motion compliant, no decorative motion on trading-critical screens."],
          ["Accessibility", "WCAG AA tokens, visible focus rings, landmarks, skip link, screen-reader labels, high contrast mode."],
        ].map(([title, body]) => (
          <Card key={title}>
            <CardContent className="p-4">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <h2 className="mt-3 font-semibold">{title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{body}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Component Architecture</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-2">
          <div className="grid gap-3 rounded-md border border-border p-4">
            <h2 className="font-semibold">Primitives</h2>
            <div className="flex flex-wrap gap-2">
              <Button>Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Badge variant="success">Profit</Badge>
              <Badge variant="danger">Loss</Badge>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <Input placeholder="Symbol" />
              <Select defaultValue="NSE">
                <option>NSE</option>
                <option>BSE</option>
              </Select>
            </div>
          </div>
          <div className="grid gap-2 text-sm text-muted-foreground">
            <p><strong className="text-foreground">Foundation:</strong> theme provider, tokens, typography, spacing, focus, high contrast.</p>
            <p><strong className="text-foreground">Primitives:</strong> buttons, inputs, tables, badges, progress, cards, modals, dropdowns, drawers.</p>
            <p><strong className="text-foreground">Composites:</strong> watchlist, order entry, chart shell, metrics, heatmaps, allocation charts.</p>
            <p><strong className="text-foreground">Pages:</strong> dashboard, terminal, portfolio, AI coach, growth, design system.</p>
          </div>
        </CardContent>
      </Card>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Page Wireframes</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm text-muted-foreground">
            <p>Dashboard: watchlist rail, account hero, four metrics, performance chart, allocation, holdings, recent trades.</p>
            <p>Terminal: watchlist, stock search, advanced chart surface, order entry, depth, positions, trade history.</p>
            <p>Portfolio: summary, P&L curve, allocation donut, heatmap, holdings table, risk insights.</p>
            <p>Coach: premium feature hero, analysis cards, trade review, behavior metrics, review queue.</p>
            <p>Growth: streaks, professional challenges, leaderboard, achievements, discipline scoring.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Mobile Designs</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm text-muted-foreground">
            <p>Bottom navigation keeps primary actions thumb-accessible: Dashboard, Terminal, Portfolio, AI Coach, Growth.</p>
            <p>Dense tables become horizontally scrollable with tabular numbers and stable row height.</p>
            <p>Terminal collapses to watchlist, chart, order entry, positions in a single-column workflow.</p>
            <p>Cards preserve 8px radius and 12px gutters for fast scanning on compact devices.</p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
