import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  ScanBarcode,
  Package,
  Users,
  Truck,
  Receipt,
  Wallet,
  BarChart3,
  Settings,
  Stethoscope,
} from "lucide-react";

const nav = [
  { to: "/", label: "لوحة التحكم", icon: LayoutDashboard },
  { to: "/pos", label: "نقطة البيع", icon: ScanBarcode },
  { to: "/inventory", label: "المخزون", icon: Package },
  { to: "/customers", label: "العملاء", icon: Users },
  { to: "/suppliers", label: "الموردين", icon: Truck },
  { to: "/invoices", label: "الفواتير", icon: Receipt },
  { to: "/finance", label: "الحسابات", icon: Wallet },
  { to: "/reports", label: "التقارير", icon: BarChart3 },
  { to: "/settings", label: "الإعدادات", icon: Settings },
];

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col bg-gradient-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-3 px-5 py-5 border-b border-sidebar-border">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground shadow-glow">
          <Stethoscope className="h-6 w-6" />
        </div>
        <div className="leading-tight">
          <div className="text-sm font-bold">الصيدلية البيطرية</div>
          <div className="text-xs text-sidebar-foreground/60">والزراعية — ERP</div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {nav.map((item) => {
          const active = pathname === item.to;
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={[
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all",
                active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-elegant font-semibold"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              ].join(" ")}
            >
              <Icon className="h-[18px] w-[18px]" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="m-3 rounded-xl bg-sidebar-accent/60 p-4 text-xs text-sidebar-foreground/80">
        <div className="font-semibold text-sidebar-foreground mb-1">الإصدار التجريبي</div>
        فعّل Lovable Cloud لربط قاعدة البيانات والمصادقة والتحديث اللحظي.
      </div>
    </aside>
  );
}
