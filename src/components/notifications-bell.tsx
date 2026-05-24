import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type Notif = { id: string; title: string; message: string | null; type: string | null; read: boolean; created_at: string };

export function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();

  const { data: notifs = [] } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const { data, error } = await supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(30);
      if (error) throw error;
      return data as Notif[];
    },
  });

  useEffect(() => {
    const ch = supabase.channel("notifs-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications" }, () => qc.invalidateQueries({ queryKey: ["notifications"] }))
      .subscribe();
    return () => void supabase.removeChannel(ch);
  }, [qc]);

  const unread = notifs.filter((n) => !n.read).length;

  const markAll = async () => {
    const ids = notifs.filter((n) => !n.read).map((n) => n.id);
    if (!ids.length) return;
    await supabase.from("notifications").update({ read: true }).in("id", ids);
    qc.invalidateQueries({ queryKey: ["notifications"] });
  };

  return (
    <div className="relative">
      <button onClick={() => setOpen((v) => !v)} className="relative rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition">
        <Bell className="h-5 w-5" />
        {unread > 0 && <span className="absolute top-0.5 left-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground px-1">{unread}</span>}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 mt-2 w-80 rounded-xl border border-border bg-popover shadow-elegant z-20 animate-in-up overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <span className="font-bold text-sm">التنبيهات</span>
              {unread > 0 && <button onClick={markAll} className="text-xs text-primary hover:underline">تعليم الكل كمقروء</button>}
            </div>
            <div className="max-h-96 overflow-y-auto">
              {notifs.length === 0 ? (
                <div className="text-center text-xs text-muted-foreground py-10">لا توجد تنبيهات</div>
              ) : notifs.map((n) => (
                <div key={n.id} className={`px-4 py-3 border-b border-border last:border-0 ${!n.read ? "bg-primary/5" : ""}`}>
                  <div className="flex items-start gap-2">
                    <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${n.type === "warning" ? "bg-warning" : n.type === "error" ? "bg-destructive" : "bg-primary"}`} />
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-sm">{n.title}</div>
                      {n.message && <div className="text-xs text-muted-foreground mt-0.5">{n.message}</div>}
                      <div className="text-[10px] text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString("ar-SA")}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
