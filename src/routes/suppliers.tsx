import { createFileRoute } from "@tanstack/react-router";
import { Truck } from "lucide-react";
import { ComingSoon } from "@/components/coming-soon";

export const Route = createFileRoute("/suppliers")({
  head: () => ({ meta: [{ title: "الموردين — الصيدلية البيطرية والزراعية" }] }),
  component: () => (
    <ComingSoon
      icon={Truck}
      title="إدارة الموردين والمشتريات"
      description="ملفات الموردين، فواتير الشراء، الأرصدة المالية، وتقارير المورد — جاهز للتفعيل."
    />
  ),
});
