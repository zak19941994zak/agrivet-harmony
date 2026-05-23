import { createFileRoute } from "@tanstack/react-router";
import { BarChart3 } from "lucide-react";
import { ComingSoon } from "@/components/coming-soon";

export const Route = createFileRoute("/reports")({
  head: () => ({ meta: [{ title: "التقارير — الصيدلية البيطرية والزراعية" }] }),
  component: () => (
    <ComingSoon
      icon={BarChart3}
      title="تقارير شاملة"
      description="مبيعات، مشتريات، مخزون، صلاحيات، أرباح، ديون عملاء، وأرصدة موردين — مع تصدير وطباعة."
    />
  ),
});
