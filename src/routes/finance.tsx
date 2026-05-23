import { createFileRoute } from "@tanstack/react-router";
import { Wallet } from "lucide-react";
import { ComingSoon } from "@/components/coming-soon";

export const Route = createFileRoute("/finance")({
  head: () => ({ meta: [{ title: "الحسابات — الصيدلية البيطرية والزراعية" }] }),
  component: () => (
    <ComingSoon
      icon={Wallet}
      title="الحسابات والصندوق اليومي"
      description="المصروفات، الإيرادات، تقارير الربح والخسارة، والتدفق النقدي مع تصدير PDF/Excel."
    />
  ),
});
