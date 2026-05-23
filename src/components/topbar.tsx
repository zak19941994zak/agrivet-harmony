import { useEffect, useState } from "react";
import { Bell, Search, Moon, Sun, UserCircle2, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, ROLE_LABELS } from "@/hooks/use-auth";

export function Topbar({ title }: { title: string }) {
  const [dark, setDark] = useState(false);
  const [menu, setMenu] = useState(false);
  const { user, roles } = useAuth();

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  const roleLabel = roles[0] ? ROLE_LABELS[roles[0]] : "موظف";

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-md md:px-6">
      <h1 className="text-lg font-bold">{title}</h1>

      <div className="relative mx-auto hidden md:block w-full max-w-md">
        <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          placeholder="بحث عن منتج، فاتورة، عميل..."
          className="w-full rounded-xl border border-input bg-muted/40 py-2 pr-10 pl-3 text-sm outline-none focus:border-primary focus:bg-background focus:shadow-soft transition"
        />
      </div>

      <div className="mr-auto md:mr-0 flex items-center gap-2">
        <button
          onClick={() => setDark((d) => !d)}
          className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition"
          aria-label="تبديل الوضع"
        >
          {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
        <button className="relative rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 left-1.5 h-2 w-2 rounded-full bg-destructive" />
        </button>

        <div className="relative">
          <button
            onClick={() => setMenu((v) => !v)}
            className="flex items-center gap-2 rounded-xl border border-border px-2.5 py-1.5 hover:bg-accent transition"
          >
            <UserCircle2 className="h-6 w-6 text-primary" />
            <div className="hidden sm:block leading-tight text-right">
              <div className="text-xs font-semibold">{roleLabel}</div>
              <div className="text-[10px] text-muted-foreground truncate max-w-32">{user?.email}</div>
            </div>
          </button>
          {menu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenu(false)} />
              <div className="absolute left-0 mt-2 w-56 rounded-xl border border-border bg-popover p-1.5 shadow-elegant z-20 animate-in-up">
                <div className="px-3 py-2 border-b border-border mb-1">
                  <div className="text-xs text-muted-foreground">مسجل الدخول كـ</div>
                  <div className="text-sm font-semibold truncate">{user?.email}</div>
                </div>
                <button
                  onClick={async () => { await supabase.auth.signOut(); setMenu(false); }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition"
                >
                  <LogOut className="h-4 w-4" /> تسجيل الخروج
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
