import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Barcode, Loader2, Plus, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/inventory")({
  head: () => ({
    meta: [
      { title: "المخزون — نظام إدارة الصيدلية البيطرية والزراعية" },
      { name: "description", content: "إدارة شاملة للمنتجات: الأصناف، الكميات، تواريخ الصلاحية، والباركود." },
    ],
  }),
  component: Inventory,
});

type ProductRow = {
  id: string;
  name: string;
  barcode: string | null;
  unit: string;
  stock: number;
  min_stock: number;
  cost: number;
  price: number;
  expiry: string | null;
  category_id: string | null;
  categories: { name: string } | null;
};

function Inventory() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("الكل");
  const [addOpen, setAddOpen] = useState(false);
  const qc = useQueryClient();

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("id, name").order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, barcode, unit, stock, min_stock, cost, price, expiry, category_id, categories(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as ProductRow[];
    },
  });

  // realtime
  useEffect(() => {
    const channel = supabase
      .channel("products-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => {
        qc.invalidateQueries({ queryKey: ["products"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [qc]);

  const cats = useMemo(() => ["الكل", ...categories.map((c) => c.name)], [categories]);

  const rows = useMemo(
    () =>
      products.filter(
        (p) =>
          (cat === "الكل" || p.categories?.name === cat) &&
          (!q || p.name.includes(q) || (p.barcode ?? "").includes(q)),
      ),
    [products, q, cat],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-64">
          <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="بحث بالاسم أو الباركود..."
            className="w-full rounded-xl border border-input bg-card py-2.5 pr-10 pl-3 text-sm outline-none focus:border-primary transition shadow-soft"
          />
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-glow"
        >
          <Plus className="h-4 w-4" /> إضافة منتج
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {cats.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
              cat === c ? "bg-primary text-primary-foreground shadow-soft" : "bg-card border border-border hover:bg-accent"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
        {isLoading ? (
          <div className="grid place-items-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : rows.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground text-sm">لا توجد منتجات مطابقة</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="text-right font-medium px-4 py-3">المنتج</th>
                  <th className="text-right font-medium px-4 py-3">الفئة</th>
                  <th className="text-right font-medium px-4 py-3">الباركود</th>
                  <th className="text-right font-medium px-4 py-3">المخزون</th>
                  <th className="text-right font-medium px-4 py-3">التكلفة</th>
                  <th className="text-right font-medium px-4 py-3">سعر البيع</th>
                  <th className="text-right font-medium px-4 py-3">الصلاحية</th>
                  <th className="text-right font-medium px-4 py-3">الحالة</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => {
                  const low = p.stock < p.min_stock;
                  const expSoon = p.expiry && new Date(p.expiry) < new Date("2026-06-01");
                  return (
                    <tr key={p.id} className="border-t border-border hover:bg-muted/30 transition">
                      <td className="px-4 py-3 font-semibold">{p.name}</td>
                      <td className="px-4 py-3">{p.categories?.name ?? "—"}</td>
                      <td className="px-4 py-3 font-mono text-xs inline-flex items-center gap-1.5 text-muted-foreground">
                        <Barcode className="h-3.5 w-3.5" /> {p.barcode}
                      </td>
                      <td className="px-4 py-3 font-bold">{p.stock} <span className="text-muted-foreground text-xs">{p.unit}</span></td>
                      <td className="px-4 py-3">{p.cost} ر.س</td>
                      <td className="px-4 py-3 text-primary font-bold">{p.price} ر.س</td>
                      <td className="px-4 py-3 text-xs">{p.expiry ?? "—"}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {low && <span className="rounded-md bg-destructive/15 px-2 py-0.5 text-[11px] text-destructive font-semibold">منخفض</span>}
                          {expSoon && <span className="rounded-md bg-warning/20 px-2 py-0.5 text-[11px] text-warning font-semibold">قارب الانتهاء</span>}
                          {!low && !expSoon && <span className="rounded-md bg-success/15 px-2 py-0.5 text-[11px] text-success font-semibold">جيد</span>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {addOpen && <AddProductDialog categories={categories} onClose={() => setAddOpen(false)} />}
    </div>
  );
}

function AddProductDialog({
  categories,
  onClose,
}: {
  categories: { id: string; name: string }[];
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    name: "",
    barcode: "",
    category_id: categories[0]?.id ?? "",
    unit: "قطعة",
    stock: 0,
    min_stock: 0,
    cost: 0,
    price: 0,
    expiry: "",
  });
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    const payload = { ...form, expiry: form.expiry || null, barcode: form.barcode || null };
    const { error } = await supabase.from("products").insert(payload);
    setLoading(false);
    if (error) {
      setErr(error.message);
      return;
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background/70 backdrop-blur-sm p-4 animate-in-up">
      <div className="w-full max-w-2xl rounded-2xl border border-border bg-card shadow-elegant">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <h3 className="font-bold text-lg">إضافة منتج جديد</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">✕</button>
        </div>
        <form onSubmit={submit} className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="اسم المنتج *">
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inp} />
          </Field>
          <Field label="الفئة">
            <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className={inp}>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="الباركود">
            <input value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} className={inp} dir="ltr" />
          </Field>
          <Field label="الوحدة">
            <input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className={inp} />
          </Field>
          <Field label="الكمية بالمخزون">
            <input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: +e.target.value })} className={inp} />
          </Field>
          <Field label="الحد الأدنى للتنبيه">
            <input type="number" value={form.min_stock} onChange={(e) => setForm({ ...form, min_stock: +e.target.value })} className={inp} />
          </Field>
          <Field label="سعر التكلفة">
            <input type="number" step="0.01" value={form.cost} onChange={(e) => setForm({ ...form, cost: +e.target.value })} className={inp} />
          </Field>
          <Field label="سعر البيع *">
            <input required type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: +e.target.value })} className={inp} />
          </Field>
          <Field label="تاريخ الصلاحية">
            <input type="date" value={form.expiry} onChange={(e) => setForm({ ...form, expiry: e.target.value })} className={inp} />
          </Field>
          {err && <div className="md:col-span-2 rounded-lg bg-destructive/10 border border-destructive/30 px-3 py-2 text-sm text-destructive">{err}</div>}
          <div className="md:col-span-2 flex gap-2 justify-end">
            <button type="button" onClick={onClose} className="rounded-xl border border-border px-5 py-2.5 text-sm font-semibold hover:bg-accent">إلغاء</button>
            <button disabled={loading} className="rounded-xl bg-gradient-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-glow disabled:opacity-60 inline-flex items-center gap-2">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />} حفظ المنتج
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const inp = "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary transition";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold mb-1 block">{label}</span>
      {children}
    </label>
  );
}
