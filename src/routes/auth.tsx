import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Stethoscope, Loader2 } from "lucide-react";

export const Route = createFileRoute("/auth")({
  validateSearch: z.object({ mode: z.enum(["login", "signup"]).optional() }),
  head: () => ({
    meta: [
      { title: "تسجيل الدخول — نظام إدارة الصيدلية البيطرية والزراعية" },
      { name: "description", content: "سجّل الدخول أو أنشئ حساباً للوصول إلى نظام إدارة الصيدلية." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { mode = "login" } = Route.useSearch();
  const navigate = useNavigate();
  const [isSignup, setIsSignup] = useState(mode === "signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      if (isSignup) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: name },
          },
        });
        if (error) throw error;
        navigate({ to: "/" });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/" });
      }
    } catch (e: any) {
      setErr(e?.message ?? "حدث خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full grid lg:grid-cols-2 bg-background">
      {/* Brand */}
      <div className="hidden lg:flex flex-col justify-between bg-gradient-sidebar text-sidebar-foreground p-10 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_30%_20%,oklch(0.78_0.17_155)_0%,transparent_50%)]" />
        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-sidebar-primary text-sidebar-primary-foreground shadow-glow">
              <Stethoscope className="h-6 w-6" />
            </div>
            <div>
              <div className="font-extrabold">الصيدلية البيطرية والزراعية</div>
              <div className="text-xs text-sidebar-foreground/70">نظام ERP متكامل</div>
            </div>
          </div>
        </div>
        <div className="relative space-y-5">
          <h2 className="text-4xl font-extrabold leading-tight">
            أدر صيدليتك<br />باحترافية ودقة
          </h2>
          <p className="text-sidebar-foreground/80 leading-relaxed">
            نقطة بيع، مخزون، فواتير، عملاء وموردين، تقارير مالية — كل ما تحتاجه في نظام واحد سريع وآمن مع تحديثات لحظية وصلاحيات متعددة.
          </p>
          <ul className="space-y-2 text-sm text-sidebar-foreground/85">
            <li>• إدارة كاملة للمخزون مع تنبيهات الصلاحية</li>
            <li>• نقطة بيع تدعم الباركود وطباعة الفواتير</li>
            <li>• 5 أدوار (مالك، مدير، محاسب، كاشير، أمين مخزن)</li>
          </ul>
        </div>
        <div className="relative text-xs text-sidebar-foreground/60">© {new Date().getFullYear()} — جميع الحقوق محفوظة</div>
      </div>

      {/* Form */}
      <div className="flex items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-md animate-in-up">
          <div className="text-right mb-8">
            <h1 className="text-3xl font-extrabold">{isSignup ? "إنشاء حساب جديد" : "تسجيل الدخول"}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {isSignup ? "أول مستخدم يتم تعيينه كمالك تلقائياً" : "أدخل بياناتك للدخول إلى لوحة التحكم"}
            </p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            {isSignup && (
              <div>
                <label className="text-sm font-semibold mb-1.5 block">الاسم الكامل</label>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-input bg-card px-4 py-3 outline-none focus:border-primary transition"
                  placeholder="اسمك الكامل"
                />
              </div>
            )}
            <div>
              <label className="text-sm font-semibold mb-1.5 block">البريد الإلكتروني</label>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-input bg-card px-4 py-3 outline-none focus:border-primary transition"
                placeholder="you@clinic.sa"
                dir="ltr"
              />
            </div>
            <div>
              <label className="text-sm font-semibold mb-1.5 block">كلمة المرور</label>
              <input
                required
                type="password"
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-input bg-card px-4 py-3 outline-none focus:border-primary transition"
                placeholder="••••••••"
                dir="ltr"
              />
            </div>

            {err && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {err}
              </div>
            )}

            <button
              disabled={loading}
              className="w-full rounded-xl bg-gradient-primary py-3 font-bold text-primary-foreground shadow-glow disabled:opacity-60 flex items-center justify-center gap-2 transition"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSignup ? "إنشاء الحساب" : "تسجيل الدخول"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            {isSignup ? "لديك حساب بالفعل؟" : "ليس لديك حساب؟"}{" "}
            <button onClick={() => { setIsSignup((v) => !v); setErr(null); }} className="text-primary font-semibold hover:underline">
              {isSignup ? "تسجيل الدخول" : "إنشاء حساب جديد"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
