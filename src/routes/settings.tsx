import { createFileRoute } from "@tanstack/react-router";
import { Settings as SettingsIcon } from "lucide-react";
import { ComingSoon } from "@/components/coming-soon";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "الإعدادات — الصيدلية البيطرية والزراعية" }] }),
  component: () => (
    <ComingSoon
      icon={SettingsIcon}
      title="إعدادات النظام والصلاحيات"
      description="إدارة المستخدمين، الأدوار (مالك، محاسب، كاشير، أمين مخزن، مدير)، العملات، والفروع."
    />
  ),
});
