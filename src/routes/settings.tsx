import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Shield, Trash2, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, ROLE_LABELS, type AppRole } from "@/hooks/use-auth";
import { toast } from "sonner";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "الإعدادات — الصيدلية البيطرية والزراعية" }] }),
  component: SettingsPage,
});

type Profile = { id: string; full_name: string | null; email: string | null; phone: string | null };
type RoleRow = { id: string; user_id: string; role: AppRole };

const ALL_ROLES: AppRole[] = ["owner", "admin", "accountant", "cashier", "warehouse"];

function SettingsPage() {
  const { user, roles } = useAuth();
  const isOwner = roles.includes("owner");
  const qc = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ["my-profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", user!.id).single();
      if (error) throw error;
      return data as Profile;
    },
  });

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  useEffect(() => { if (profile) { setName(profile.full_name ?? ""); setPhone(profile.phone ?? ""); } }, [profile]);

  const saveProfile = async () => {
    const { error } = await supabase.from("profiles").update({ full_name: name, phone }).eq("id", user!.id);
    if (error) toast.error(error.message); else toast.success("تم حفظ الملف");
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
        <h3 className="font-bold mb-4">الملف الشخصي</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="الاسم الكامل"><input value={name} onChange={(e) => setName(e.target.value)} className={inp} /></Field>
          <Field label="البريد الإلكتروني"><input value={profile?.email ?? ""} disabled className={inp + " opacity-60"} dir="ltr" /></Field>
          <Field label="الجوال"><input value={phone} onChange={(e) => setPhone(e.target.value)} className={inp} dir="ltr" /></Field>
          <Field label="الدور الحالي"><div className="rounded-lg bg-muted/50 px-3 py-2 text-sm font-bold text-primary">{roles.map((r) => ROLE_LABELS[r]).join("، ") || "—"}</div></Field>
        </div>
        <div className="mt-4 text-left">
          <button onClick={saveProfile} className="rounded-xl bg-gradient-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-glow">حفظ التغييرات</button>
        </div>
      </div>

      {isOwner ? <UsersAndRoles qc={qc} /> : (
        <div className="rounded-2xl border border-border bg-card p-5 shadow-soft text-sm text-muted-foreground">
          إدارة المستخدمين والصلاحيات متاحة لصاحب الحساب فقط.
        </div>
      )}
    </div>
  );
}

function UsersAndRoles({ qc }: { qc: ReturnType<typeof useQueryClient> }) {
  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ["all-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Profile[];
    },
  });

  const { data: allRoles = [] } = useQuery({
    queryKey: ["all-roles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("*");
      if (error) throw error;
      return data as RoleRow[];
    },
  });

  const rolesOf = (uid: string) => allRoles.filter((r) => r.user_id === uid).map((r) => r.role);

  const toggleRole = async (uid: string, role: AppRole, on: boolean) => {
    if (on) {
      const { error } = await supabase.from("user_roles").insert({ user_id: uid, role });
      if (error) toast.error(error.message); else toast.success(`تم منح ${ROLE_LABELS[role]}`);
    } else {
      const { error } = await supabase.from("user_roles").delete().eq("user_id", uid).eq("role", role);
      if (error) toast.error(error.message); else toast.success(`تم إلغاء ${ROLE_LABELS[role]}`);
    }
    qc.invalidateQueries({ queryKey: ["all-roles"] });
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="h-5 w-5 text-primary" />
        <h3 className="font-bold">إدارة المستخدمين والصلاحيات</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-4 flex items-center gap-1.5">
        <UserPlus className="h-3.5 w-3.5" /> يقوم المستخدمون الجدد بالتسجيل من شاشة الدخول، ثم تُمنح الأدوار من هنا.
      </p>

      {isLoading ? <div className="grid place-items-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> :
      <div className="overflow-x-auto"><table className="w-full text-sm">
        <thead className="bg-muted/50 text-muted-foreground"><tr>
          <th className="text-right font-medium px-3 py-3">المستخدم</th>
          {ALL_ROLES.map((r) => <th key={r} className="text-center font-medium px-3 py-3">{ROLE_LABELS[r]}</th>)}
        </tr></thead>
        <tbody>{profiles.map((p) => {
          const userRoles = rolesOf(p.id);
          return (
            <tr key={p.id} className="border-t border-border">
              <td className="px-3 py-3">
                <div className="font-semibold">{p.full_name ?? p.email}</div>
                <div className="text-xs text-muted-foreground" dir="ltr">{p.email}</div>
              </td>
              {ALL_ROLES.map((r) => {
                const on = userRoles.includes(r);
                return (
                  <td key={r} className="px-3 py-3 text-center">
                    <button onClick={() => toggleRole(p.id, r, !on)}
                      className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${on ? "bg-primary text-primary-foreground shadow-soft" : "bg-muted hover:bg-accent text-muted-foreground"}`}>
                      {on ? "✓" : "—"}
                    </button>
                  </td>
                );
              })}
            </tr>
          );
        })}</tbody>
      </table></div>}

      <div className="mt-5 rounded-xl bg-muted/40 p-4 text-xs text-muted-foreground flex items-start gap-2">
        <Trash2 className="h-4 w-4 mt-0.5 shrink-0" />
        لحذف مستخدم نهائياً، استخدم لوحة Lovable Cloud → Users.
      </div>
    </div>
  );
}

const inp = "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary";
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="text-xs font-semibold mb-1 block">{label}</span>{children}</label>;
}
