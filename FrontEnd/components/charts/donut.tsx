import { cn } from "@/lib/utils";

type Segment = {
  label: string;
  value: number;
  color: string;
};

export function DonutChart({ segments, className }: { segments: Segment[]; className?: string }) {
  const gradient = segments
    .reduce<{ cursor: number; stops: string[] }>(
      (acc, segment) => {
        const start = acc.cursor;
        const end = start + segment.value;
        return {
          cursor: end,
          stops: [...acc.stops, `${segment.color} ${start}% ${end}%`],
        };
      },
      { cursor: 0, stops: [] },
    )
    .stops.join(", ");

  return (
    <div className={cn("grid gap-4 sm:grid-cols-[132px_1fr] sm:items-center", className)}>
      <div
        className="relative aspect-square w-32 rounded-full"
        style={{ background: `conic-gradient(${gradient})` }}
        role="img"
        aria-label="Sector allocation donut chart"
      >
        <div className="absolute inset-5 rounded-full bg-card" />
        <div className="absolute inset-0 grid place-items-center text-center">
          <span className="text-xl font-semibold numeric">5</span>
          <span className="mt-7 text-[10px] uppercase text-muted-foreground">sectors</span>
        </div>
      </div>
      <div className="grid gap-2">
        {segments.map((segment) => (
          <div key={segment.label} className="flex items-center justify-between gap-2 text-xs">
            <span className="flex items-center gap-2 text-muted-foreground">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: segment.color }} />
              {segment.label}
            </span>
            <span className="font-semibold numeric">{segment.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
