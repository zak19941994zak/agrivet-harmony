import { createFileRoute } from "@tanstack/react-router";
import { Users } from "lucide-react";
import { ComingSoon } from "@/components/coming-soon";

export const Route = createFileRoute("/customers")({
  head: () => ({ meta: [{ title: "العملاء — الصيدلية البيطرية والزراعية" }] }),
  component: () => (
    <ComingSoon
      icon={Users}
      title="إدارة العملاء والمزارع والعيادات"
      description="ملفات العملاء، رصيد الديون، سجل المدفوعات، ونظام ولاء — جاهز للتفعيل بعد ربط قاعدة البيانات."
    />
  ),
});
