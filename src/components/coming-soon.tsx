import type { LucideIcon } from "lucide-react";

export function ComingSoon({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="grid place-items-center min-h-[60vh]">
      <div className="max-w-md text-center rounded-2xl border border-border bg-card p-8 shadow-soft animate-in-up">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow">
          <Icon className="h-8 w-8" />
        </div>
        <h2 className="mt-5 text-xl font-extrabold">{title}</h2>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{description}</p>
        <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
          قريباً • سيتم تفعيلها بعد ربط Lovable Cloud
        </div>
      </div>
    </div>
  );
}
