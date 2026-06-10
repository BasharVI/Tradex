import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva("inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold numeric", {
  variants: {
    variant: {
      neutral: "bg-muted text-muted-foreground",
      primary: "bg-primary/12 text-primary",
      secondary: "bg-secondary/16 text-secondary-foreground dark:text-secondary",
      success: "bg-success/14 text-success",
      warning: "bg-warning/16 text-warning",
      danger: "bg-destructive/14 text-destructive",
      outline: "border border-border text-foreground",
    },
  },
  defaultVariants: {
    variant: "neutral",
  },
});

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, className }))} {...props} />;
}
