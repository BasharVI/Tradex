"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Bot,
  Gauge,
  LayoutDashboard,
  Menu,
  Search,
  ShieldCheck,
  Trophy,
  WalletCards,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/terminal", label: "Terminal", icon: BarChart3 },
  { href: "/portfolio", label: "Portfolio", icon: WalletCards },
  { href: "/coach", label: "AI Coach", icon: Bot },
  { href: "/growth", label: "Growth", icon: Trophy },
  { href: "/design-system", label: "System", icon: ShieldCheck },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/94 backdrop-blur">
        <a className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground" href="#main">
          Skip to content
        </a>
        <div className="mx-auto flex h-14 max-w-[1600px] items-center gap-3 px-3 sm:px-4">
          <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
            <Menu className="h-4 w-4" />
          </Button>
          <Link href="/dashboard" className="flex min-w-36 items-center gap-2" aria-label="TradeX dashboard">
            <span className="grid h-8 w-8 place-items-center rounded-md bg-primary text-sm font-black text-primary-foreground">TX</span>
            <span>
              <span className="block text-sm font-bold leading-4">TradeX</span>
              <span className="block text-[10px] uppercase leading-3 text-muted-foreground">Paper trading India</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary navigation">
            {nav.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                    active && "bg-muted text-foreground",
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="ml-auto hidden w-full max-w-sm items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 md:flex">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              aria-label="Search stocks"
              placeholder="Search NIFTY, RELIANCE, INFY..."
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            <kbd className="rounded border border-border bg-muted px-1.5 text-[10px] text-muted-foreground">/</kbd>
          </div>
          <div className="hidden items-center gap-2 sm:flex">
            <div className="rounded-md border border-border px-2 py-1 text-xs">
              <span className="text-muted-foreground">NIFTY</span>
              <span className="ml-2 font-semibold text-success numeric">+0.42%</span>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main id="main" className="mx-auto max-w-[1600px] px-3 pb-24 pt-4 sm:px-4 lg:pb-8">
        {children}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/96 px-2 py-2 backdrop-blur lg:hidden" aria-label="Mobile navigation">
        <div className="grid grid-cols-5 gap-1">
          {nav.slice(0, 5).map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex min-h-12 flex-col items-center justify-center rounded-md text-[11px] font-medium text-muted-foreground",
                  active && "bg-muted text-foreground",
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="mb-0.5 h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
