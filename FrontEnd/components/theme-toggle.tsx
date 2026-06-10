"use client";

import { Contrast, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";

export function ThemeToggle() {
  const { theme, highContrast, toggleTheme, toggleContrast } = useTheme();

  return (
    <div className="flex items-center gap-1" aria-label="Theme controls">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={toggleTheme}
        aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        title={theme === "dark" ? "Light mode" : "Dark mode"}
      >
        {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </Button>
      <Button
        type="button"
        variant={highContrast ? "secondary" : "ghost"}
        size="icon"
        onClick={toggleContrast}
        aria-label={highContrast ? "Disable high contrast" : "Enable high contrast"}
        title="High contrast"
      >
        <Contrast className="h-4 w-4" />
      </Button>
    </div>
  );
}
