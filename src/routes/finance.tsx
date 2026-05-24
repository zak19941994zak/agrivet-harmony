import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Trash2, Wallet, TrendingUp, TrendingDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/finance")({
  head: () => ({ meta: [{ title: "الحسابات — الصيدلية البيطرية والزراعية" }] }),
  component: FinancePage,
});

type Expense = { id: string; description: string; amount: number; category: string | null; created_at: string };

function FinancePage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ["expenses"],
    queryFn: async () => {
      const { data, error } = await supabase.from("expenses").select("*").order("created_at", { ascending: false }).limit(100);
      if (error) throw error;
      return data as Expense[];
    },
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ["finance-invoices"],
    queryFn: async () => {
      const startOfMonth = new Date(); startOfMonth.setDate(1); startOfMonth.setHours(0, 0, 0, 0);
      const { data, error } = await supabase.from("invoices").select("total, created_at").gte("created_at", startOfMonth.toISOString());
      if (error) throw error;
      return data;
    },
  });

  const monthRevenue = useMemo(() => invoices.reduce((s, i) => s + Number(i.total), 0), [invoices]);
  const monthExpenses = useMemo(() => expenses.filter((e) => new Date(e.created_at).getMonth() === new Date().getMonth()).reduce((s, e) => s + Number(e.amount), 0), [expenses]);
  const net = monthRevenue - monthExpenses;

  const del = async (id: string) => {
    if (!confirm("حذف المصروف؟")) return;
    const { error } = await supabase.from("expenses").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("تم"); qc.invalidateQueries({ queryKey: ["expenses"] }); }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-center justify-between"><div className="text-xs text-muted-foreground">إيرادات الشهر</div><TrendingUp className="h-4 w-4 text-success" /></div>
          <div className="text-2xl font-extrabold mt-1 text-success">{monthRevenue.toLocaleString()} ر.س</div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-center justify-between"><div className="text-xs text-muted-foreground">مصروفات الشهر</div><TrendingDown className="h-4 w-4 text-destructive" /></div>
          <div className="text-2xl font-extrabold mt-1 text-destructive">{monthExpenses.toLocaleString()} ر.س</div>
        </div>
        <div className="rounded-2xl border border-border bg-gradient-primary text-primary-foreground p-5 shadow-glow">
          <div className="flex items-center justify-between"><div className="text-xs opacity-80">صافي الربح</div><Wallet className="h-4 w-4" /></div>
          <div className="text-2xl font-extrabold mt-1">{net.toLocaleString()} ر.س</div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h3 className="font-bold">سجل المصروفات</h3>
        <button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 rounded-xl bg-gradient-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-glow">
          <Plus className="h-4 w-4" /> مصروف جديد
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
        {isLoading ? <div className="grid place-items-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> :
        expenses.length === 0 ? <div className="text-center py-20 text-muted-foreground text-sm">لا توجد مصروفات</div> :
        <div className="overflow-x-auto"><table className="w-full text-sm">
          <thead className="bg-muted/50 text-muted-foreground"><tr>
            <th className="text-right font-medium px-4 py-3">الوصف</th>
            <th className="text-right font-medium px-4 py-3">الفئة</th>
            <th className="text-right font-medium px-4 py-3">المبلغ</th>
            <th className="text-right font-medium px-4 py-3">التاريخ</th>
            <th className="text-right font-medium px-4 py-3"></th>
          </tr></thead>
          <tbody>{expenses.map((e) => (
            <tr key={e.id} className="border-t border-border hover:bg-muted/30">
              <td className="px-4 py-3 font-semibold">{e.description}</td>
              <td className="px-4 py-3 text-muted-foreground">{e.category ?? "—"}</td>
              <td className="px-4 py-3 font-bold text-destructive">{Number(e.amount).toLocaleString()} ر.س</td>
              <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(e.created_at).toLocaleString("ar-SA")}</td>
              <td className="px-4 py-3 text-left">
                <button onClick={() => del(e.id)} className="rounded-lg p-2 hover:bg-destructive/10 text-destructive"><Trash2 className="h-4 w-4" /></button>
              </td>
            </tr>
          ))}</tbody>
        </table></div>}
      </div>

      {open && <ExpenseDialog onClose={() => setOpen(false)} />}
    </div>
  );
}

function ExpenseDialog({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ description: "", amount: 0, category: "تشغيل" });
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("expenses").insert({ ...form, created_by: user?.id });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("تم تسجيل المصروف");
    qc.invalidateQueries({ queryKey: ["expenses"] });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card shadow-elegant">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <h3 className="font-bold text-lg">مصروف جديد</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">✕</button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-4">
          <label className="block"><span className="text-xs font-semibold mb-1 block">الوصف *</span>
            <input required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary" /></label>
          <label className="block"><span className="text-xs font-semibold mb-1 block">الفئة</span>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary">
              <option>تشغيل</option><option>إيجار</option><option>رواتب</option><option>كهرباء وماء</option><option>صيانة</option><option>أخرى</option>
            </select></label>
          <label className="block"><span className="text-xs font-semibold mb-1 block">المبلغ *</span>
            <input required type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: +e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary" /></label>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={onClose} className="rounded-xl border border-border px-5 py-2.5 text-sm font-semibold hover:bg-accent">إلغاء</button>
            <button disabled={loading} className="rounded-xl bg-gradient-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-glow disabled:opacity-60 inline-flex items-center gap-2">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />} حفظ
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
