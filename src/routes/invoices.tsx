import { createFileRoute } from "@tanstack/react-router";
import { Receipt } from "lucide-react";
import { ComingSoon } from "@/components/coming-soon";

export const Route = createFileRoute("/invoices")({
  head: () => ({ meta: [{ title: "الفواتير — الصيدلية البيطرية والزراعية" }] }),
  component: () => (
    <ComingSoon
      icon={Receipt}
      title="سجل الفواتير وفواتير المرتجعات"
      description="عرض، طباعة، وتصدير الفواتير مع دعم QR وتصميم عربي احترافي."
    />
  ),
});
