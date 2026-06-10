# TradeX Design System

## Objective

TradeX is a premium Indian paper trading platform inspired by Zerodha Kite's simplicity, speed, and information density without copying its brand, palette, layout, or visual language.

## Brand Identity

- Primary: Teal Reserve, `hsl(185 96% 23%)`
- Secondary: Brass Rupee, `hsl(40 72% 42%)`
- Accent: Analyst Violet, `hsl(250 34% 46%)`
- Success: Profit Green, `hsl(158 80% 30%)`
- Warning: Amber Risk, `hsl(35 100% 38%)`
- Danger: Loss Rose, `hsl(348 63% 49%)`
- Neutral: ink and mist scale driven by CSS variables in `app/globals.css`

The palette is intentionally restrained: ink base, teal primary, brass financial accent, violet intelligence accent, and clear P&L semantics.

## Typography

- Display: 32/40, semibold, page titles and major account values
- Heading: 24/32, semibold, screen sections
- Title: 18/28, semibold, cards and panels
- Body: 14/20, regular, default interface text
- Micro: 12/16, medium or semibold, labels, table metadata, badges
- Numeric data uses tabular figures through the `.numeric` utility

## Spacing, Grid, Radius, Elevation

- Spacing scale: 4px base with 8, 12, 16, 24, 32, 48 for layout rhythm
- Dashboard: `320px + fluid` desktop grid
- Terminal: `300px watchlist + fluid chart + 340px order panel`
- Portfolio/coach/growth: responsive card grids with scroll-safe tables
- Radius: 8px cards, 6px controls, 4px badges
- Elevation: borders first, subtle shadow for panels, stronger shadow only for overlays/drawers

## Motion

- 120-180ms for hover, focus, and panel state transitions
- No decorative motion on trading-critical surfaces
- Honors `prefers-reduced-motion`

## Components

- Primitives: Button, Input, Select, Textarea, Badge, Card, Table, Progress
- Charts: Sparkline, Donut, Heatmap
- Composites: AppShell, ThemeToggle, WatchlistPanel, OrderEntry
- Planned overlays: Modal, Dropdown, Drawer, Toast notification shell

## Accessibility

- WCAG AA color tokens for light and dark mode
- High contrast mode via `.contrast`
- Theme persistence through localStorage
- Visible focus rings and keyboard navigation
- Skip link and semantic landmarks
- Icon buttons include accessible labels

## Page Wireframes

- Dashboard: watchlist rail, account hero, daily P&L, portfolio value, allocation, performance, holdings, recent trades
- Terminal: watchlist, stock search, chart, order entry, market depth, positions, trade history
- Portfolio: holdings, P&L analysis, sector allocation, heatmap, risk metrics
- AI Coach: trade review, portfolio analysis, behavior analysis, weekly reports
- Growth: challenges, leaderboards, achievements, streaks
- Mobile: bottom nav, compact cards, horizontal data tables, single-column trade flow

## Frontend Architecture

- Next.js App Router
- TypeScript
- Tailwind CSS tokens
- ShadCN-style local primitives
- Component-first page composition
- Theme provider with dark, light, and high contrast persistence

## Implementation Plan

1. Connect dashboard and portfolio screens to existing `/portfolio`, `/watchlist`, `/orders`, `/ai`, and `/retention` APIs.
2. Replace mock market arrays with typed server actions or client fetch hooks backed by streaming updates.
3. Add virtualized holdings/orders tables once row counts exceed 200.
4. Integrate production chart engine for candlesticks while keeping the lightweight chart shell.
5. Add modal, drawer, dropdown, tooltip, and toast primitives with Radix UI.
6. Run Lighthouse audits and optimize bundle splitting for chart-heavy routes.
