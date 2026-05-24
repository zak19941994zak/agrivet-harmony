import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Area, AreaChart, CartesianGrid, Cell, Legend, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { AlertTriangle, CalendarClock, DollarSign, Receipt, ShoppingCart, TrendingUp } from "lucide-react";
import { StatCard } from "@/components/stat-card";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "لوحة التحكم — نظام إدارة الصيدلية البيطرية والزراعية" },
      { name: "description", content: "نظرة شاملة على المبيعات، الأرباح، تنبيهات المخزون، والمنتجات الأكثر مبيعاً." },
    ],
  }),
  component: Dashboard,
});

const CHART_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];
const DAYS_AR = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

function Dashboard() {
  const { data: products = [] } = useQuery({
    queryKey: ["dashboard-products"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("id, name, stock, min_stock, unit, expiry, categories(name)");
      if (error) throw error;
      return data;
    },
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ["dashboard-invoices"],
    queryFn: async () => {
      const since = new Date(); since.setDate(since.getDate() - 30);
      const { data, error } = await supabase
        .from("invoices")
        .select("id, invoice_no, total, payment_type, created_at, customers(name)")
        .gte("created_at", since.toISOString())
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as { id: string; invoice_no: number; total: number; payment_type: string; created_at: string; customers: { name: string } | null }[];
    },
  });

  const { data: items = [] } = useQuery({
    queryKey: ["dashboard-items"],
    queryFn: async () => {
      const { data, error } = await supabase.from("invoice_items").select("product_name, qty, total");
      if (error) throw error;
      return data;
    },
  });

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(); startOfMonth.setDate(1); startOfMonth.setHours(0, 0, 0, 0);

  const todaySales = invoices.filter((i) => new Date(i.created_at) >= today).reduce((s, i) => s + Number(i.total), 0);
  const monthSales = invoices.filter((i) => new Date(i.created_at) >= startOfMonth).reduce((s, i) => s + Number(i.total), 0);
  const todayCount = invoices.filter((i) => new Date(i.created_at) >= today).length;

  const lowStock = products.filter((p) => Number(p.stock) < Number(p.min_stock));
  const expiringSoon = products.filter((p) => p.expiry && new Date(p.expiry) < new Date(Date.now() + 90 * 86400000));

  const salesTrend = useMemo(() => {
    const days: { day: string; sales: number; profit: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0, 0, 0, 0);
      const next = new Date(d); next.setDate(next.getDate() + 1);
      const sales = invoices.filter((inv) => { const t = new Date(inv.created_at); return t >= d && t < next; }).reduce((s, i) => s + Number(i.total), 0);
      days.push({ day: DAYS_AR[d.getDay()], sales, profit: Math.round(sales * 0.35) });
    }
    return days;
  }, [invoices]);

  const categoryShare = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of products) {
      const name = (p.categories as { name: string } | null)?.name ?? "أخرى";
      map.set(name, (map.get(name) ?? 0) + Number(p.stock));
    }
    return [...map.entries()].map(([name, value]) => ({ name, value }));
  }, [products]);

  const topProduct = useMemo(() => {
    const map = new Map<string, number>();
    for (const it of items) map.set(it.product_name, (map.get(it.product_name) ?? 0) + Number(it.qty));
    const arr = [...map.entries()].sort((a, b) => b[1] - a[1]);
    return arr[0];
  }, [items]);

  const recent = invoices.slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="مبيعات اليوم" value={`${todaySales.toLocaleString()} ر.س`} icon={DollarSign} tone="success" />
        <StatCard label="مبيعات الشهر" value={`${monthSales.toLocaleString()} ر.س`} icon={TrendingUp} tone="primary" />
        <StatCard label="فواتير اليوم" value={`${todayCount} فاتورة`} icon={Receipt} tone="primary" />
        <StatCard label="تنبيهات حرجة" value={`${lowStock.length + expiringSoon.length}`} icon={AlertTriangle} tone="warning" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 animate-in-up rounded-2xl border border-border bg-card p-5 shadow-soft">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-bold">تطور المبيعات والأرباح</h3>
              <p className="text-xs text-muted-foreground">آخر 7 أيام</p>
            </div>
            <div className="text-xs flex gap-3">
              <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[var(--chart-1)]" /> المبيعات</span>
              <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[var(--chart-2)]" /> الأرباح</span>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesTrend}>
                <defs>
                  <linearGradient id="gSales" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.45} /><stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} /></linearGradient>
                  <linearGradient id="gProfit" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--chart-2)" stopOpacity={0.4} /><stop offset="95%" stopColor="var(--chart-2)" stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12 }} />
                <Area type="monotone" dataKey="sales" stroke="var(--chart-1)" strokeWidth={2.5} fill="url(#gSales)" />
                <Area type="monotone" dataKey="profit" stroke="var(--chart-2)" strokeWidth={2.5} fill="url(#gProfit)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="animate-in-up rounded-2xl border border-border bg-card p-5 shadow-soft">
          <h3 className="font-bold">توزيع المخزون حسب الفئة</h3>
          <p className="text-xs text-muted-foreground mb-2">نسبة كل فئة</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryShare} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={3}>
                  {categoryShare.map((_, i) => (<Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />))}
                </Pie>
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 animate-in-up rounded-2xl border border-border bg-card shadow-soft overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-border">
            <h3 className="font-bold">أحدث الفواتير</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-muted-foreground"><tr>
                <th className="text-right font-medium px-5 py-3">رقم</th>
                <th className="text-right font-medium px-5 py-3">العميل</th>
                <th className="text-right font-medium px-5 py-3">الإجمالي</th>
                <th className="text-right font-medium px-5 py-3">الدفع</th>
                <th className="text-right font-medium px-5 py-3">الوقت</th>
              </tr></thead>
              <tbody>
                {recent.map((inv) => (
                  <tr key={inv.id} className="border-t border-border hover:bg-muted/30 transition">
                    <td className="px-5 py-3 font-semibold text-primary">#{inv.invoice_no}</td>
                    <td className="px-5 py-3">{inv.customers?.name ?? "عميل نقدي"}</td>
                    <td className="px-5 py-3 font-semibold">{Number(inv.total).toLocaleString()} ر.س</td>
                    <td className="px-5 py-3"><span className="rounded-md bg-accent px-2 py-1 text-xs">{inv.payment_type}</span></td>
                    <td className="px-5 py-3 text-muted-foreground text-xs">{new Date(inv.created_at).toLocaleTimeString("ar-SA")}</td>
                  </tr>
                ))}
                {recent.length === 0 && <tr><td colSpan={5} className="text-center text-muted-foreground py-10 text-sm">لا توجد فواتير بعد</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-4">
          <div className="animate-in-up rounded-2xl border border-border bg-card p-5 shadow-soft">
            <div className="flex items-center gap-2 mb-3">
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-destructive/10 text-destructive"><AlertTriangle className="h-4 w-4" /></div>
              <h3 className="font-bold">منتجات منخفضة المخزون</h3>
            </div>
            <ul className="space-y-2">
              {lowStock.slice(0, 5).map((p) => (
                <li key={p.id} className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2 text-sm">
                  <span className="truncate">{p.name}</span>
                  <span className="rounded-md bg-destructive/15 px-2 py-0.5 text-xs font-bold text-destructive">{p.stock} {p.unit}</span>
                </li>
              ))}
              {lowStock.length === 0 && <li className="text-sm text-muted-foreground">لا توجد تنبيهات</li>}
            </ul>
          </div>

          <div className="animate-in-up rounded-2xl border border-border bg-card p-5 shadow-soft">
            <div className="flex items-center gap-2 mb-3">
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-warning/15 text-warning"><CalendarClock className="h-4 w-4" /></div>
              <h3 className="font-bold">منتجات قاربت على الانتهاء</h3>
            </div>
            <ul className="space-y-2">
              {expiringSoon.slice(0, 5).map((p) => (
                <li key={p.id} className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2 text-sm">
                  <span className="truncate">{p.name}</span>
                  <span className="text-xs text-muted-foreground">{p.expiry}</span>
                </li>
              ))}
              {expiringSoon.length === 0 && <li className="text-sm text-muted-foreground">لا يوجد</li>}
            </ul>
          </div>

          {topProduct && (
            <div className="animate-in-up rounded-2xl border border-border bg-gradient-primary text-primary-foreground p-5 shadow-glow">
              <div className="flex items-center gap-2 mb-1"><ShoppingCart className="h-5 w-5" /><span className="font-bold">المنتج الأكثر مبيعاً</span></div>
              <div className="mt-2 text-lg font-extrabold">{topProduct[0]}</div>
              <div className="text-sm opacity-90">{topProduct[1]} وحدة مباعة</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
