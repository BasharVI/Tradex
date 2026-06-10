const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const inrCompact = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  notation: "compact",
  maximumFractionDigits: 2,
});

export function formatINR(value: number, compact = false) {
  return (compact ? inrCompact : inr).format(value);
}

export function formatPct(value: number) {
  const prefix = value > 0 ? "+" : "";
  return `${prefix}${value.toFixed(2)}%`;
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("en-IN").format(value);
}
