import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reports")({
  head: () => ({ meta: [{ title: "التقارير — الصيدلية البيطرية والزراعية" }] }),
  component: ReportsPage,
});

function ReportsPage() {
  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ["report-invoices"],
    queryFn: async () => {
      const since = new Date(); since.setDate(since.getDate() - 30);
      const { data, error } = await supabase.from("invoices").select("total, created_at, payment_type").gte("created_at", since.toISOString());
      if (error) throw error;
      return data;
    },
  });

  const { data: topItems = [] } = useQuery({
    queryKey: ["report-top"],
    queryFn: async () => {
      const { data, error } = await supabase.from("invoice_items").select("product_name, qty, total");
      if (error) throw error;
      const map = new Map<string, { name: string; qty: number; total: number }>();
      for (const r of data) {
        const cur = map.get(r.product_name) ?? { name: r.product_name, qty: 0, total: 0 };
        cur.qty += Number(r.qty); cur.total += Number(r.total);
        map.set(r.product_name, cur);
      }
      return [...map.values()].sort((a, b) => b.qty - a.qty).slice(0, 10);
    },
  });

  const dailyTrend = useMemo(() => {
    const map = new Map<string, number>();
    for (const inv of invoices) {
      const d = new Date(inv.created_at).toLocaleDateString("ar-EG-u-nu-latn");
      map.set(d, (map.get(d) ?? 0) + Number(inv.total));
    }
    return [...map.entries()].map(([day, sales]) => ({ day, sales })).slice(-14);
  }, [invoices]);

  const totalSales = invoices.reduce((s, i) => s + Number(i.total), 0);
  const cashSales = invoices.filter((i) => i.payment_type === "cash").reduce((s, i) => s + Number(i.total), 0);
  const creditSales = invoices.filter((i) => i.payment_type === "credit").reduce((s, i) => s + Number(i.total), 0);

  if (isLoading) return <div className="grid place-items-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card label="مبيعات 30 يوم" value={`${totalSales.toLocaleString()} ر.س`} />
        <Card label="نقدي" value={`${cashSales.toLocaleString()} ر.س`} />
        <Card label="آجل" value={`${creditSales.toLocaleString()} ر.س`} tone="warning" />
        <Card label="عدد الفواتير" value={invoices.length} />
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
        <h3 className="font-bold mb-4">المبيعات اليومية (آخر 14 يوم)</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dailyTrend}>
              <defs><linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.5} /><stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={11} />
              <YAxis stroke="var(--muted-foreground)" fontSize={11} />
              <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12 }} />
              <Area type="monotone" dataKey="sales" stroke="var(--chart-1)" fill="url(#g1)" strokeWidth={2.5} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
        <h3 className="font-bold mb-4">أكثر 10 منتجات مبيعاً</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topItems} layout="vertical" margin={{ left: 80 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis type="number" stroke="var(--muted-foreground)" fontSize={11} />
              <YAxis type="category" dataKey="name" stroke="var(--muted-foreground)" fontSize={11} width={120} />
              <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12 }} />
              <Bar dataKey="qty" fill="var(--chart-2)" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function Card({ label, value, tone }: { label: string; value: React.ReactNode; tone?: "warning" }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`text-2xl font-extrabold mt-1 ${tone === "warning" ? "text-warning" : ""}`}>{value}</div>
    </div>
  );
}
