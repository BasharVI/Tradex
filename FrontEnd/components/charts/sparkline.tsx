import { cn } from "@/lib/utils";

export function Sparkline({
  data,
  className,
  stroke = "hsl(var(--primary))",
}: {
  data: number[];
  className?: string;
  stroke?: string;
}) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * 100;
      const y = 100 - ((value - min) / range) * 82 - 9;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg className={cn("h-24 w-full overflow-visible", className)} viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label="Portfolio performance trend">
      <polyline points={points} fill="none" stroke={stroke} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      <polyline points={`0,100 ${points} 100,100`} fill={stroke} opacity="0.08" />
    </svg>
  );
}
