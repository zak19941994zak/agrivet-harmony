import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Search, Trash2, Pencil, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/customers")({
  head: () => ({ meta: [{ title: "العملاء — الصيدلية البيطرية والزراعية" }] }),
  component: CustomersPage,
});

type Customer = { id: string; name: string; phone: string | null; address: string | null; type: string | null; balance: number; notes: string | null };

function CustomersPage() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("customers").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Customer[];
    },
  });

  useEffect(() => {
    const ch = supabase.channel("customers-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "customers" }, () => qc.invalidateQueries({ queryKey: ["customers"] }))
      .subscribe();
    return () => void supabase.removeChannel(ch);
  }, [qc]);

  const rows = useMemo(() => customers.filter((c) => !q || c.name.includes(q) || (c.phone ?? "").includes(q)), [customers, q]);
  const totalDebt = customers.reduce((s, c) => s + Number(c.balance), 0);

  const del = async (id: string) => {
    if (!confirm("حذف العميل؟")) return;
    const { error } = await supabase.from("customers").delete().eq("id", id);
    if (error) toast.error(error.message); else toast.success("تم الحذف");
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Stat label="إجمالي العملاء" value={customers.length} icon={Users} />
        <Stat label="إجمالي الديون المستحقة" value={`${totalDebt.toLocaleString()} ر.س`} tone="warning" />
        <Stat label="عملاء بأرصدة" value={customers.filter((c) => Number(c.balance) > 0).length} />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-64">
          <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="بحث بالاسم أو الجوال..."
            className="w-full rounded-xl border border-input bg-card py-2.5 pr-10 pl-3 text-sm outline-none focus:border-primary shadow-soft" />
        </div>
        <button onClick={() => { setEditing(null); setOpen(true); }}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-glow">
          <Plus className="h-4 w-4" /> إضافة عميل
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
        {isLoading ? <div className="grid place-items-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> :
        rows.length === 0 ? <div className="text-center py-20 text-muted-foreground text-sm">لا يوجد عملاء</div> :
        <div className="overflow-x-auto"><table className="w-full text-sm">
          <thead className="bg-muted/50 text-muted-foreground"><tr>
            <th className="text-right font-medium px-4 py-3">الاسم</th>
            <th className="text-right font-medium px-4 py-3">الجوال</th>
            <th className="text-right font-medium px-4 py-3">النوع</th>
            <th className="text-right font-medium px-4 py-3">العنوان</th>
            <th className="text-right font-medium px-4 py-3">الرصيد</th>
            <th className="text-right font-medium px-4 py-3"></th>
          </tr></thead>
          <tbody>{rows.map((c) => (
            <tr key={c.id} className="border-t border-border hover:bg-muted/30">
              <td className="px-4 py-3 font-semibold">{c.name}</td>
              <td className="px-4 py-3" dir="ltr">{c.phone ?? "—"}</td>
              <td className="px-4 py-3">{c.type === "farm" ? "مزرعة" : c.type === "clinic" ? "عيادة" : "فرد"}</td>
              <td className="px-4 py-3 text-muted-foreground">{c.address ?? "—"}</td>
              <td className={`px-4 py-3 font-bold ${Number(c.balance) > 0 ? "text-warning" : ""}`}>{Number(c.balance).toLocaleString()} ر.س</td>
              <td className="px-4 py-3 text-left">
                <button onClick={() => { setEditing(c); setOpen(true); }} className="rounded-lg p-2 hover:bg-accent"><Pencil className="h-4 w-4" /></button>
                <button onClick={() => del(c.id)} className="rounded-lg p-2 hover:bg-destructive/10 text-destructive"><Trash2 className="h-4 w-4" /></button>
              </td>
            </tr>
          ))}</tbody>
        </table></div>}
      </div>

      {open && <CustomerDialog initial={editing} onClose={() => setOpen(false)} />}
    </div>
  );
}

function CustomerDialog({ initial, onClose }: { initial: Customer | null; onClose: () => void }) {
  const [form, setForm] = useState({
    name: initial?.name ?? "", phone: initial?.phone ?? "", address: initial?.address ?? "",
    type: initial?.type ?? "individual", notes: initial?.notes ?? "", balance: initial?.balance ?? 0,
  });
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const payload = { ...form, phone: form.phone || null, address: form.address || null, notes: form.notes || null };
    const { error } = initial
      ? await supabase.from("customers").update(payload).eq("id", initial.id)
      : await supabase.from("customers").insert(payload);
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success(initial ? "تم التحديث" : "تم الإضافة");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background/70 backdrop-blur-sm p-4 animate-in-up">
      <div className="w-full max-w-xl rounded-2xl border border-border bg-card shadow-elegant">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <h3 className="font-bold text-lg">{initial ? "تعديل عميل" : "عميل جديد"}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">✕</button>
        </div>
        <form onSubmit={submit} className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="الاسم *"><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inp} /></Field>
          <Field label="الجوال"><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inp} dir="ltr" /></Field>
          <Field label="النوع">
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className={inp}>
              <option value="individual">فرد</option><option value="farm">مزرعة</option><option value="clinic">عيادة بيطرية</option>
            </select>
          </Field>
          <Field label="الرصيد الافتتاحي"><input type="number" step="0.01" value={form.balance} onChange={(e) => setForm({ ...form, balance: +e.target.value })} className={inp} /></Field>
          <Field label="العنوان"><input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className={inp} /></Field>
          <Field label="ملاحظات"><input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={inp} /></Field>
          <div className="md:col-span-2 flex gap-2 justify-end">
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

const inp = "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary";
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="text-xs font-semibold mb-1 block">{label}</span>{children}</label>;
}
function Stat({ label, value, icon: Icon, tone }: { label: string; value: React.ReactNode; icon?: React.ComponentType<{ className?: string }>; tone?: "warning" }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`text-2xl font-extrabold mt-1 ${tone === "warning" ? "text-warning" : ""}`}>{value}</div>
      {Icon && <Icon className="h-5 w-5 text-primary/40 mt-2" />}
    </div>
  );
}
