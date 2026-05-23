import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

export function StatCard({
  label,
  value,
  delta,
  icon: Icon,
  tone = "primary",
}: {
  label: string;
  value: string;
  delta?: number;
  icon: LucideIcon;
  tone?: "primary" | "success" | "warning" | "destructive";
}) {
  const toneMap: Record<string, string> = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/10 text-success",
    warning: "bg-warning/15 text-warning",
    destructive: "bg-destructive/10 text-destructive",
  };

  return (
    <div className="animate-in-up rounded-2xl border border-border bg-card p-5 shadow-soft hover:shadow-elegant transition-all">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <div className={`grid h-10 w-10 place-items-center rounded-xl ${toneMap[tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="mt-3 text-2xl font-extrabold tracking-tight">{value}</div>
      {typeof delta === "number" && (
        <div className="mt-2 flex items-center gap-1 text-xs">
          {delta >= 0 ? (
            <span className="inline-flex items-center gap-0.5 rounded-md bg-success/10 px-1.5 py-0.5 text-success font-semibold">
              <ArrowUpRight className="h-3 w-3" /> {delta}%
            </span>
          ) : (
            <span className="inline-flex items-center gap-0.5 rounded-md bg-destructive/10 px-1.5 py-0.5 text-destructive font-semibold">
              <ArrowDownRight className="h-3 w-3" /> {Math.abs(delta)}%
            </span>
          )}
          <span className="text-muted-foreground">عن الأسبوع الماضي</span>
        </div>
      )}
    </div>
  );
}
