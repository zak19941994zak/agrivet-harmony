import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Minus, Plus, Printer, Search, Trash2, Wallet, CreditCard, Landmark } from "lucide-react";
import { products, type Product } from "@/lib/mock-data";

export const Route = createFileRoute("/pos")({
  head: () => ({
    meta: [
      { title: "نقطة البيع — نظام إدارة الصيدلية البيطرية والزراعية" },
      { name: "description", content: "شاشة نقطة بيع متقدمة بدعم الباركود، الخصومات، وطرق دفع متعددة." },
    ],
  }),
  component: POS,
});

type CartItem = Product & { qty: number };

function POS() {
  const [q, setQ] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [pay, setPay] = useState<"نقدي" | "تحويل بنكي" | "آجل">("نقدي");

  const filtered = useMemo(
    () => products.filter((p) => !q || p.name.includes(q) || p.barcode.includes(q) || p.category.includes(q)),
    [q],
  );

  const add = (p: Product) =>
    setCart((c) => {
      const ex = c.find((x) => x.id === p.id);
      return ex ? c.map((x) => (x.id === p.id ? { ...x, qty: x.qty + 1 } : x)) : [...c, { ...p, qty: 1 }];
    });

  const setQty = (id: string, qty: number) =>
    setCart((c) => c.flatMap((x) => (x.id === id ? (qty > 0 ? [{ ...x, qty }] : []) : [x])));

  const subtotal = cart.reduce((s, x) => s + x.price * x.qty, 0);
  const tax = Math.round(subtotal * 0.15);
  const total = Math.max(0, subtotal + tax - discount);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 h-[calc(100vh-8rem)]">
      {/* Products */}
      <div className="lg:col-span-3 flex flex-col rounded-2xl border border-border bg-card shadow-soft overflow-hidden">
        <div className="p-4 border-b border-border">
          <div className="relative">
            <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="مسح الباركود أو بحث بالاسم / الفئة..."
              className="w-full rounded-xl border border-input bg-muted/40 py-3 pr-10 pl-3 text-sm outline-none focus:border-primary focus:bg-background transition"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 overflow-y-auto p-4">
          {filtered.map((p) => (
            <button
              key={p.id}
              onClick={() => add(p)}
              className="group text-right rounded-xl border border-border bg-background p-3 hover:border-primary hover:shadow-elegant transition-all"
            >
              <div className="text-xs text-muted-foreground mb-1">{p.category}</div>
              <div className="font-semibold text-sm leading-snug line-clamp-2 min-h-10">{p.name}</div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-primary font-extrabold">{p.price} ر.س</span>
                <span className={`text-[11px] rounded-md px-1.5 py-0.5 ${p.stock < p.minStock ? "bg-destructive/15 text-destructive" : "bg-muted text-muted-foreground"}`}>
                  متوفر: {p.stock}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Cart */}
      <div className="lg:col-span-2 flex flex-col rounded-2xl border border-border bg-card shadow-soft overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="font-bold">السلة الحالية</h3>
          <button onClick={() => setCart([])} className="text-xs text-destructive hover:underline">إفراغ</button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {cart.length === 0 && (
            <div className="text-center text-sm text-muted-foreground py-10">السلة فارغة — ابدأ بمسح منتج</div>
          )}
          {cart.map((item) => (
            <div key={item.id} className="rounded-xl border border-border bg-background p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-semibold text-sm line-clamp-1">{item.name}</div>
                  <div className="text-xs text-muted-foreground">{item.price} × {item.qty}</div>
                </div>
                <button onClick={() => setQty(item.id, 0)} className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <div className="inline-flex items-center rounded-lg border border-border">
                  <button className="p-1.5 hover:bg-accent" onClick={() => setQty(item.id, item.qty - 1)}><Minus className="h-3.5 w-3.5" /></button>
                  <span className="w-9 text-center text-sm font-semibold">{item.qty}</span>
                  <button className="p-1.5 hover:bg-accent" onClick={() => setQty(item.id, item.qty + 1)}><Plus className="h-3.5 w-3.5" /></button>
                </div>
                <span className="font-extrabold text-primary">{(item.price * item.qty).toLocaleString()} ر.س</span>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-border p-4 space-y-3 bg-muted/30">
          <div className="flex justify-between text-sm"><span>الإجمالي الفرعي</span><span>{subtotal.toLocaleString()} ر.س</span></div>
          <div className="flex justify-between text-sm"><span>الضريبة (15%)</span><span>{tax.toLocaleString()} ر.س</span></div>
          <div className="flex items-center justify-between text-sm">
            <span>خصم</span>
            <input
              type="number"
              value={discount}
              onChange={(e) => setDiscount(Math.max(0, Number(e.target.value) || 0))}
              className="w-24 rounded-md border border-input bg-background px-2 py-1 text-right text-sm outline-none focus:border-primary"
            />
          </div>
          <div className="flex justify-between text-lg font-extrabold border-t border-border pt-3">
            <span>الإجمالي</span><span className="text-primary">{total.toLocaleString()} ر.س</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { key: "نقدي", icon: Wallet },
              { key: "تحويل بنكي", icon: Landmark },
              { key: "آجل", icon: CreditCard },
            ].map(({ key, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setPay(key as typeof pay)}
                className={`flex flex-col items-center justify-center gap-1 rounded-xl border p-2.5 text-xs transition ${
                  pay === key ? "border-primary bg-primary/10 text-primary font-bold" : "border-border bg-background hover:bg-accent"
                }`}
              >
                <Icon className="h-4 w-4" /> {key}
              </button>
            ))}
          </div>

          <button
            disabled={cart.length === 0}
            className="w-full rounded-xl bg-gradient-primary py-3 font-bold text-primary-foreground shadow-glow disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
          >
            <Printer className="h-5 w-5" /> إتمام البيع وطباعة الفاتورة
          </button>
        </div>
      </div>
    </div>
  );
}
