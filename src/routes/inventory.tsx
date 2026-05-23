import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Barcode, Plus, Search } from "lucide-react";
import { products } from "@/lib/mock-data";

export const Route = createFileRoute("/inventory")({
  head: () => ({
    meta: [
      { title: "المخزون — نظام إدارة الصيدلية البيطرية والزراعية" },
      { name: "description", content: "إدارة شاملة للمنتجات: الأصناف، الكميات، تواريخ الصلاحية، والباركود." },
    ],
  }),
  component: Inventory,
});

const categories = ["الكل", "أدوية بيطرية", "لقاحات", "مبيدات زراعية", "أسمدة", "بذور", "أدوات زراعية"] as const;

function Inventory() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<(typeof categories)[number]>("الكل");

  const rows = useMemo(
    () =>
      products.filter(
        (p) =>
          (cat === "الكل" || p.category === cat) &&
          (!q || p.name.includes(q) || p.barcode.includes(q)),
      ),
    [q, cat],
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
        <button className="inline-flex items-center gap-2 rounded-xl bg-gradient-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-glow">
          <Plus className="h-4 w-4" /> إضافة منتج
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {categories.map((c) => (
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
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="text-right font-medium px-4 py-3">المنتج</th>
                <th className="text-right font-medium px-4 py-3">الفئة</th>
                <th className="text-right font-medium px-4 py-3">الباركود</th>
                <th className="text-right font-medium px-4 py-3">المخزون</th>
                <th className="text-right font-medium px-4 py-3">سعر التكلفة</th>
                <th className="text-right font-medium px-4 py-3">سعر البيع</th>
                <th className="text-right font-medium px-4 py-3">الصلاحية</th>
                <th className="text-right font-medium px-4 py-3">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => {
                const low = p.stock < p.minStock;
                const expSoon = new Date(p.expiry) < new Date("2026-06-01");
                return (
                  <tr key={p.id} className="border-t border-border hover:bg-muted/30 transition">
                    <td className="px-4 py-3 font-semibold">{p.name}</td>
                    <td className="px-4 py-3">{p.category}</td>
                    <td className="px-4 py-3 font-mono text-xs inline-flex items-center gap-1.5 text-muted-foreground">
                      <Barcode className="h-3.5 w-3.5" /> {p.barcode}
                    </td>
                    <td className="px-4 py-3 font-bold">{p.stock} <span className="text-muted-foreground text-xs">{p.unit}</span></td>
                    <td className="px-4 py-3">{p.cost} ر.س</td>
                    <td className="px-4 py-3 text-primary font-bold">{p.price} ر.س</td>
                    <td className="px-4 py-3 text-xs">{p.expiry}</td>
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
      </div>
    </div>
  );
}
